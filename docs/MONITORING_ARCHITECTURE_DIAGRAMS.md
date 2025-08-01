# Monitoring System Architecture Diagrams

## 1. High-Level System Architecture

```mermaid
graph TB
    subgraph "Frontend Layer"
        UI[Monitoring Dashboard]
        WS_HOOK[WebSocket Hook]
        COMPONENTS[UI Components]
    end
    
    subgraph "Communication Layer"
        WS_SERVER[WebSocket Server]
        API[REST API]
    end
    
    subgraph "Backend Services"
        MONITOR[PipelineMonitoringService]
        PIPELINE[AI Resource Pipeline]
        HOOKS[Integration Hooks]
    end
    
    subgraph "Data Layer"
        METRICS_STORE[Metrics Storage]
        ALERTS_STORE[Alerts Storage]
        CONFIG_STORE[Configuration]
    end
    
    UI --> WS_HOOK
    WS_HOOK <--> WS_SERVER
    UI --> API
    WS_SERVER --> MONITOR
    API --> MONITOR
    MONITOR --> PIPELINE
    MONITOR --> HOOKS
    MONITOR --> METRICS_STORE
    MONITOR --> ALERTS_STORE
    MONITOR --> CONFIG_STORE
```

## 2. Frontend Component Architecture

```mermaid
graph TD
    subgraph "Main Dashboard Page"
        MD[MonitoringDashboard.tsx]
    end
    
    subgraph "Monitoring Components"
        MC[MetricCard.tsx]
        TSC[TimeSeriesChart.tsx]
        SHI[SystemHealthIndicator.tsx]
        AP[AlertsPanel.tsx]
        TT[ThemeToggle.tsx]
    end
    
    subgraph "Custom Hooks"
        WSH[useMonitoringWebSocket.ts]
    end
    
    subgraph "Services"
        MS[monitoring.ts]
    end
    
    subgraph "Types & Interfaces"
        PMT[PipelineMetrics]
        PST[PipelineStatus]
        PAT[PerformanceAlert]
    end
    
    MD --> MC
    MD --> TSC
    MD --> SHI
    MD --> AP
    MD --> TT
    MD --> WSH
    WSH --> MS
    MC --> PMT
    SHI --> PST
    AP --> PAT
```

## 3. Data Flow Architecture

```mermaid
sequenceDiagram
    participant P as AI Pipeline
    participant M as MonitoringService
    participant WS as WebSocket Server
    participant UI as Dashboard UI
    participant U as Admin User
    
    P->>M: Pipeline Events
    M->>M: Process Events
    M->>M: Update Metrics
    M->>M: Check Thresholds
    M->>WS: Emit Updates
    WS->>UI: Broadcast Metrics
    UI->>UI: Update Components
    UI->>U: Display Updates
    
    Note over M: Health Check Timer
    M->>M: Perform Health Check
    M->>WS: Health Status Update
    WS->>UI: Health Broadcast
    
    Note over M: Alert Generation
    M->>M: Threshold Breach
    M->>M: Create Alert
    M->>WS: Alert Notification
    WS->>UI: Alert Broadcast
    UI->>U: Show Alert
    U->>UI: Acknowledge Alert
    UI->>WS: ACK Message
    WS->>M: Update Alert Status
```

## 4. Backend Service Integration

```mermaid
graph LR
    subgraph "AI Resource Pipeline"
        MG[Module Generation]
        RG[Resource Generation]
        V[Validation]
        H[Hooks Execution]
    end
    
    subgraph "Monitoring Service"
        EM[Event Manager]
        MC[Metrics Collector]
        HM[Health Monitor]
        AM[Alert Manager]
        PM[Performance Tracker]
    end
    
    subgraph "Storage Systems"
        MS[Metrics Store]
        AS[Alert Store]
        PS[Performance Store]
    end
    
    MG --> EM
    RG --> EM
    V --> EM
    H --> EM
    
    EM --> MC
    EM --> HM
    EM --> AM
    EM --> PM
    
    MC --> MS
    AM --> AS
    PM --> PS
    HM --> MS
```

