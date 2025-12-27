import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Get the API URL based on the current environment
 * 
 * IMPORTANT: Expo Router API routes only work in development mode.
 * For production builds, you MUST deploy your Flask server separately
 * and configure the URL below or via environment variables.
 * 
 * Options:
 * 1. Deploy Flask server to: Heroku, Railway, Render, AWS, etc.
 * 2. Set API_URL in app.json extra config or via EAS secrets
 * 3. Use the Expo API route only for development
 */
export const getApiUrl = (): string => {
  const isDev = __DEV__;
  
  if (isDev) {
    // Development: Use Flask server (recommended - more reliable)
    // The Expo API route has issues with pdf-parse in Edge runtime
    return Platform.OS === 'android' 
      ? 'http://10.0.2.2:5002/upload' 
      : 'http://localhost:5002/upload';
    
    // Alternative: Use Expo API route (may have issues with pdf-parse)
    // const devServerUrl = Constants.expoConfig?.hostUri || 'localhost:8081';
    // const protocol = Platform.OS === 'android' ? 'http://10.0.2.2:8081' : `http://${devServerUrl}`;
    // return `${protocol}/api/upload`;
  }
  
  // Production: MUST use a deployed server URL
  // Option 1: Set via app.json extra config (recommended)
  const productionUrl = Constants.expoConfig?.extra?.apiUrl as string | undefined;
  
  if (productionUrl) {
    return `${productionUrl}/upload`;
  }
  
  // Option 2: Set via EAS secrets (for sensitive URLs)
  // Run: eas secret:create --scope project --name API_URL --value https://your-server.com
  // Then access via Constants.expoConfig.extra (EAS injects secrets into extra)
  // Or use EXPO_PUBLIC_API_URL for public env vars (available at build time)
  const envApiUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envApiUrl) {
    return `${envApiUrl}/upload`;
  }
  
  // Fallback: This will NOT work in production native apps!
  // You must configure one of the options above before building
  if (__DEV__) {
    console.warn('⚠️ No production API URL configured! This will fail in production builds.');
  }
  return '/api/upload'; // This will fail in production
};

export const API_URL = getApiUrl();

