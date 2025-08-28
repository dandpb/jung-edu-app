#!/bin/bash

# Database Migration Script for jaqEdu
# This script handles database schema migrations, backups, and rollbacks

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
MIGRATIONS_DIR="$PROJECT_ROOT/migrations"
BACKUP_DIR="$PROJECT_ROOT/backups"

# Default values
ENVIRONMENT="development"
DRY_RUN=false
VERBOSE=false
FORCE=false
BACKUP_BEFORE_MIGRATE=true

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

show_usage() {
    cat << EOF
Usage: $0 [OPTIONS] COMMAND

Database migration script for jaqEdu

COMMANDS:
    migrate     Run pending migrations
    rollback    Rollback last migration
    status      Show migration status
    create      Create new migration file
    reset       Reset database (DANGEROUS)
    backup      Create database backup
    restore     Restore from backup
    health      Check database health

OPTIONS:
    -e, --env ENV       Environment (development|staging|production) [default: development]
    -d, --dry-run       Show what would be done without executing
    -v, --verbose       Enable verbose output
    -f, --force         Force operation (skip confirmations)
    -n, --no-backup     Skip backup before migration
    -h, --help          Show this help message

EXAMPLES:
    $0 migrate                          # Run pending migrations in development
    $0 -e production migrate            # Run migrations in production
    $0 rollback                         # Rollback last migration
    $0 create "add_user_preferences"    # Create new migration file
    $0 backup                           # Create database backup
    $0 health                           # Check database connectivity

EOF
}

# Parse command line arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -e|--env)
                ENVIRONMENT="$2"
                shift 2
                ;;
            -d|--dry-run)
                DRY_RUN=true
                shift
                ;;
            -v|--verbose)
                VERBOSE=true
                shift
                ;;
            -f|--force)
                FORCE=true
                shift
                ;;
            -n|--no-backup)
                BACKUP_BEFORE_MIGRATE=false
                shift
                ;;
            -h|--help)
                show_usage
                exit 0
                ;;
            *)
                COMMAND="$1"
                shift
                ARGS=("$@")
                break
                ;;
        esac
    done

    if [[ -z "${COMMAND:-}" ]]; then
        log_error "Command is required. Use -h for help."
    fi
}

# Load environment configuration
load_env_config() {
    case $ENVIRONMENT in
        development)
            ENV_FILE="$PROJECT_ROOT/.env.development"
            ;;
        staging)
            ENV_FILE="$PROJECT_ROOT/.env.staging"
            ;;
        production)
            ENV_FILE="$PROJECT_ROOT/.env.production"
            ;;
        *)
            log_error "Invalid environment: $ENVIRONMENT"
            ;;
    esac

    if [[ -f "$ENV_FILE" ]]; then
        source "$ENV_FILE"
        log_info "Loaded configuration for $ENVIRONMENT environment"
    else
        log_warning "Environment file not found: $ENV_FILE"
    fi

    # Set default DATABASE_URL if not provided
    if [[ -z "${DATABASE_URL:-}" ]]; then
        case $ENVIRONMENT in
            development)
                DATABASE_URL="postgresql://postgres:password@localhost:5432/jaqedu_dev"
                ;;
            staging)
                DATABASE_URL="postgresql://postgres:password@postgres-staging:5432/jaqedu_staging"
                ;;
            production)
                DATABASE_URL="${DATABASE_URL:-}"
                if [[ -z "$DATABASE_URL" ]]; then
                    log_error "DATABASE_URL must be set for production environment"
                fi
                ;;
        esac
    fi

    log_info "Using database: $(echo "$DATABASE_URL" | sed 's/:[^@]*@/:***@/')"
}

# Check database connectivity
check_db_health() {
    log_info "Checking database connectivity..."
    
    if $VERBOSE; then
        psql "$DATABASE_URL" -c "SELECT version();" || log_error "Cannot connect to database"
    else
        psql "$DATABASE_URL" -c "SELECT version();" > /dev/null 2>&1 || log_error "Cannot connect to database"
    fi
    
    log_success "Database is accessible"
}

# Create migrations table if it doesn't exist
ensure_migrations_table() {
    log_info "Ensuring migrations table exists..."
    
    psql "$DATABASE_URL" -v ON_ERROR_STOP=1 << 'SQL'
CREATE TABLE IF NOT EXISTS schema_migrations (
    version VARCHAR(255) PRIMARY KEY,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    checksum VARCHAR(255),
    description TEXT
);

CREATE INDEX IF NOT EXISTS idx_schema_migrations_applied_at 
ON schema_migrations(applied_at);
SQL

    log_success "Migrations table ready"
}

# Get list of pending migrations
get_pending_migrations() {
    if [[ ! -d "$MIGRATIONS_DIR" ]]; then
        mkdir -p "$MIGRATIONS_DIR"
        log_info "Created migrations directory: $MIGRATIONS_DIR"
        return
    fi

    # Get applied migrations
    local applied_migrations
    applied_migrations=$(psql "$DATABASE_URL" -t -c "SELECT version FROM schema_migrations ORDER BY version;" 2>/dev/null | tr -d ' ' | grep -v '^$' || true)

    # Get all migration files
    local all_migrations
    all_migrations=$(find "$MIGRATIONS_DIR" -name "*.sql" -type f | sort | xargs -I {} basename {} .sql)

    # Find pending migrations
    PENDING_MIGRATIONS=()
    while IFS= read -r migration; do
        if [[ -n "$migration" ]] && ! echo "$applied_migrations" | grep -q "^$migration$"; then
            PENDING_MIGRATIONS+=("$migration")
        fi
    done <<< "$all_migrations"
}