## 5. WebSocket Communication Architecture

```mermaid
graph TB
    subgraph "Frontend Clients"
        C1[Admin User 1]
        C2[Admin User 2]
        C3[Admin User N]
    end
    
    subgraph "WebSocket Layer"
        WS[WebSocket Server]
        CM[Connection Manager]
        EM[Event Multiplexer]
    end
    
    subgraph "Backend Services"
        MS[Monitoring Service]
        EE[Event Emitter]
    end
    
    C1 <--> WS
    C2 <--> WS
    C3 <--> WS
    WS --> CM
    WS --> EM
    EM <--> EE
    EE <--> MS
    
    MS --> EE: metrics_update
    MS --> EE: status_update
    MS --> EE: alerts_update
    MS --> EE: health_check_complete
```

## 6. Alert Management Flow

```mermaid
flowchart TD
    A[System Event] --> B{Threshold Check}
    B -->|Exceeded| C[Generate Alert]
    B -->|OK| D[Continue Monitoring]
    
    C --> E[Classify Severity]
    E --> F[Store Alert]
    F --> G[Emit Alert Event]
    G --> H[WebSocket Broadcast]
    H --> I[Dashboard Display]
    
    I --> J{User Action}
    J -->|Acknowledge| K[Mark Acknowledged]
    J -->|Ignore| L[Auto-expire]
    
    K --> M[Update Alert Status]
    L --> N[Cleanup Old Alerts]
    
    M --> O[Broadcast Update]
    N --> O
    O --> P[Update Dashboard]
```

## 7. Deployment Architecture - Production

```mermaid
graph TB
    subgraph "Load Balancer Layer"
        LB[Load Balancer]
        SSL[SSL Termination]
    end
    
    subgraph "Frontend Tier"
        FE1[Frontend Instance 1]
        FE2[Frontend Instance 2]
        FE3[Frontend Instance N]
        CDN[Static Assets CDN]
    end
    
    subgraph "API Gateway"
        AG[API Gateway]
        RL[Rate Limiting]
        AUTH[Authentication]
    end
    
    subgraph "Backend Tier"
        BE1[Backend Instance 1]
        BE2[Backend Instance 2]
        BE3[Backend Instance N]
    end
    
    subgraph "WebSocket Tier"
        WS1[WebSocket Instance 1]
        WS2[WebSocket Instance 2]
        REDIS[Redis Adapter]
    end
    
    subgraph "Monitoring Services"
        MS1[Monitoring Service 1]
        MS2[Monitoring Service 2]
        MQ[Message Queue]
    end
    
    subgraph "Data Layer"
        DB[(Primary Database)]
        DBR[(Read Replicas)]
        CACHE[(Redis Cache)]
        TSDB[(Time Series DB)]
    end
    
    LB --> SSL
    SSL --> FE1
    SSL --> FE2
    SSL --> FE3
    
    FE1 --> CDN
    FE1 --> AG
    AG --> RL
    AG --> AUTH
    RL --> BE1
    RL --> BE2
    RL --> BE3
    
    FE1 --> WS1
    FE2 --> WS2
    WS1 --> REDIS
    WS2 --> REDIS
    
    BE1 --> MS1
    BE2 --> MS2
    MS1 --> MQ
    MS2 --> MQ
    
    BE1 --> DB
    BE2 --> DBR
    MS1 --> TSDB
    MS2 --> CACHE
```

## 8. Container Orchestration - Kubernetes

