// Dynamic host detection for local/emulator testing - unified backend database sync
const getApiBaseUrl = () => {
  // ADB reverse tcp:8000 tcp:8000 forwards physical phone requests directly to host PC backend on port 8000
  return 'http://localhost:8000';
};

export const API_BASE_URL = getApiBaseUrl();

