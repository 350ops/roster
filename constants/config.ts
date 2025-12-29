import Constants from 'expo-constants';

/**
 * Get the API URL based on the current environment
 */
export const getApiUrl = (): string => {
  // Priority 1: Environment Variable (Defined in .env as EXPO_PUBLIC_API_URL)
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl) {
    console.log('💻 Using API URL from Environment:', envUrl);
    return `${envUrl}/upload`;
  }

  // Priority 2: Development Local IP (for physical devices)
  if (__DEV__) {
    const host = Constants.expoConfig?.hostUri?.split(':')[0];
    if (host) {
      const localUrl = `http://${host}:5002`;
      console.log('💻 Using Local IP Backend:', localUrl);
      return `${localUrl}/upload`;
    }

    // Fallback for Simulator/Emulator
    const fallbackUrl = 'http://127.0.0.1:5002';
    console.log('💻 Using Simulator Fallback:', fallbackUrl);
    return `${fallbackUrl}/upload`;
  }

  // Priority 3: app.json extra
  const productionUrl = Constants.expoConfig?.extra?.apiUrl as string | undefined;
  if (productionUrl) {
    return `${productionUrl}/upload`;
  }

  return '/api/upload';
};

export const API_URL = getApiUrl();