# Create database backup
create_backup() {
    local backup_name="${1:-$(date +%Y%m%d_%H%M%S)_${ENVIRONMENT}}"
    local backup_file="$BACKUP_DIR/${backup_name}.sql"
    
    mkdir -p "$BACKUP_DIR"
    
    log_info "Creating backup: $backup_file"
    
    if $DRY_RUN; then
        log_info "[DRY RUN] Would create backup: $backup_file"
        return
    fi
    
    pg_dump "$DATABASE_URL" --no-owner --no-privileges --clean --if-exists > "$backup_file"
    
    # Compress backup
    gzip "$backup_file"
    backup_file="${backup_file}.gz"
    
    log_success "Backup created: $backup_file"
    
    # Keep only last 10 backups
    find "$BACKUP_DIR" -name "*.sql.gz" | sort -r | tail -n +11 | xargs -r rm
}

# Run migrations
run_migrations() {
    check_db_health
    ensure_migrations_table
    get_pending_migrations
    
    if [[ ${#PENDING_MIGRATIONS[@]} -eq 0 ]]; then
        log_success "No pending migrations"
        return
    fi
    
    log_info "Found ${#PENDING_MIGRATIONS[@]} pending migrations:"
    for migration in "${PENDING_MIGRATIONS[@]}"; do
        echo "  - $migration"
    done
    
    if [[ "$ENVIRONMENT" == "production" ]] && [[ "$FORCE" != "true" ]]; then
        read -p "Continue with production migration? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "Migration cancelled"
            exit 0
        fi
    fi
    
    # Create backup before migration
    if [[ "$BACKUP_BEFORE_MIGRATE" == "true" ]] && [[ "$DRY_RUN" != "true" ]]; then
        create_backup "pre_migration_$(date +%Y%m%d_%H%M%S)"
    fi
    
    # Run migrations
    for migration in "${PENDING_MIGRATIONS[@]}"; do
        local migration_file="$MIGRATIONS_DIR/${migration}.sql"
        local checksum=$(sha256sum "$migration_file" | cut -d' ' -f1)
        
        log_info "Running migration: $migration"
        
        if $DRY_RUN; then
            log_info "[DRY RUN] Would run: $migration_file"
            continue
        fi
        
        # Begin transaction
        psql "$DATABASE_URL" -v ON_ERROR_STOP=1 << SQL
BEGIN;

-- Run migration
\i $migration_file

-- Record migration
INSERT INTO schema_migrations (version, checksum, description) 
VALUES ('$migration', '$checksum', 'Applied via migration script');

COMMIT;
SQL
        
        log_success "Applied migration: $migration"
    done
    
    log_success "All migrations completed successfully"
}

# Rollback last migration
rollback_migration() {
    check_db_health
    
    # Get last applied migration
    local last_migration
    last_migration=$(psql "$DATABASE_URL" -t -c "SELECT version FROM schema_migrations ORDER BY applied_at DESC LIMIT 1;" | tr -d ' ')
    
    if [[ -z "$last_migration" ]]; then
        log_info "No migrations to rollback"
        return
    fi
    
    log_warning "Rolling back migration: $last_migration"
    
    if [[ "$ENVIRONMENT" == "production" ]] && [[ "$FORCE" != "true" ]]; then
        read -p "Continue with production rollback? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "Rollback cancelled"
            exit 0
        fi
    fi
    
    # Create backup before rollback
    if [[ "$BACKUP_BEFORE_MIGRATE" == "true" ]] && [[ "$DRY_RUN" != "true" ]]; then
        create_backup "pre_rollback_$(date +%Y%m%d_%H%M%S)"
    fi
    
    # Look for rollback file
    local rollback_file="$MIGRATIONS_DIR/${last_migration}_down.sql"
    
    if [[ ! -f "$rollback_file" ]]; then
        log_error "Rollback file not found: $rollback_file"
    fi
    
    if $DRY_RUN; then
        log_info "[DRY RUN] Would rollback: $last_migration"
        return
    fi
    
    # Run rollback
    psql "$DATABASE_URL" -v ON_ERROR_STOP=1 << SQL
BEGIN;

-- Run rollback
\i $rollback_file

-- Remove migration record
DELETE FROM schema_migrations WHERE version = '$last_migration';

COMMIT;
SQL
    
    log_success "Rolled back migration: $last_migration"
}

# Show migration status
show_status() {
    check_db_health
    ensure_migrations_table
    get_pending_migrations
    
    echo
    echo "=== Migration Status ==="
    echo "Environment: $ENVIRONMENT"
    echo "Database: $(echo "$DATABASE_URL" | sed 's/:[^@]*@/:***@/')"
    echo
    
    # Applied migrations
    local applied_count
    applied_count=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM schema_migrations;" | tr -d ' ')
    echo "Applied migrations: $applied_count"
    
    if [[ "$applied_count" -gt 0 ]]; then
        echo "Last migration: $(psql "$DATABASE_URL" -t -c "SELECT version FROM schema_migrations ORDER BY applied_at DESC LIMIT 1;" | tr -d ' ')"
        echo "Applied at: $(psql "$DATABASE_URL" -t -c "SELECT applied_at FROM schema_migrations ORDER BY applied_at DESC LIMIT 1;" | tr -d ' ')"
    fi
    
    echo
    echo "Pending migrations: ${#PENDING_MIGRATIONS[@]}"
    for migration in "${PENDING_MIGRATIONS[@]}"; do
        echo "  - $migration"
    done
    echo
}

# Create new migration file
create_migration() {
    local description="${1:-}"
    if [[ -z "$description" ]]; then
        log_error "Migration description is required"
    fi
    
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local filename="${timestamp}_${description}"
    local migration_file="$MIGRATIONS_DIR/${filename}.sql"
    local rollback_file="$MIGRATIONS_DIR/${filename}_down.sql"
    
    mkdir -p "$MIGRATIONS_DIR"
    
    # Create migration file
    cat > "$migration_file" << EOF
-- Migration: $description
-- Created: $(date)

BEGIN;

-- Add your migration SQL here
-- Example:
-- CREATE TABLE example (
--     id SERIAL PRIMARY KEY,
--     name VARCHAR(255) NOT NULL,
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );

COMMIT;
EOF

    # Create rollback file
    cat > "$rollback_file" << EOF
-- Rollback: $description
-- Created: $(date)

BEGIN;

-- Add your rollback SQL here
-- Example:
-- DROP TABLE IF EXISTS example;

COMMIT;
EOF
    
    log_success "Created migration files:"
    echo "  - $migration_file"
    echo "  - $rollback_file"
}

# Reset database (DANGEROUS)
reset_database() {
    log_warning "This will DROP ALL DATA in the database!"
    log_warning "Environment: $ENVIRONMENT"
    log_warning "Database: $(echo "$DATABASE_URL" | sed 's/:[^@]*@/:***@/')"
    
    if [[ "$FORCE" != "true" ]]; then
        read -p "Are you ABSOLUTELY sure you want to reset the database? Type 'RESET' to continue: " -r
        if [[ "$REPLY" != "RESET" ]]; then
            log_info "Database reset cancelled"
            exit 0
        fi
    fi
    
    if $DRY_RUN; then
        log_info "[DRY RUN] Would reset database"
        return
    fi
    
    # Create backup before reset
    create_backup "pre_reset_$(date +%Y%m%d_%H%M%S)"
    
    # Drop all tables
    psql "$DATABASE_URL" -v ON_ERROR_STOP=1 << 'SQL'
DO $$ DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = current_schema()) LOOP
        EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
    END LOOP;
END $$;
SQL
    
    log_success "Database reset completed"
    
    # Run all migrations
    log_info "Running all migrations..."
    run_migrations
}

# Restore from backup
restore_backup() {
    local backup_file="${1:-}"
    if [[ -z "$backup_file" ]]; then
        log_error "Backup file is required"
    fi
    
    if [[ ! -f "$backup_file" ]]; then
        # Try with .gz extension
        if [[ -f "${backup_file}.gz" ]]; then
            backup_file="${backup_file}.gz"
        else
            log_error "Backup file not found: $backup_file"
        fi
    fi
    
    log_warning "Restoring from backup: $backup_file"
    log_warning "This will REPLACE ALL DATA in the database!"
    
    if [[ "$FORCE" != "true" ]]; then
        read -p "Continue with restore? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "Restore cancelled"
            exit 0
        fi
    fi
    
    if $DRY_RUN; then
        log_info "[DRY RUN] Would restore from: $backup_file"
        return
    fi
    
    # Create backup before restore
    create_backup "pre_restore_$(date +%Y%m%d_%H%M%S)"
    
    # Restore database
    if [[ "$backup_file" == *.gz ]]; then
        gunzip -c "$backup_file" | psql "$DATABASE_URL" -v ON_ERROR_STOP=1
    else
        psql "$DATABASE_URL" -v ON_ERROR_STOP=1 < "$backup_file"
    fi
    
    log_success "Database restored from: $backup_file"
}

# Main execution
main() {
    parse_args "$@"
    load_env_config
    
    case $COMMAND in
        migrate)
            run_migrations
            ;;
        rollback)
            rollback_migration
            ;;
        status)
            show_status
            ;;
        create)
            create_migration "${ARGS[0]:-}"
            ;;
        reset)
            reset_database
            ;;
        backup)
            create_backup "${ARGS[0]:-}"
            ;;
        restore)
            restore_backup "${ARGS[0]:-}"
            ;;
        health)
            check_db_health
            log_success "Database is healthy"
            ;;
        *)
            log_error "Unknown command: $COMMAND. Use -h for help."
            ;;
    esac
}

# Run main function
main "$@"