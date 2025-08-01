# Incident Response Runbooks

## Overview

This document contains step-by-step incident response procedures for common alerts in the jaqEdu monitoring system. Each runbook provides immediate actions, investigation steps, and resolution procedures.

## Table of Contents

1. [General Incident Response Process](#general-incident-response-process)
2. [System Alerts](#system-alerts)
3. [Application Alerts](#application-alerts)
4. [Security Alerts](#security-alerts)
5. [Business Alerts](#business-alerts)
6. [Emergency Procedures](#emergency-procedures)

## General Incident Response Process

### Initial Response (First 5 minutes)
1. **Acknowledge the alert** in the monitoring dashboard
2. **Assess severity** and determine if escalation is needed
3. **Check system status** via monitoring dashboard
4. **Begin investigation** using the specific runbook
5. **Communicate status** to relevant stakeholders if high/critical

### Investigation Phase
1. **Gather information** from logs, metrics, and monitoring
2. **Identify root cause** using systematic troubleshooting
3. **Document findings** in incident management system
4. **Determine resolution approach**

### Resolution Phase
1. **Implement fix** following change management procedures
2. **Verify resolution** by monitoring key metrics
3. **Update stakeholders** on status and resolution
4. **Document lessons learned**

### Post-Incident
1. **Conduct post-mortem** for critical/high severity incidents
2. **Update runbooks** based on learnings
3. **Implement preventive measures** to avoid recurrence

---

## System Alerts

### High CPU Usage

**Alert ID:** `sys-cpu-high`  
**Severity:** High  
**Expected Response Time:** 15 minutes

#### Immediate Actions (0-5 minutes)
1. **Check CPU usage trends** in monitoring dashboard
2. **Identify if this is a spike or sustained high usage**
3. **Look for any recent deployments or changes**

#### Investigation Steps (5-15 minutes)

**Step 1: Identify Top Processes**
```bash
# Check current CPU usage and top processes
top -n 1 -b | head -20

# Alternative with more details
htop

# Check load average
uptime

# Identify processes using most CPU
ps aux --sort=-%cpu | head -10
```

**Step 2: Check System Resources**
```bash
# Overall system resources
vmstat 1 10

# I/O wait times
iostat -x 1 5

# Memory usage
free -h
```

**Step 3: Review Recent Changes**
```bash
# Check recent deployments
kubectl get deployments -o wide

# Check system logs for errors
journalctl -n 100 --no-pager

# Check application logs
tail -n 100 /var/log/application/*.log
```

#### Resolution Steps

**Immediate Relief:**
```bash
# If specific process is consuming excessive CPU:
# 1. Identify the process ID (PID)
ps aux --sort=-%cpu | head -5

# 2. Check if process can be safely restarted
systemctl status <service-name>

# 3. Restart the service
systemctl restart <service-name>

# 4. Monitor CPU usage after restart
watch -n 5 'top -n 1 -b | head -10'
```

**Scaling Solutions:**
```bash
# For containerized applications:
kubectl scale deployment <app-name> --replicas=<new-count>

# For cloud instances:
# Use auto-scaling groups or manual instance scaling
```

#### Verification
- [ ] CPU usage drops below warning threshold (70%)
- [ ] System response time returns to normal
- [ ] No new related alerts triggered
- [ ] Application functionality verified

#### Follow-up Actions
- **Investigate root cause** if issue was application-related
- **Review capacity planning** if this was due to growth
- **Update monitoring thresholds** if necessary
- **Document incident** in incident management system

---

### Memory Exhaustion

**Alert ID:** `sys-memory-critical`  
**Severity:** Critical  
**Expected Response Time:** 10 minutes

#### Immediate Actions (0-3 minutes)
1. **Check current memory usage**
2. **Identify if system is at risk of OOM killer**
3. **Prepare for emergency measures**

#### Investigation Steps (3-10 minutes)

**Step 1: Assess Memory Situation**
```bash
# Current memory usage
free -h

# Memory usage by process
ps aux --sort=-%mem | head -10

# Check for OOM killer activity
dmesg | grep -i "killed process"
journalctl -k | grep -i "out of memory"

# Swap usage
swapon --show
```

**Step 2: Identify Memory Leaks**
```bash
# Monitor memory usage over time
watch -n 2 'free -h'

# Check for growing processes
ps -eo pid,ppid,cmd,%mem,%cpu --sort=-%mem | head -10

# Application-specific memory checks
# For Java applications:
jmap -histo <java-pid> | head -20
```

#### Resolution Steps

**Emergency Actions:**
```bash
# Clear system caches (safe operation)
echo 3 > /proc/sys/vm/drop_caches

# Kill non-essential processes (be careful!)
# First, identify candidates:
ps aux --sort=-%mem | head -20

# Kill specific process if safe:
kill -TERM <pid>

# If process doesn't respond:
kill -KILL <pid>
```

**Service Management:**
```bash
# Restart memory-intensive services
systemctl restart <service-name>

# For containerized apps with memory limits:
kubectl delete pod <pod-name>  # Will be recreated by deployment

# Check if restart resolved the issue
free -h
```

**Scaling Solutions:**
```bash
# Increase memory allocation for VMs/containers
# Update resource limits in configuration

# For Kubernetes:
kubectl patch deployment <app-name> -p '{"spec":{"template":{"spec":{"containers":[{"name":"<container-name>","resources":{"limits":{"memory":"4Gi"}}}]}}}}'
```

#### Verification
- [ ] Memory usage drops below critical threshold (90%)
- [ ] No OOM killer activity
- [ ] Applications responding normally
- [ ] System stability confirmed

---

### Low Disk Space

**Alert ID:** `sys-disk-space`  
**Severity:** High  
**Expected Response Time:** 30 minutes

#### Immediate Actions (0-5 minutes)
1. **Check which filesystem is affected**
2. **Assess risk of running out of space**
3. **Look for quick wins (log cleanup)**

#### Investigation Steps (5-20 minutes)

**Step 1: Analyze Disk Usage**
```bash
# Check all filesystem usage
df -h

# Find largest directories
du -sh /* | sort -hr | head -10

# Find large files
find / -size +100M -type f -exec ls -lh {} \; 2>/dev/null | sort -k5 -hr | head -10

# Check for deleted files still held by processes
lsof +L1
```

**Step 2: Identify Cleanup Opportunities**
```bash
# Log files
du -sh /var/log/*

# Temporary files
du -sh /tmp/* /var/tmp/*

# Package caches
du -sh /var/cache/*

# Application-specific directories
du -sh /opt/app/logs/*
du -sh /var/lib/docker/*  # If using Docker
```

#### Resolution Steps

**Immediate Cleanup:**
```bash
# Clean old log files (be careful with active logs)
find /var/log -name "*.log.*" -mtime +7 -delete
find /var/log -name "*.gz" -mtime +30 -delete

# Clean temporary files
find /tmp -type f -mtime +7 -delete
find /var/tmp -type f -mtime +7 -delete

# Clean package caches
apt-get clean          # Ubuntu/Debian
yum clean all          # RedHat/CentOS
```

**Application-Specific Cleanup:**
```bash
# Docker cleanup (if applicable)
docker system prune -af --volumes

# Application logs
find /opt/app/logs -name "*.log" -mtime +30 -delete

# Database backups (if safe to remove old ones)
find /var/backups -name "*.sql" -mtime +14 -delete
```

**Long-term Solutions:**
```bash
# Implement log rotation
logrotate -f /etc/logrotate.conf

# Set up automated cleanup scripts
crontab -e
# Add: 0 2 * * * find /var/log -name "*.log.*" -mtime +7 -delete
```

#### Verification
- [ ] Disk usage drops below warning threshold (80%)
- [ ] Critical services still running
- [ ] No application errors due to disk space
- [ ] Log rotation working properly

---

## Application Alerts

### High Pipeline Error Rate

**Alert ID:** `app-pipeline-error-rate`  
**Severity:** High  
**Expected Response Time:** 20 minutes

#### Immediate Actions (0-5 minutes)
1. **Check pipeline dashboard** for error patterns
2. **Identify which modules are failing**
3. **Assess impact on users**

#### Investigation Steps (5-20 minutes)

**Step 1: Analyze Error Patterns**
```bash
# Check pipeline logs
tail -n 200 /var/log/pipeline/error.log

# Look for specific error patterns
grep -A 5 -B 5 "ERROR" /var/log/pipeline/*.log | tail -50

# Check module-specific failures
grep "module_id" /var/log/pipeline/processing.log | grep "FAILED" | tail -20
```

**Step 2: Check Dependencies**
```bash
# AI service connectivity
curl -I https://ai-service.jaquedu.com/health

# Database connectivity
psql -h db-host -U username -d database -c "SELECT 1;"

# External API status
curl -I https://external-api.com/status
```

**Step 3: Review Recent Changes**
```bash
# Check recent deployments
kubectl get deployments -o wide
git log --oneline -10

# Configuration changes
diff /etc/pipeline/config.yml /etc/pipeline/config.yml.backup
```

#### Resolution Steps

**Fix Common Issues:**
```bash
# Restart pipeline services
systemctl restart pipeline-processor
systemctl restart pipeline-api

# Clear stuck queues
redis-cli FLUSHDB  # If using Redis for queues

# Reset failed modules
python manage.py reset_failed_modules --older-than-hours=1
```

**Configuration Fixes:**
```bash
# Restore previous configuration if needed
cp /etc/pipeline/config.yml.backup /etc/pipeline/config.yml
systemctl restart pipeline-processor

# Update API keys if expired
vim /etc/pipeline/secrets.yml
systemctl restart pipeline-processor
```

#### Verification
- [ ] Error rate drops below threshold (10%)
- [ ] New modules processing successfully
- [ ] Generated resources have good quality scores
- [ ] Users can access new content

---

### High API Response Time

**Alert ID:** `app-api-response-time`  
**Severity:** Medium  
**Expected Response Time:** 30 minutes

#### Investigation Steps

**Step 1: Identify Slow Endpoints**
```bash
# Check API metrics
curl -s http://localhost:8080/metrics | grep api_response_time

# Analyze access logs for slow requests
awk '$9 > 2000 {print $1, $7, $9}' /var/log/nginx/access.log | tail -20

# Database slow query log
tail -n 50 /var/log/mysql/slow.log
```

**Step 2: Check System Resources**
```bash
# API server resources
top -p $(pgrep -f api-server)

# Database performance
mysqladmin processlist
mysqladmin status
```

#### Resolution Steps

**Quick Fixes:**
```bash
# Restart API services
systemctl restart api-server

# Clear database query cache
mysql -e "RESET QUERY CACHE;"

# Scale API instances
kubectl scale deployment api-server --replicas=5
```

**Performance Optimization:**
```sql
-- Identify and optimize slow queries
SHOW PROCESSLIST;
EXPLAIN <slow-query>;

-- Add indexes if needed
CREATE INDEX idx_user_created ON users(created_at);
```

---

## Security Alerts

### Multiple Failed Login Attempts

**Alert ID:** `sec-failed-logins`  
**Severity:** High  
**Expected Response Time:** 15 minutes

#### Immediate Actions (0-5 minutes)
1. **Check source IPs** of failed attempts
2. **Identify affected user accounts**
3. **Assess if this is ongoing**

#### Investigation Steps (5-15 minutes)

**Step 1: Analyze Attack Pattern**
```bash
# Check authentication logs
grep "authentication failure" /var/log/auth.log | tail -50

# Identify source IPs
grep "Failed password" /var/log/auth.log | awk '{print $11}' | sort | uniq -c | sort -nr

# Check targeted accounts
grep "Failed password for" /var/log/auth.log | awk '{print $9}' | sort | uniq -c | sort -nr
```

**Step 2: Check for Compromised Accounts**
```bash
# Recent successful logins from suspicious IPs
grep "Accepted password" /var/log/auth.log | grep -E "(suspicious-ip1|suspicious-ip2)"

# Check currently logged in users
who
w
```

#### Resolution Steps

**Immediate Protection:**
```bash
# Block malicious IPs
iptables -A INPUT -s suspicious-ip -j DROP

# Or using fail2ban
fail2ban-client set sshd banip suspicious-ip

# Lock compromised accounts temporarily
usermod -L suspicious-username
```

**Enhanced Security:**
```bash
# Enable account lockout after failed attempts
# Configure in /etc/pam.d/common-auth
auth required pam_tally2.so deny=5 unlock_time=900

# Update security rules
fail2ban-client reload
```

#### Verification
- [ ] Attack has stopped
- [ ] No successful logins from malicious IPs
- [ ] Legitimate users can still access system
- [ ] Security monitoring shows no new threats

---

## Emergency Procedures

### Complete System Outage

**Severity:** Critical  
**Expected Response Time:** Immediate

#### Immediate Actions (0-2 minutes)
1. **Assess scope** of outage (partial vs. complete)
2. **Check infrastructure status** (network, power, cloud services)
3. **Initiate emergency communication** to stakeholders

#### Communication Template
```
URGENT: System Outage Notification

Status: Complete system outage detected at [TIME]
Impact: All services unavailable
ETA for resolution: Under investigation

We are investigating and will provide updates every 15 minutes.

Next update: [TIME + 15 minutes]
```

#### Recovery Steps

**Step 1: Infrastructure Check**
```bash
# Check network connectivity
ping 8.8.8.8
ping gateway-ip

# Check cloud service status
# AWS: https://status.aws.amazon.com/
# Azure: https://status.azure.com/
# GCP: https://status.cloud.google.com/

# Check DNS resolution
nslookup jaquedu.com
```

**Step 2: Service Recovery**
```bash
# Check and restart critical services
systemctl status nginx
systemctl restart nginx

systemctl status database
systemctl restart database

systemctl status application
systemctl restart application

# Verify services are responding
curl -I http://localhost/health
```

**Step 3: Database Recovery**
```bash
# Check database status
systemctl status postgresql

# If database corruption suspected:
pg_ctl start -D /var/lib/postgresql/data

# Restore from backup if necessary
pg_restore -d database_name backup_file.sql
```

#### Verification Checklist
- [ ] All critical services running
- [ ] Database connectivity confirmed
- [ ] Application responding to health checks
- [ ] Load balancer routing traffic properly
- [ ] SSL certificates valid and working
- [ ] Users can access the application

---

### Data Loss Prevention

**Severity:** Critical  
**Expected Response Time:** Immediate

#### Immediate Actions
1. **Stop all write operations** to prevent further data loss
2. **Identify scope** of potential data loss
3. **Preserve current state** for investigation

#### Investigation Steps
```bash
# Check database integrity
pg_dump database_name > emergency_backup.sql

# Identify last known good backup
ls -la /backups/ | tail -10

# Check replication status
SELECT * FROM pg_stat_replication;

# Review transaction logs
SELECT * FROM pg_stat_activity;
```

#### Recovery Steps
```bash
# Restore from most recent backup
pg_restore -d database_name /backups/latest_backup.sql

# If partial recovery needed:
# 1. Restore to point-in-time
# 2. Apply specific transaction logs
# 3. Verify data integrity
```

---

## Runbook Maintenance

### Regular Updates
- **Weekly:** Review and update based on recent incidents
- **Monthly:** Add new runbooks for new systems/alerts
- **Quarterly:** Comprehensive review and testing

### Testing Procedures
- **Game Days:** Simulate incidents and test runbooks
- **Chaos Engineering:** Intentionally cause failures to test procedures
- **Documentation:** Keep runbooks current with system changes

### Quality Checklist
For each runbook, verify:
- [ ] Clear step-by-step instructions
- [ ] Expected response times defined
- [ ] Verification steps included
- [ ] Follow-up actions specified
- [ ] Contact information current
- [ ] Commands tested and accurate

---

*Last Updated: [Current Date]*  
*Version: 1.0*  
*Next Review: [Date + 3 months]*