```mermaid
graph TB
    subgraph "Ingress Layer"
        ING[Ingress Controller]
        CERT[Cert Manager]
    end
    
    subgraph "Frontend Namespace"
        FE_SVC[Frontend Service]
        FE_DEP[Frontend Deployment]
        FE_HPA[Frontend HPA]
    end
    
    subgraph "Backend Namespace"
        BE_SVC[Backend Service]
        BE_DEP[Backend Deployment]
        BE_HPA[Backend HPA]
    end
    
    subgraph "WebSocket Namespace"
        WS_SVC[WebSocket Service]
        WS_DEP[WebSocket Deployment]
        WS_HPA[WebSocket HPA]
    end
    
    subgraph "Monitoring Namespace"
        MON_SVC[Monitoring Service]
        MON_DEP[Monitoring Deployment]
        MON_HPA[Monitoring HPA]
    end
    
    subgraph "Data Layer"
        DB_SVC[Database Service]
        REDIS_SVC[Redis Service]
        PVC[Persistent Volumes]
    end
    
    ING --> FE_SVC
    ING --> BE_SVC
    ING --> WS_SVC
    
    FE_SVC --> FE_DEP
    FE_DEP --> FE_HPA
    
    BE_SVC --> BE_DEP
    BE_DEP --> BE_HPA
    BE_DEP --> DB_SVC
    
    WS_SVC --> WS_DEP
    WS_DEP --> WS_HPA
    WS_DEP --> REDIS_SVC
    
    MON_SVC --> MON_DEP
    MON_DEP --> MON_HPA
    MON_DEP --> DB_SVC
    
    DB_SVC --> PVC
    REDIS_SVC --> PVC
```

## 9. Monitoring Data Model

```mermaid
erDiagram
    PipelineMetrics {
        int totalModulesProcessed
        int totalResourcesGenerated
        float averageProcessingTime
        float successRate
        float errorRate
        object resourcesByType
        object qualityScores
        object performance
        object health
    }
    
    PipelineStatus {
        boolean isRunning
        int activeModules
        int queuedModules
        int resourcesInProgress
        datetime lastActivity
        int uptime
    }
    
    PerformanceAlert {
        string id
        string type
        string severity
        string message
        datetime timestamp
        string moduleId
        string resourceId
        object data
        boolean acknowledged
    }
    
    HealthStatus {
        string status
        datetime lastUpdate
        array issues
    }
    
    MonitoringConfig {
        boolean enableMetrics
        boolean enableAlerts
        object alertThresholds
        int healthCheckInterval
        int metricsRetentionDays
    }
    
    PipelineMetrics ||--|| HealthStatus : contains
    PipelineMetrics ||--o{ PerformanceAlert : generates
    MonitoringConfig ||--o{ PerformanceAlert : configures
```

## 10. Real-time Event Flow

```mermaid
stateDiagram-v2
    [*] --> Monitoring
    
    state Monitoring {
        [*] --> Collecting
        Collecting --> Processing
        Processing --> Evaluating
        Evaluating --> Collecting
        
        Processing --> Alerting
        Alerting --> NotificationSent
        NotificationSent --> Collecting
        
        Evaluating --> HealthCheck
        HealthCheck --> HealthUpdated
        HealthUpdated --> Collecting
    }
    
    state WebSocketCommunication {
        [*] --> Connected
        Connected --> Broadcasting
        Broadcasting --> Connected
        Connected --> Disconnected
        Disconnected --> Reconnecting
        Reconnecting --> Connected
        Reconnecting --> Failed
        Failed --> [*]
    }
    
    state DashboardState {
        [*] --> Loading
        Loading --> Displaying
        Displaying --> Updating
        Updating --> Displaying
        Displaying --> Error
        Error --> Recovering
        Recovering --> Displaying
    }
    
    Monitoring --> WebSocketCommunication : emit events
    WebSocketCommunication --> DashboardState : broadcast data
```

These diagrams provide a comprehensive visual representation of the monitoring system architecture, covering all major components, data flows, and deployment strategies. Each diagram focuses on a specific aspect of the system to provide clear understanding of the overall architecture.