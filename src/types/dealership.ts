export interface Dealership {
  id: number;
  name: string;
  address: string | null;
  phone: string | null;
  timezone: string;
  created_at: string;
  updated_at: string;
}

export interface CreateDealershipRequest {
  name: string;
  address?: string;
  phone?: string;
  timezone?: string;
}

/**
 * Список часовых поясов для выбора в форме автосалона.
 * Используется для определения границ календарных дней (выходных/праздников).
 * Формат: UTC offset для совместимости с Carbon/PHP.
 */
export const TIMEZONES = [
  { value: '-12:00', label: 'UTC-12' },
  { value: '-11:00', label: 'UTC-11' },
  { value: '-10:00', label: 'UTC-10' },
  { value: '-09:00', label: 'UTC-9' },
  { value: '-08:00', label: 'UTC-8' },
  { value: '-07:00', label: 'UTC-7' },
  { value: '-06:00', label: 'UTC-6' },
  { value: '-05:00', label: 'UTC-5' },
  { value: '-04:00', label: 'UTC-4' },
  { value: '-03:00', label: 'UTC-3' },
  { value: '-02:00', label: 'UTC-2' },
  { value: '-01:00', label: 'UTC-1' },
  { value: '+00:00', label: 'UTC+0' },
  { value: '+01:00', label: 'UTC+1' },
  { value: '+02:00', label: 'UTC+2' },
  { value: '+03:00', label: 'UTC+3' },
  { value: '+04:00', label: 'UTC+4' },
  { value: '+05:00', label: 'UTC+5' },
  { value: '+06:00', label: 'UTC+6' },
  { value: '+07:00', label: 'UTC+7' },
  { value: '+08:00', label: 'UTC+8' },
  { value: '+09:00', label: 'UTC+9' },
  { value: '+10:00', label: 'UTC+10' },
  { value: '+11:00', label: 'UTC+11' },
  { value: '+12:00', label: 'UTC+12' },
  { value: '+13:00', label: 'UTC+13' },
  { value: '+14:00', label: 'UTC+14' },
] as const;

/** @deprecated Use TIMEZONES instead */
export const RUSSIAN_TIMEZONES = TIMEZONES;
