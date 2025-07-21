export const TIMEZONES = [
  { label: 'UTC', value: 'UTC' },
  // Americas
  { label: 'Eastern Time (US)', value: 'America/New_York' },
  { label: 'Central Time (US)', value: 'America/Chicago' },
  { label: 'Mountain Time (US)', value: 'America/Denver' },
  { label: 'Pacific Time (US)', value: 'America/Los_Angeles' },
  { label: 'Eastern Time (Canada)', value: 'America/Toronto' },
  { label: 'Pacific Time (Canada)', value: 'America/Vancouver' },
  { label: 'Mexico City', value: 'America/Mexico_City' },
  { label: 'São Paulo', value: 'America/Sao_Paulo' },
  // Europe
  { label: 'London', value: 'Europe/London' },
  { label: 'Paris', value: 'Europe/Paris' },
  { label: 'Berlin', value: 'Europe/Berlin' },
  { label: 'Madrid', value: 'Europe/Madrid' },
  { label: 'Rome', value: 'Europe/Rome' },
  { label: 'Moscow', value: 'Europe/Moscow' },
  // Asia
  { label: 'Tokyo', value: 'Asia/Tokyo' },
  { label: 'Shanghai', value: 'Asia/Shanghai' },
  { label: 'Hong Kong', value: 'Asia/Hong_Kong' },
  { label: 'Singapore', value: 'Asia/Singapore' },
  { label: 'Seoul', value: 'Asia/Seoul' },
  { label: 'Mumbai', value: 'Asia/Mumbai' },
  { label: 'Dubai', value: 'Asia/Dubai' },
  // Oceania
  { label: 'Sydney', value: 'Australia/Sydney' },
  { label: 'Melbourne', value: 'Australia/Melbourne' },
  { label: 'Auckland', value: 'Pacific/Auckland' },
  // Africa
  { label: 'Cairo', value: 'Africa/Cairo' },
  { label: 'Johannesburg', value: 'Africa/Johannesburg' },
] as const;

export type Timezone = (typeof TIMEZONES)[number]['value'];
