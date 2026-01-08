# Admin Portal Documentation

The Admin Portal is a web-based dashboard built with **React**, **TypeScript**, and **Vite**. It is used by school administrators to manage users, view statistics, and configure the system.

## 1. Setup Guide

### Prerequisites
- Node.js (v18+)

### Installation
```bash
# Navigate to admin-portal directory
cd admin-portal

# Install dependencies
npm install
```

### Running the Portal
```bash
npm run dev
```
The application will start at `http://localhost:5173`.

## 2. Features

### Dashboard
- **Overview**: View real-time statistics of outpasses (Pending, Active, Returned).
- **Charts**: Visual analytics of outpass trends.

### User Management
- **Students**: Add, edit, and view student details. Manage parent associations.
- **Parents**: Manage parent accounts and link them to students.
- **Staff**: Manage Wardens, Gate Staff, HM/Principals, and other administrators.

### Outpass Management
- **All Outpasses**: A master list of all outpass requests with filtering capabilities.
- **Reports**: Generate reports for specific time periods.

## 3. Technology Stack
- **Framework**: React (Vite)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Context / Hooks
- **Routing**: React Router

## 4. Configuration
The API base URL is configured in the environment variables or a configuration file (e.g., `.env` or `src/config.ts`). Ensure it points to your running backend (usually `http://localhost:8000`).
