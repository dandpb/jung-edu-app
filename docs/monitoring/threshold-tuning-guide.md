# Performance Threshold Tuning Guide

## Overview

This guide provides comprehensive instructions for tuning performance thresholds in the jaqEdu monitoring system. Proper threshold configuration is crucial for effective alerting that minimizes false positives while ensuring real issues are detected promptly.

## Table of Contents

1. [General Principles](#general-principles)
2. [Baseline Establishment](#baseline-establishment)
3. [System Metrics Tuning](#system-metrics-tuning)
4. [Application Metrics Tuning](#application-metrics-tuning)
5. [Dynamic Threshold Adjustment](#dynamic-threshold-adjustment)
6. [Testing and Validation](#testing-and-validation)
7. [Maintenance Schedule](#maintenance-schedule)

## General Principles

### 1. Start Conservative, Adjust Gradually
- Begin with conservative thresholds to avoid alert fatigue
- Make small adjustments (5-10%) rather than large changes
- Monitor alert frequency and accuracy after each change
- Document rationale for all threshold changes

### 2. Use Data-Driven Decisions
- Base thresholds on historical data analysis
- Consider statistical measures (mean, median, 95th percentile)
- Account for business cycles and seasonal patterns
- Use A/B testing when possible for threshold changes

### 3. Context-Aware Thresholds
- Different thresholds for business hours vs. off-hours
- Account for expected traffic patterns
- Consider system maintenance windows
- Adjust for known events (deployments, marketing campaigns)

### 4. Layered Alerting Strategy
- Warning thresholds for early detection
- Critical thresholds for immediate action
- Use multiple metrics for comprehensive coverage
- Implement alert suppression during maintenance

## Baseline Establishment

### Step 1: Data Collection Period
Collect at least 2-4 weeks of data before setting thresholds:

```bash
# Example: Collect CPU usage baseline
SELECT 
    AVG(cpu_usage_percent) as avg_cpu,
    PERCENTILE_CONT(0.50) as median_cpu,
    PERCENTILE_CONT(0.90) as p90_cpu,
    PERCENTILE_CONT(0.95) as p95_cpu,
    PERCENTILE_CONT(0.99) as p99_cpu
FROM system_metrics 
WHERE timestamp >= NOW() - INTERVAL '4 weeks'
GROUP BY DATE(timestamp)
ORDER BY DATE(timestamp);
```

### Step 2: Pattern Analysis
Identify patterns in your baseline data:

- **Daily patterns**: Peak hours, low-activity periods
- **Weekly patterns**: Weekday vs. weekend differences  
- **Monthly patterns**: Business cycles, reporting periods
- **Seasonal patterns**: Academic calendar for education platforms

### Step 3: Outlier Detection
Remove outliers from baseline calculations:

```python
# Example Python code for outlier removal
import numpy as np
import pandas as pd

def remove_outliers(data, threshold=2):
    """Remove outliers using Z-score method"""
    z_scores = np.abs(stats.zscore(data))
    return data[z_scores < threshold]

# Apply to CPU usage data
clean_cpu_data = remove_outliers(cpu_usage_data)
baseline_cpu_avg = np.mean(clean_cpu_data)
baseline_cpu_std = np.std(clean_cpu_data)
```

## System Metrics Tuning

### CPU Usage Thresholds

**Recommended Starting Points:**
- Warning: 70% sustained for 5+ minutes
- Critical: 85% sustained for 3+ minutes

**Tuning Considerations:**
```yaml
cpu_thresholds:
  # Normal application servers
  web_servers:
    warning: 70
    critical: 85
    duration: 5 # minutes
  
  # Database servers (typically higher baseline)
  database_servers:
    warning: 60
    critical: 80
    duration: 3
  
  # Batch processing servers (can tolerate higher usage)
  batch_servers:
    warning: 85
    critical: 95
    duration: 10
```

**Tuning Process:**
1. Monitor current CPU patterns for 2 weeks
2. Calculate P95 CPU usage during business hours
3. Set warning threshold at P95 + 10%
4. Set critical threshold at P95 + 25%
5. Adjust based on alert frequency

### Memory Usage Thresholds

**Recommended Starting Points:**
- Warning: 80% sustained for 3+ minutes
- Critical: 90% sustained for 2+ minutes

**Advanced Memory Monitoring:**
```yaml
memory_thresholds:
  # Consider available memory, not just usage percentage
  available_memory_mb:
    warning: 500  # MB
    critical: 200 # MB
  
  # Monitor swap usage separately
  swap_usage_percent:
    warning: 25
    critical: 50
  
  # Memory growth rate
  memory_growth_rate:
    warning: 10  # MB per minute
    critical: 25 # MB per minute
```

### Disk Usage Thresholds

**Recommended Starting Points:**
- Warning: 80% capacity
- Critical: 90% capacity

**Disk-Specific Considerations:**
```yaml
disk_thresholds:
  # Root filesystem - more conservative
  root_fs:
    warning: 75
    critical: 85
  
  # Data directories - account for growth patterns
  data_fs:
    warning: 80
    critical: 90
    # Also monitor growth rate
    growth_rate_gb_per_day:
      warning: 5
      critical: 10
  
  # Log directories - consider log rotation
  log_fs:
    warning: 85
    critical: 95
```

### Network Thresholds

**Recommended Starting Points:**
- Latency: 500ms average response time
- Throughput: Based on available bandwidth
- Error Rate: 5% packet loss

## Application Metrics Tuning

### API Response Time

**Baseline Analysis:**
```sql
-- Analyze API response times by endpoint
SELECT 
    endpoint,
    AVG(response_time_ms) as avg_response,
    PERCENTILE_CONT(0.95) as p95_response,
    COUNT(*) as request_count
FROM api_metrics 
WHERE timestamp >= NOW() - INTERVAL '2 weeks'
GROUP BY endpoint
ORDER BY p95_response DESC;
```

**Threshold Configuration:**
```yaml
api_thresholds:
  # Global thresholds
  global:
    warning: 2000  # 2 seconds
    critical: 5000 # 5 seconds
  
  # Endpoint-specific thresholds
  endpoints:
    "/api/search":
      warning: 1000   # Search should be fast
      critical: 3000
    
    "/api/generate":
      warning: 10000  # AI generation takes longer
      critical: 30000
    
    "/api/upload":
      warning: 5000   # File uploads vary
      critical: 15000
```

### Database Performance

**Query Performance Thresholds:**
```yaml
database_thresholds:
  slow_query_time:
    warning: 1000  # 1 second
    critical: 5000 # 5 seconds
  
  connection_pool_usage:
    warning: 70    # 70% of pool
    critical: 90   # 90% of pool
  
  deadlock_rate:
    warning: 1     # per hour
    critical: 5    # per hour
  
  lock_wait_time:
    warning: 5000  # 5 seconds
    critical: 15000 # 15 seconds
```

### Pipeline-Specific Thresholds

**AI Resource Pipeline:**
```yaml
pipeline_thresholds:
  error_rate:
    warning: 0.05  # 5%
    critical: 0.15 # 15%
  
  processing_time:
    # Varies by resource type
    mindmap:
      warning: 120000  # 2 minutes
      critical: 300000 # 5 minutes
    
    quiz:
      warning: 60000   # 1 minute
      critical: 180000 # 3 minutes
  
  quality_score:
    warning: 0.7     # 70%
    critical: 0.5    # 50%
  
  queue_depth:
    warning: 25      # modules
    critical: 50     # modules
```

## Dynamic Threshold Adjustment

### Time-Based Thresholds

Implement different thresholds for different time periods:

```yaml
time_based_thresholds:
  business_hours: # 9 AM - 5 PM weekdays
    cpu_warning: 70
    cpu_critical: 85
    
  off_hours: # Nights and weekends
    cpu_warning: 50  # Lower baseline expected
    cpu_critical: 70
    
  maintenance_window: # 2 AM - 4 AM
    suppress_alerts: true
    cpu_warning: 95  # Only critical issues
```

### Adaptive Thresholds

Use machine learning to adjust thresholds automatically:

```python
# Example adaptive threshold calculation
def calculate_adaptive_threshold(historical_data, sensitivity=0.95):
    """
    Calculate adaptive threshold based on historical patterns
    """
    # Remove outliers
    clean_data = remove_outliers(historical_data)
    
    # Calculate seasonal baseline
    baseline = seasonal_decompose(clean_data).trend
    
    # Calculate dynamic threshold
    threshold = baseline * sensitivity
    
    return threshold

# Apply to CPU usage
adaptive_cpu_threshold = calculate_adaptive_threshold(
    cpu_history, 
    sensitivity=0.95
)
```

### Traffic-Based Scaling

Adjust thresholds based on current traffic levels:

```yaml
traffic_scaling:
  low_traffic: # < 100 requests/minute
    response_time_multiplier: 0.8
    
  normal_traffic: # 100-1000 requests/minute
    response_time_multiplier: 1.0
    
  high_traffic: # > 1000 requests/minute
    response_time_multiplier: 1.5
```

## Testing and Validation

### Synthetic Load Testing

Test thresholds under controlled conditions:

```bash
# Example load test with k6
import http from 'k6/http';
import { check } from 'k6';

export let options = {
  stages: [
    { duration: '5m', target: 100 },  # Ramp up
    { duration: '10m', target: 100 }, # Stay at 100 users
    { duration: '5m', target: 0 },    # Ramp down
  ],
};

export default function() {
  let response = http.get('http://api.jaquedu.com/health');
  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
}
```

### Threshold Testing Checklist

- [ ] Verify warning alerts trigger before critical issues
- [ ] Confirm critical alerts indicate actual problems
- [ ] Test alert suppression during maintenance
- [ ] Validate escalation policies work correctly
- [ ] Check notification channels deliver messages
- [ ] Ensure runbooks are accessible and accurate

### A/B Testing for Thresholds

When changing thresholds, implement A/B testing:

```yaml
threshold_testing:
  group_a: # 50% of servers
    cpu_warning: 70  # Current threshold
    
  group_b: # 50% of servers  
    cpu_warning: 65  # Proposed threshold
    
  metrics_to_track:
    - alert_frequency
    - false_positive_rate
    - time_to_detection
    - incident_resolution_time
```

## Maintenance Schedule

### Weekly Reviews
- Check alert frequency and accuracy
- Review any threshold breaches
- Analyze false positive/negative rates
- Update suppression rules if needed

### Monthly Optimizations
- Analyze month-over-month trends
- Adjust thresholds based on growth patterns
- Review and update baseline calculations
- Update documentation and runbooks

### Quarterly Assessments
- Comprehensive baseline recalculation
- Review business requirements changes
- Assess new metrics and thresholds needed
- Update escalation policies and contacts

### Annual Reviews
- Complete threshold framework evaluation
- Benchmark against industry standards
- Plan infrastructure capacity based on trends
- Update disaster recovery thresholds

## Best Practices Summary

### Do's
✅ Use percentile-based thresholds (P95, P99)
✅ Account for seasonal and business patterns
✅ Implement layered alerting (warning → critical)
✅ Document all threshold changes with rationale
✅ Test thresholds with synthetic data
✅ Regular review and adjustment schedule
✅ Consider business impact when setting thresholds

### Don'ts
❌ Set thresholds based on single data points
❌ Use the same thresholds for all environments
❌ Ignore seasonal patterns in your data
❌ Set thresholds too tight (causing alert fatigue)
❌ Set thresholds too loose (missing real issues)
❌ Forget to account for growth trends
❌ Skip testing after threshold changes

## Troubleshooting Common Issues

### Too Many Alerts (Alert Fatigue)
**Symptoms:** High alert frequency, team ignoring alerts
**Solutions:**
- Increase threshold values by 10-15%
- Implement alert suppression rules
- Use longer evaluation windows
- Add conditions to reduce noise

### Missing Real Issues
**Symptoms:** Problems discovered before alerts fire
**Solutions:**
- Lower threshold values
- Reduce evaluation window time
- Add additional metrics for comprehensive coverage
- Implement anomaly detection

### Inconsistent Alert Timing
**Symptoms:** Alerts fire at different times for same issue
**Solutions:**
- Standardize evaluation windows
- Synchronize monitoring intervals
- Use consistent data collection methods
- Implement proper alert deduplication

## Configuration Examples

### Complete System Threshold Configuration

```yaml
# /config/system-thresholds.yml
system_thresholds:
  cpu:
    warning: 
      threshold: 70
      duration: 300  # 5 minutes
    critical:
      threshold: 85  
      duration: 180  # 3 minutes
      
  memory:
    warning:
      threshold: 80
      duration: 180  # 3 minutes
    critical:
      threshold: 90
      duration: 120  # 2 minutes
      
  disk:
    warning:
      threshold: 80
    critical:
      threshold: 90
    growth_rate:
      warning: 5120  # 5GB per day in MB
      critical: 10240 # 10GB per day in MB
      
  network:
    latency:
      warning: 500   # milliseconds
      critical: 1000
    error_rate:
      warning: 0.01  # 1%
      critical: 0.05 # 5%
```

### Application-Specific Configuration

```yaml
# /config/application-thresholds.yml
application_thresholds:
  api:
    response_time:
      global_warning: 2000
      global_critical: 5000
      endpoints:
        "/api/auth/login":
          warning: 1000
          critical: 3000
        "/api/pipeline/generate":
          warning: 30000
          critical: 60000
          
  pipeline:
    error_rate:
      warning: 0.05
      critical: 0.15
    quality_score:
      warning: 0.7
      critical: 0.5
    processing_time:
      mindmap:
        warning: 120000
        critical: 300000
      quiz:
        warning: 60000
        critical: 180000
        
  database:
    connection_pool:
      warning: 0.7
      critical: 0.9
    slow_queries:
      warning: 1000
      critical: 5000
    deadlocks:
      warning: 1    # per hour
      critical: 5   # per hour
```

This guide should be reviewed and updated regularly as your system evolves and you gain more operational experience.