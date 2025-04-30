import * as Sentry from '@sentry/react-native';
import { logger, sentryTransport } from 'react-native-logs';

export const log = logger.createLogger({
  severity: 'debug',
  transport: sentryTransport,
  transportOptions: {
    SENTRY: Sentry,
    errorLevels: 'error',
  },
});
