# Outpass Management System Documentation

Welcome to the documentation for the Outpass Management System. This system streamlines the process of issuing, approving, and verifying student outpasses for hostels.

## System Overview

The system consists of three main components:
1.  **Backend**: The core logic and database (Django).
2.  **Mobile App**: For Parents (requests), Wardens (hostel management/vacating), HM/Principal (approvals & meetings), and Gate Staff (verification).
3.  **Admin Portal**: For School Administrators (user management, analytics).

```mermaid
graph TD
    User[Users]
    subgraph Frontend
        Mobile[Mobile App (Expo)]
        Admin[Admin Portal (React)]
    end
    subgraph Backend
        API[Django REST API]
        DB[(SQLite Database)]
    end

    User --> Mobile
    User --> Admin
    Mobile -->|HTTP Requests| API
    Admin -->|HTTP Requests| API
    API --> DB
```

## System Flows

### 1. Login Flow (Mobile)
```mermaid
sequenceDiagram
    participant P as Parent/User
    participant App as Mobile App
    participant API as Backend API
    participant DB as Database

    P->>App: Enter Phone Number
    App->>API: POST /api/auth/login (phone)
    API->>P: Send OTP (SMS/Mock)
    P->>App: Enter OTP
    App->>API: POST /api/auth/verify (otp)
    API->>DB: Verify OTP & User
    DB-->>API: User Details
    API-->>App: Return JWT Token
    App->>App: Store Token (SecureStore)
```

### 2. Outpass Request & Approval
```mermaid
sequenceDiagram
    participant S as Student/Parent
    participant H as HM/Principal
    participant API as Backend API
    participant DB as Database
    participant N as Notification Service

    S->>API: POST /api/outpasses/create
    API->>DB: Create Outpass (Pending)
    API->>N: Notify HM
    N-->>H: Push Notification

    H->>API: GET /api/outpasses/pending
    H->>API: POST /api/outpasses/{id}/approve
    API->>DB: Update Status (Approved)
    API-->>S: Notify Approval
```

### 3. Gate Exit Flow
```mermaid
sequenceDiagram
    participant S as Student
    participant G as Gate Staff
    participant API as Backend API
    participant DB as Database

    S->>G: Show QR Code
    G->>API: Scan QR / Enter Code
    API->>DB: Validate Outpass
    alt is Valid & Time Correct
        API->>DB: Update Status (Checked Out)
        API-->>G: Success (Allow Exit)
    else Invalid
        API-->>G: Error (Deny Exit)
    end
```

## Documentation Modules

### [Database Documentation](./database.md)
Detailed ER diagram, schema definitions, and entity relationships.

### [Backend Documentation](./backend.md)
Detailed guide on setting up the Django backend, API structure, and database management.

### [Mobile App Documentation](./mobile.md)
Instructions for setting up the React Native (Expo) app, configuring API endpoints, and understanding user flows.

### [Admin Portal Documentation](./admin_portal.md)
Guide for the web-based administration dashboard, including setup and feature overview.

## Quick Start
To get the entire system running locally, you need to start all three servers:
1.  **Backend**: `python manage.py runserver 0.0.0.0:8000` inside `backend/`.
2.  **Mobile**: `npx expo start` inside `mobile/`.
3.  **Admin**: `npm run dev` inside `admin-portal/`.
