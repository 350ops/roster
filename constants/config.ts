import Constants from 'expo-constants';

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

  // Priority 1: Environment Variable (Standard Expo way)
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl) {
    if (isDev) console.log('🌐 Using API_URL from ENV:', envUrl);
    return `${envUrl}/upload`;
  }

  // Priority 2: hardcoded Railway URL (The one we know works)
  const railwayUrl = "https://roster-production-7e0a.up.railway.app";
  if (isDev) {
    console.log('🚀 Using Railway API (Development):', railwayUrl);
    return `${railwayUrl}/upload`;
  }

  // Priority 3: app.json extra
  const productionUrl = Constants.expoConfig?.extra?.apiUrl as string | undefined;
  if (productionUrl) {
    return `${productionUrl}/upload`;
  }

  return '/api/upload';
};

export const API_URL = getApiUrl();


