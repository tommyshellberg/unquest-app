import { Env } from '@env';
import axios from 'axios';

import { getItem } from '@/lib/storage';

// Create a separate axios instance for provisional users
const provisionalApiClient = axios.create({
  baseURL: Env.API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Simple request interceptor that attaches the provisional token
provisionalApiClient.interceptors.request.use(
  (config) => {
    const provisionalToken = getItem<string>('provisionalAccessToken');

    if (provisionalToken) {
      config.headers.Authorization = `Bearer ${provisionalToken}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export { provisionalApiClient };
