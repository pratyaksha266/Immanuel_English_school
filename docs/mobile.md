# Mobile App Documentation

The mobile application is built with **React Native** using **Expo**. It supports three primary user roles: **Parents**, **Wardens**, and **Gate Staff**.

## 1. Setup Guide

### Prerequisites
- Node.js (v18+)
- Expo CLI (`npm install -g expo-cli`)
- Expo Go app on your physical device (iOS/Android) or an Emulator.

### Installation
```bash
# Navigate to mobile directory
cd mobile

# Install dependencies
npm install
```

### Configuration
You must configure the API endpoint to point to your backend server.
1. Open `constants/config.ts`.
2. Update the `API_URL` (or similar variable) with your computer's local IP address.
   - Example: `http://192.168.1.5:8000`
   - **Note**: Do not use `localhost` if testing on a physical device; use your LAN IP.

### Running the App
```bash
npx expo start
```
This will start the Metro bundler.
- **Physical Device**: Scan the QR code with the Expo Go app.
- **Emulator**: Press `a` for Android or `i` for iOS (Mac only).

## 2. User Roles & Flows

### Parent
- **Login**: Phone number based login.
- **Features**:
  - **Apply for Outpass**: Select date, time, and reason.
  - **View Status**: Track if the outpass is Pending, Approved, or Rejected.
  - **QR Code**: View the QR code for an approved outpass to show at the gate.

### Warden
- **Login**: Staff credentials.
- **Features**:
  - **Dashboard**: View pending outpass requests from students in their hostel.
  - **Action**: Vacate Student (Mark Ready for Exit) or Reject.
  - **History**: View past outpasses.

### HM / Principal
- **Login**: Admin/Staff credentials.
- **Features**:
  - **Master Dashboard**: View all outpass requests across all hostels.
  - **Overrides**: Approve or Reject any request, overriding Warden decisions if necessary.
  - **Meetings**: Schedule meetings with parents (sets status to `MEETING`).
  - **Reports**: View statistical reports on outpasses.

### Gate Staff
- **Login**: Staff credentials.
- **Features**:
  - **Scan QR**: Scan the student's QR code at the gate.
  - **Verify**: See student details and approval status.
  - **Log Entry/Exit**: Mark the student as "Exited" or "Returned".

## 3. Troubleshooting

### Network Error / Backend Not Reachable
- Ensure your phone and PC are on the **same Wi-Fi network**.
- Check if the backend is running (`python manage.py runserver 0.0.0.0:8000`).
- Verify the IP address in `constants/config.ts` is correct.
- If using an Android Emulator, use `http://10.0.2.2:8000`.

### Expo Cleartext Traffic Issue
If you see "Network Request Failed" on Android:
- Ensure `android:usesCleartextTraffic="true"` is set in `app.json` (or handled by Expo config) since we are using HTTP (not HTTPS).
