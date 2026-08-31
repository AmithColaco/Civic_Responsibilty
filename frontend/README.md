# CivicSense Frontend

This folder contains the React-Vite web frontend application for CivicSense.

For full project documentation (Architecture, Tech Stack, setup instructions, backend API guides, and environment variables), please refer to the main repository README:

👉 **[Main Repository README](../README.md)**

---

## Developer Quick Start

### Prerequisites
Make sure you have Node.js and npm installed, and the backend server is running on port `8000`.

### Running Locally
```bash
# Install dependencies
npm install

# Start Vite development server
npm run dev
```

### Building for Production
```bash
npm run build
```

### Compiling to Mobile Platforms (Capacitor)
```bash
# Add Capacitor platform
npx cap add android
npx cap add ios

# Sync web build assets with Capacitor projects
npm run build
npx cap sync

# Open the project in Android Studio / Xcode
npx cap open android
npx cap open ios
```
