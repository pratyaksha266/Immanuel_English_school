# Backend Documentation

The backend is built using **Django** and **Django REST Framework (DRF)**. It provides the API for both the Mobile App and the Admin Portal.

## 1. Setup Guide

### Prerequisites
- Python 3.10+
- Virtualenv (recommended)

### Installation
```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
.\venv\Scripts\activate
# Linux/Mac:
# source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### Database Setup
The project uses SQLite by default for development.
```bash
# Run migrations
python manage.py migrate

# Create superuser (for admin access)
python manage.py createsuperuser
```

### Running the Server
```bash
python manage.py runserver 0.0.0.0:8000
```
The server will start at `http://localhost:8000`.

## 2. Project Structure

```
backend/
├── apps/                 # Django apps
│   ├── outpasses/       # Outpass management logic
│   ├── users/           # User authentication & roles
│   └── ...
├── outpass_system/      # Project configuration (settings.py)
├── manage.py            # CLI entry point
├── requirements.txt     # Python dependencies
└── db.sqlite3           # SQLite database
```

## 3. Key Apps

### Users App (`apps/users`)
Handles authentication and user roles.
- **Roles**: Student, Parent, Warden, HM (Principal), Gate Staff, Accountant, Admin.
- **Auth**: JWT-based authentication.

### Outpasses App (`apps/outpasses`)
Manages the lifecycle of an outpass.
- **Status Workflow**: 
  - `PENDING`: Initial request.
  - `APPROVED`: Approved by HM/Principal.
  - `REJECTED`: Decision by Warden or HM.
  - `MEETING`: HM schedules a meeting with parent.
  - `FEE_PENDING`: Accountant flags a fee issue.
  - `READY_FOR_EXIT`: Warden authorizes exit (vacates student from hostel).
  - `CHECKED_OUT`: Student exits gate (scanned).
  - `COMPLETED`: Student returns and scans in.

## 4. API Documentation
The API follows RESTful principles.
- **Base URL**: `/api/`
- **Auth**: Pass `Authorization: Bearer <token>` header.

### Common Endpoints
- `POST /api/token/`: Get access & refresh tokens.
- `POST /api/token/refresh/`: Refresh access token.
- `GET /api/users/profile/`: Get current user profile.
- `GET /api/outpasses/`: List outpasses (filtered by role).

## 5. Testing
To run the automated tests:
```bash
python manage.py test
```
