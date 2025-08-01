#!/bin/bash

# Health Monitoring Script for jaqEdu
# Continuous monitoring of application health in production

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
HEALTH_URL=${1:-"http://localhost:3000/health"}
CHECK_INTERVAL=${2:-60}  # seconds
MAX_RETRIES=${3:-3}
ALERT_THRESHOLD=${4:-3}  # consecutive failures before alert
LOG_FILE="health-monitor-$(date +%Y%m%d).log"

# Counters
consecutive_failures=0
total_checks=0
total_failures=0

# Function to log with timestamp
log_message() {
    echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Function to check application health
check_health() {
    local attempt=1
    local max_attempts=$MAX_RETRIES
    
    while [ $attempt -le $max_attempts ]; do
        log_message "${BLUE}Health check attempt $attempt/$max_attempts${NC}"
        
        if curl -f -s --max-time 10 "$HEALTH_URL" > /dev/null 2>&1; then
            return 0
        fi
        
        attempt=$((attempt + 1))
        if [ $attempt -le $max_attempts ]; then
            sleep 5
        fi
    done
    
    return 1
}

# Function to send alert
send_alert() {
    local message=$1
    local alert_file="alerts/health-alert-$(date +%Y%m%d_%H%M%S).txt"
    
    # Create alerts directory if it doesn't exist
    mkdir -p alerts
    
    # Log alert
    echo "ALERT: $message" | tee -a "$alert_file"
    echo "Time: $(date)" >> "$alert_file"
    echo "Health URL: $HEALTH_URL" >> "$alert_file"
    echo "Consecutive Failures: $consecutive_failures" >> "$alert_file"
    echo "Total Checks: $total_checks" >> "$alert_file"
    echo "Total Failures: $total_failures" >> "$alert_file"
    
    # Try to send email alert if configured
    if [ -n "$ALERT_EMAIL" ] && command -v mail >/dev/null 2>&1; then
        echo "$message" | mail -s "jaqEdu Health Alert" "$ALERT_EMAIL"
    fi
    
    # Try to send webhook alert if configured
    if [ -n "$ALERT_WEBHOOK" ] && command -v curl >/dev/null 2>&1; then
        curl -X POST "$ALERT_WEBHOOK" \
             -H "Content-Type: application/json" \
             -d "{\"text\":\"jaqEdu Health Alert: $message\"}" \
             2>/dev/null || true
    fi
    
    log_message "${RED}🚨 ALERT SENT: $message${NC}"
}

# Function to send recovery notification
send_recovery() {
    local message="jaqEdu application has recovered and is now healthy"
    
    log_message "${GREEN}✅ RECOVERY: $message${NC}"
    
    # Send recovery notification
    if [ -n "$ALERT_EMAIL" ] && command -v mail >/dev/null 2>&1; then
        echo "$message" | mail -s "jaqEdu Recovery Notification" "$ALERT_EMAIL"
    fi
    
    if [ -n "$ALERT_WEBHOOK" ] && command -v curl >/dev/null 2>&1; then
        curl -X POST "$ALERT_WEBHOOK" \
             -H "Content-Type: application/json" \
             -d "{\"text\":\"✅ jaqEdu Recovery: $message\"}" \
             2>/dev/null || true
    fi
}

# Function to collect health metrics
collect_metrics() {
    local metrics_file="metrics/health-metrics-$(date +%Y%m%d).json"
    
    # Create metrics directory if it doesn't exist
    mkdir -p metrics
    
    # Try to get detailed health information
    if curl -f -s --max-time 10 "$HEALTH_URL" > temp_health.json 2>/dev/null; then
        local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
        
        # Create metrics entry
        echo "{" >> "$metrics_file"
        echo "  \"timestamp\": \"$timestamp\"," >> "$metrics_file"
        echo "  \"status\": \"healthy\"," >> "$metrics_file"
        echo "  \"consecutive_failures\": $consecutive_failures," >> "$metrics_file"
        echo "  \"total_checks\": $total_checks," >> "$metrics_file"
        echo "  \"total_failures\": $total_failures," >> "$metrics_file"
        echo "  \"success_rate\": $(echo "scale=2; ($total_checks - $total_failures) * 100 / $total_checks" | bc 2>/dev/null || echo "0")," >> "$metrics_file"
        echo "  \"health_data\": $(cat temp_health.json)" >> "$metrics_file"
        echo "}," >> "$metrics_file"
        
        rm -f temp_health.json
    else
        local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
        
        echo "{" >> "$metrics_file"
        echo "  \"timestamp\": \"$timestamp\"," >> "$metrics_file"
        echo "  \"status\": \"unhealthy\"," >> "$metrics_file"
        echo "  \"consecutive_failures\": $consecutive_failures," >> "$metrics_file"
        echo "  \"total_checks\": $total_checks," >> "$metrics_file"
        echo "  \"total_failures\": $total_failures," >> "$metrics_file"
        echo "  \"error\": \"Health endpoint not accessible\"" >> "$metrics_file"
        echo "}," >> "$metrics_file"
    fi
}

# Function to cleanup old files
cleanup_old_files() {
    # Remove log files older than 7 days
    find . -name "health-monitor-*.log" -type f -mtime +7 -delete 2>/dev/null || true
    
    # Remove metric files older than 30 days
    find metrics -name "health-metrics-*.json" -type f -mtime +30 -delete 2>/dev/null || true
    
    # Remove alert files older than 90 days
    find alerts -name "health-alert-*.txt" -type f -mtime +90 -delete 2>/dev/null || true
}

# Function to show status
show_status() {
    local uptime_seconds=$(($(date +%s) - start_time))
    local uptime_minutes=$((uptime_seconds / 60))
    local uptime_hours=$((uptime_minutes / 60))
    
    log_message "${BLUE}📊 Health Monitor Status${NC}"
    log_message "${BLUE}Monitoring: $HEALTH_URL${NC}"
    log_message "${BLUE}Uptime: ${uptime_hours}h ${uptime_minutes}m${NC}"
    log_message "${BLUE}Total Checks: $total_checks${NC}"
    log_message "${BLUE}Total Failures: $total_failures${NC}"
    log_message "${BLUE}Consecutive Failures: $consecutive_failures${NC}"
    
    if [ $total_checks -gt 0 ]; then
        local success_rate=$(echo "scale=2; ($total_checks - $total_failures) * 100 / $total_checks" | bc 2>/dev/null || echo "0")
        log_message "${BLUE}Success Rate: $success_rate%${NC}"
    fi
}

# Signal handlers
cleanup() {
    log_message "${YELLOW}Shutting down health monitor...${NC}"
    show_status
    cleanup_old_files
    exit 0
}

trap cleanup SIGINT SIGTERM

# Main monitoring loop
main() {
    log_message "${GREEN}🔍 Starting jaqEdu Health Monitor${NC}"
    log_message "${BLUE}Health URL: $HEALTH_URL${NC}"
    log_message "${BLUE}Check Interval: ${CHECK_INTERVAL}s${NC}"
    log_message "${BLUE}Alert Threshold: $ALERT_THRESHOLD consecutive failures${NC}"
    log_message "${BLUE}Log File: $LOG_FILE${NC}"
    
    # Check if health URL is reachable initially
    log_message "${YELLOW}Performing initial health check...${NC}"
    if ! check_health; then
        log_message "${YELLOW}⚠ Initial health check failed. Starting monitoring anyway...${NC}"
    else
        log_message "${GREEN}✓ Initial health check passed${NC}"
    fi
    
    local start_time=$(date +%s)
    local last_status_time=0
    local status_interval=3600  # Show status every hour
    
    while true; do
        total_checks=$((total_checks + 1))
        
        if check_health; then
            if [ $consecutive_failures -gt 0 ]; then
                log_message "${GREEN}✅ Health check PASSED (recovered from $consecutive_failures failures)${NC}"
                
                # Send recovery notification if we had reached alert threshold
                if [ $consecutive_failures -ge $ALERT_THRESHOLD ]; then
                    send_recovery
                fi
                
                consecutive_failures=0
            else
                log_message "${GREEN}✓ Health check passed${NC}"
            fi
            
            collect_metrics
        else
            consecutive_failures=$((consecutive_failures + 1))
            total_failures=$((total_failures + 1))
            
            log_message "${RED}❌ Health check FAILED (attempt $consecutive_failures)${NC}"
            
            # Send alert if threshold reached
            if [ $consecutive_failures -eq $ALERT_THRESHOLD ]; then
                send_alert "Application health check has failed $consecutive_failures consecutive times"
            elif [ $consecutive_failures -gt $ALERT_THRESHOLD ] && [ $((consecutive_failures % 10)) -eq 0 ]; then
                send_alert "Application still unhealthy after $consecutive_failures consecutive failures"
            fi
            
            collect_metrics
        fi
        
        # Show periodic status
        local current_time=$(date +%s)
        if [ $((current_time - last_status_time)) -ge $status_interval ]; then
            show_status
            last_status_time=$current_time
        fi
        
        # Cleanup old files once per day
        if [ $((total_checks % 1440)) -eq 0 ]; then  # 1440 = 24 hours * 60 minutes
            cleanup_old_files
        fi
        
        sleep $CHECK_INTERVAL
    done
}

# Usage information
if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    echo "Usage: $0 [HEALTH_URL] [CHECK_INTERVAL] [MAX_RETRIES] [ALERT_THRESHOLD]"
    echo ""
    echo "Environment Variables:"
    echo "  ALERT_EMAIL    - Email address for alerts"
    echo "  ALERT_WEBHOOK  - Webhook URL for alerts (Slack, Teams, etc.)"
    echo ""
    echo "Examples:"
    echo "  $0                                    # Monitor localhost:3000 with defaults"
    echo "  $0 https://app.example.com/health     # Monitor production app"
    echo "  $0 http://localhost:3000/health 30    # Check every 30 seconds"
    echo ""
    echo "Default values:"
    echo "  HEALTH_URL: http://localhost:3000/health"
    echo "  CHECK_INTERVAL: 60 seconds"
    echo "  MAX_RETRIES: 3"
    echo "  ALERT_THRESHOLD: 3 consecutive failures"
    exit 0
fi

# Run main function
main "$@"