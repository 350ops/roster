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

  if (isDev) {
    const host = Constants.expoConfig?.hostUri?.split(':')[0];
    const port = Constants.expoConfig?.hostUri?.split(':')[1] || '8081';
    const localUrl = `http://${host}:${port}`;
    console.log('💻 Using Local Expo API:', localUrl);
    return `${localUrl}/api/upload`;
  }

  // Priority 1: Environment Variable (Standard Expo way)
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl) {
    return `${envUrl}/upload`;
  }

  // Priority 3: app.json extra
  const productionUrl = Constants.expoConfig?.extra?.apiUrl as string | undefined;
  if (productionUrl) {
    return `${productionUrl}/upload`;
  }

  return '/api/upload';
};

export const API_URL = getApiUrl();


