# Database Documentation

This document details the data models, entity relationships, and schema constraints for the Outpass Management System.

## Entity Relationship Diagram (ERD)

```mermaid
erDiagram
    User ||--o{ StaffProfile : "has"
    User ||--o{ ParentProfile : "has"
    User ||--o{ StudentParentRelationship : "parent of"
    Student ||--o{ StudentParentRelationship : "child of"
    Student ||--o{ Outpass : "requests"
    Student }|--|| Hostel : "lives in"
    Student }|--|| Room : "lives in"
    Hostel ||--|{ Room : "contains"
    Outpass ||--|{ Approval : "has"
    
    User {
        UUID id PK
        string phone UK
        string role "PARENT, WARDEN, HM, GATE_STAFF"
    }

    Student {
        UUID id PK
        string student_id UK
        string first_name
        string last_name
        FK hostel_id
        FK room_id
    }

    Hostel {
        UUID id PK
        string name
        string type "BOYS, GIRLS"
        FK warden_id
    }

    Outpass {
        UUID id PK
        FK student_id
        FK parent_id
        string status
        datetime outgoing_date
        datetime expected_return_date
        string exit_code
        string return_code
    }
```

## Schema Details

### 1. Users & Authentication (`apps/users`)

#### `User`
The central custom user model replacing Django's default User.
- **PK**: `id` (UUID)
- **Fields**:
  - `phone`: Unique identifier used for login.
  - `role`: Enum (PARENT, ACCOUNTANT, WARDEN, HM, GATE_STAFF, ADMIN).
  - `is_verified`: Boolean for active status.

#### `StudentParentRelationship`
Bridge table handling the Many-to-Many relationship between Students and Parents (Users).
- **Constraints**: Unique pair (`student`, `parent`).
- **Flags**: `is_primary`, `can_create_outpass`, `can_pickup`.

### 2. Students & Housing (`apps/students`, `apps/housing`)

#### `Student`
Core entity representing a student.
- **Housing**: Foreign Keys to `Hostel` and `Room`.
- **Academic**: Foreign Keys to `Class` and `Section` (in `apps/academic`).
- **Identity**: `student_id` (Unique), `roll_number`.

#### `Hostel`
Represents a hostel building.
- **Warden**: ForeignKey to `User` (One warden per hostel typically, though model allows linking).

### 3. Outpass System (`apps/outpasses`)

#### `Outpass`
The core transaction record.
- **Status Lifecycle**:
- **Status Lifecycle**:
  `PENDING` -> `APPROVED` -> `READY_FOR_EXIT` -> `CHECKED_OUT` -> `COMPLETED`
  *Special Statuses*: `REJECTED`, `CANCELLED`, `MEETING`, `FEE_PENDING`, `OVERDUE`
- **Priority**: `is_priority` flag for urgent requests.
- **Security**:
  - `exit_code`: 6-digit code for gate exit.
  - `return_code`: 6-digit code for gate entry.
  - `qr_code`: Encrypted token for scanning.

#### `Approval`
Tracks the approval chain for an outpass.
- **Approver**: Link to `User`.
- **Status**: `APPROVED`, `REJECTED`.
- **Constraint**: Unique per (`outpass`, `approver_role`) to ensure one approval per role type.
