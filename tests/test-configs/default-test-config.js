/**
 * Default Test Configuration for Self-Healing Test Suite
 * Comprehensive test scenarios for different system components
 */

const defaultTestConfig = {
  // Chaos Engineering Test Scenarios
  chaosTests: [
    {
      name: 'Service Crash Recovery',
      type: 'service-crash',
      scenarios: [
        {
          type: 'service',
          description: 'Primary API service crash',
          service: 'api-server',
          mode: 'crash',
          duration: 0, // Instant crash
          recoveryTimeout: 30000,
          healthCheck: async () => {
            // Mock health check - replace with actual implementation
            return Math.random() > 0.3;
          }
        }
      ]
    },
    {
      name: 'Memory Pressure Test',
      type: 'memory-pressure',
      scenarios: [
        {
          type: 'memory',
          description: 'High memory consumption scenario',
          pressure: 85, // 85% memory usage
          duration: 20000,
          recoveryTimeout: 45000
        }
      ]
    },
    {
      name: 'Network Partition Recovery',
      type: 'network-partition',
      scenarios: [
        {
          type: 'network',
          description: 'Database connection loss',
          target: 'database',
          mode: 'partition',
          duration: 15000,
          recoveryTimeout: 60000
        }
      ]
    },
    {
      name: 'CPU Exhaustion Test',
      type: 'cpu-exhaustion',
      scenarios: [
        {
          type: 'cpu',
          description: 'High CPU load simulation',
          load: 95, // 95% CPU usage
          duration: 25000,
          recoveryTimeout: 40000
        }
      ]
    },
    {
      name: 'Disk Space Exhaustion',
      type: 'disk-exhaustion',
      scenarios: [
        {
          type: 'disk',
          description: 'Disk space full simulation',
          usage: 98, // 98% disk usage
          duration: 30000,
          recoveryTimeout: 50000
        }
      ]
    }
  ],

  // Healing Validation Test Scenarios
  healingTests: [
    {
      type: 'service-crash',
      service: 'web-server',
      expectedDetectionTime: 5000,
      expectedHealingInitiation: 8000,
      maxRecoveryTime: 30000,
      validationCriteria: {
        serviceRestarted: true,
        dataIntegrityMaintained: true,
        performanceRestored: true
      }
    },
    {
      type: 'memory-leak',
      severity: 'high',
      expectedDetectionTime: 10000,
      expectedHealingInitiation: 15000,
      maxRecoveryTime: 45000,
      validationCriteria: {
        memoryReleased: true,
        performanceStable: true,
        noDataLoss: true
      }
    },
    {
      type: 'network-partition',
      target: 'external-api',
      expectedDetectionTime: 3000,
      expectedHealingInitiation: 5000,
      maxRecoveryTime: 25000,
      validationCriteria: {
        connectionRestored: true,
        circuitBreakerActive: true,
        gracefulDegradation: true
      }
    },
    {
      type: 'database-connection',
      database: 'primary-db',
      expectedDetectionTime: 4000,
      expectedHealingInitiation: 7000,
      maxRecoveryTime: 35000,
      validationCriteria: {
        connectionPoolRestored: true,
        queryPerformanceNormal: true,
        transactionIntegrityMaintained: true
      }
    },
    {
      type: 'api-timeout',
      endpoint: '/api/critical',
      expectedDetectionTime: 6000,
      expectedHealingInitiation: 10000,
      maxRecoveryTime: 40000,
      validationCriteria: {
        timeoutResolved: true,
        responseTimeNormal: true,
        errorRateReduced: true
      }
    },
    {
      type: 'resource-exhaustion',
      resource: 'connection-pool',
      expectedDetectionTime: 8000,
      expectedHealingInitiation: 12000,
      maxRecoveryTime: 50000,
      validationCriteria: {
        resourcesReleased: true,
        poolSizeOptimized: true,
        throughputRestored: true
      }
    }
  ],

  // Recovery Time Measurement Tests
  recoveryTests: [
    {
      type: 'service-restart',
      service: 'api-gateway',
      iterations: 5,
      maxRecoveryTime: 20000,
      measurementCriteria: {
        detectionTime: true,
        restartTime: true,
        validationTime: true
      }
    },
    {
      type: 'database-reconnection',
      database: 'mongodb',
      iterations: 3,
      maxRecoveryTime: 15000,
      measurementCriteria: {
        connectionTime: true,
        queryResponseTime: true,
        transactionRecovery: true
      }
    },
    {
      type: 'cache-regeneration',
      cache: 'redis',
      iterations: 4,
      maxRecoveryTime: 25000,
      measurementCriteria: {
        cacheRebuildTime: true,
        hitRateRecovery: true,
        performanceImpact: true
      }
    },
    {
      type: 'load-balancer-failover',
      loadBalancer: 'nginx',
      iterations: 3,
      maxRecoveryTime: 10000,
      measurementCriteria: {
        failoverTime: true,
        trafficRedirection: true,
        serviceAvailability: true
      }
    }
  ],

  // Load Testing with Failure Scenarios
  loadTests: [
    {
      name: 'Basic Load with Service Failures',
      users: 100,
      duration: 120000, // 2 minutes
      rampUpDuration: 30000,
      sustainedDuration: 60000,
      rampDownDuration: 30000,
      failureRate: 0.1, // 10% of requests trigger failures
      failureScenarios: [
        {
          type: 'service-overload',
          severity: 'medium',
          duration: 30000
        },
        {
          type: 'memory-pressure',
          severity: 'high',
          duration: 20000
        }
      ],
      successCriteria: {
        maxErrorRate: 5, // 5%
        maxResponseTime: 2000, // 2 seconds
        minThroughput: 50 // requests per second
      }
    },
    {
      name: 'High Load Stress Test',
      users: 500,
      duration: 180000, // 3 minutes
      rampUpDuration: 45000,
      sustainedDuration: 90000,
      rampDownDuration: 45000,
      failureRate: 0.15, // 15% failure injection
      failureScenarios: [
        {
          type: 'cascading-failure',
          severity: 'high',
          duration: 45000
        },
        {
          type: 'network-congestion',
          severity: 'medium',
          duration: 60000
        },
        {
          type: 'database-slowdown',
          severity: 'high',
          duration: 30000
        }
      ],
      successCriteria: {
        maxErrorRate: 8, // 8%
        maxResponseTime: 3000, // 3 seconds
        minThroughput: 80 // requests per second
      }
    },
    {
      name: 'Sustained Load with Recovery Validation',
      users: 200,
      duration: 300000, // 5 minutes
      rampUpDuration: 60000,
      sustainedDuration: 180000,
      rampDownDuration: 60000,
      failureRate: 0.12, // 12% failure rate
      failureScenarios: [
        {
          type: 'service-overload',
          severity: 'low',
          duration: 40000
        },
        {
          type: 'memory-pressure',
          severity: 'medium',
          duration: 35000
        },
        {
          type: 'network-congestion',
          severity: 'low',
          duration: 50000
        }
      ],
      recoveryValidation: {
        enabled: true,
        maxRecoveryTime: 45000,
        performanceThreshold: 0.8 // 80% of baseline performance
      },
      successCriteria: {
        maxErrorRate: 6, // 6%
        maxResponseTime: 2500, // 2.5 seconds
        minThroughput: 60, // requests per second
        recoverySuccessRate: 90 // 90% of failures must recover
      }
    }
  ],

  // Integration Test Workflows
  integrationTests: [
    {
      name: 'E2E User Registration Healing',
      components: ['web-server', 'api-gateway', 'user-service', 'database', 'email-service'],
      steps: [
        'user_submits_registration',
        'api_validates_data',
        'database_stores_user',
        'email_service_sends_confirmation'
      ],
      failureScenarios: [
        {
          type: 'service-crash',
          components: ['user-service'],
          sequential: false,
          cascadeExpected: false,
          recoveryExpected: true
        },
        {
          type: 'network-partition',
          components: ['email-service'],
          sequential: false,
          cascadeExpected: false,
          recoveryExpected: true
        },
        {
          type: 'database-corruption',
          components: ['database'],
          sequential: false,
          cascadeExpected: true,
          recoveryExpected: true
        }
      ],
      expectedBehavior: {
        gracefulDegradation: true,
        dataConsistency: true,
        userExperiencePreserved: true
      },
      successCriteria: {
        workflowCompletion: 95, // 95%
        maxRecoveryTime: 60000,
        dataIntegrityMaintained: true
      }
    },
    {
      name: 'Payment Processing Resilience',
      components: ['payment-gateway', 'api-server', 'database', 'external-payment-api', 'notification-service'],
      steps: [
        'payment_initiated',
        'payment_validated',
        'external_payment_processed',
        'database_updated',
        'confirmation_sent'
      ],
      failureScenarios: [
        {
          type: 'network-partition',
          components: ['external-payment-api'],
          sequential: false,
          cascadeExpected: false,
          recoveryExpected: true
        },
        {
          type: 'service-crash',
          components: ['payment-gateway'],
          sequential: false,
          cascadeExpected: true,
          recoveryExpected: true
        },
        {
          type: 'database-connection',
          components: ['database'],
          sequential: false,
          cascadeExpected: true,
          recoveryExpected: true
        }
      ],
      expectedBehavior: {
        transactionIntegrity: true,
        idempotencyMaintained: true,
        rollbackCapability: true
      },
      successCriteria: {
        transactionSuccessRate: 99, // 99%
        maxRecoveryTime: 45000,
        noDoubleCharging: true
      }
    },
    {
      name: 'Content Delivery Healing',
      components: ['cdn', 'web-server', 'database', 'cache', 'storage-service'],
      steps: [
        'content_requested',
        'cache_checked',
        'content_retrieved',
        'content_cached',
        'content_delivered'
      ],
      failureScenarios: [
        {
          type: 'cascading-failure',
          components: ['cdn', 'cache'],
          sequential: true,
          injectionDelay: 10000,
          cascadeExpected: true,
          recoveryExpected: true
        },
        {
          type: 'memory-leak',
          components: ['storage-service'],
          sequential: false,
          cascadeExpected: false,
          recoveryExpected: true
        }
      ],
      expectedBehavior: {
        contentAvailability: true,
        performanceMaintained: true,
        cacheCoherency: true
      },
      successCriteria: {
        contentDeliverySuccess: 98, // 98%
        maxResponseTime: 1000,
        cacheHitRateRecovery: 85 // 85%
      }
    }
  ],

  // Global Test Configuration
  globalSettings: {
    // Execution settings
    parallelExecution: true,
    testTimeout: 600000, // 10 minutes
    retryFailedTests: true,
    maxRetries: 2,
    
    // Memory and storage
    memoryStorageEnabled: true,
    persistResults: true,
    resultRetentionDays: 30,
    
    // Hooks and coordination
    hooksEnabled: true,
    coordinationEnabled: true,
    notificationEnabled: true,
    
    // Monitoring and alerting
    realTimeMonitoring: true,
    performanceAlerting: true,
    alertThresholds: {
      errorRate: 10, // 10%
      responseTime: 3000, // 3 seconds
      recoveryTime: 60000 // 1 minute
    },
    
    // Reporting
    generateDetailedReports: true,
    includePerformanceGraphs: true,
    exportFormats: ['json', 'html', 'pdf'],
    
    // Integration settings
    githubIntegration: {
      enabled: false, // Set to true to enable GitHub integration
      repository: 'org/repo',
      createIssuesOnFailure: true,
      updatePRStatus: true
    },
    
    // Baseline and benchmarking
    establishBaseline: true,
    compareToBaseline: true,
    baselineIterations: 5,
    
    // Advanced features
    adaptiveTesting: {
      enabled: true,
      learningRate: 0.1,
      adjustTestParameters: true
    },
    
    predictiveAnalysis: {
      enabled: true,
      modelType: 'time-series',
      forecastPeriod: 24 // hours
    }
  },

  // Success Criteria (Global)
  globalSuccessCriteria: {
    overallSuccessRate: 85, // 85%
    maxAverageRecoveryTime: 45000, // 45 seconds
    systemAvailability: 99.9, // 99.9%
    performanceRegressionThreshold: 15, // 15%
    securityVulnerabilities: 0,
    dataIntegrityMaintained: 100 // 100%
  },

  // Test Environment Configuration
  environment: {
    type: 'integration', // 'unit', 'integration', 'staging', 'production'
    resourceLimits: {
      maxMemoryUsage: 1024, // MB
      maxCpuUsage: 80, // percentage
      maxNetworkBandwidth: 100 // Mbps
    },
    dependencies: {
      externalServices: [
        { name: 'payment-api', mockEnabled: true, healthEndpoint: '/health' },
        { name: 'notification-service', mockEnabled: true, healthEndpoint: '/status' },
        { name: 'analytics-api', mockEnabled: true, healthEndpoint: '/ping' }
      ],
      databases: [
        { name: 'primary-db', type: 'postgresql', healthCheck: true },
        { name: 'cache-db', type: 'redis', healthCheck: true },
        { name: 'analytics-db', type: 'mongodb', healthCheck: true }
      ]
    },
    monitoring: {
      metricsCollection: true,
      logAggregation: true,
      distributedTracing: true,
      customMetrics: [
        'healing_success_rate',
        'detection_time',
        'recovery_time',
        'system_stability'
      ]
    }
  }
};

module.exports = { defaultTestConfig };