import {
  format,
  parseISO,
  differenceInHours,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
} from 'date-fns';
import { ru } from 'date-fns/locale';

/**
 * Централизованная утилита для работы с датами.
 *
 * Backend работает только с UTC (ISO 8601 с Z suffix).
 * Frontend отвечает за конвертацию UTC <-> локальное время клиента.
 *
 * Принцип:
 * - Данные с API приходят в UTC (например: "2025-01-27T10:30:00Z")
 * - При отображении конвертируем в локальное время клиента
 * - При отправке на API конвертируем обратно в UTC
 */

/**
 * Получить timezone пользователя (например: "Europe/Moscow")
 */
export function getUserTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/**
 * Парсинг UTC ISO строки в Date объект.
 * JavaScript Date автоматически представляет время в локальном timezone при отображении.
 *
 * @param isoString - ISO 8601 строка с Z suffix (например: "2025-01-27T10:30:00Z")
 * @returns Date объект или null
 */
export function parseUtc(isoString: string | null | undefined): Date | null {
  if (!isoString) return null;
  return parseISO(isoString);
}

/**
 * Конвертация Date в UTC ISO строку для отправки на API.
 *
 * @param date - Date объект (в локальном времени)
 * @returns ISO 8601 строка с Z suffix
 */
export function toUtcIso(date: Date | null | undefined): string | null {
  if (!date) return null;
  return date.toISOString();
}

/**
 * Форматирование UTC ISO строки в локальное время для отображения.
 *
 * @param isoString - ISO 8601 строка с Z suffix
 * @param formatStr - формат date-fns (по умолчанию: "d MMMM yyyy, HH:mm")
 * @returns отформатированная строка в локальном времени
 */
export function formatDateTime(
  isoString: string | null | undefined,
  formatStr: string = 'd MMMM yyyy, HH:mm'
): string {
  if (!isoString) return '';
  // parseISO автоматически обрабатывает UTC и конвертирует в локальное время
  return format(parseISO(isoString), formatStr, { locale: ru });
}

/**
 * Форматирование времени (HH:mm) из UTC ISO строки.
 */
export function formatTime(isoString: string | null | undefined): string {
  return formatDateTime(isoString, 'HH:mm');
}

/**
 * Форматирование даты из UTC ISO строки.
 */
export function formatDate(isoString: string | null | undefined): string {
  return formatDateTime(isoString, 'd MMM yyyy');
}

/**
 * Форматирование даты в коротком формате (для компактных UI).
 */
export function formatDateShort(isoString: string | null | undefined): string {
  return formatDateTime(isoString, 'd MMM');
}

/**
 * Форматирование даты и времени в компактном формате.
 */
export function formatDateTimeShort(isoString: string | null | undefined): string {
  return formatDateTime(isoString, 'd MMM, HH:mm');
}

/**
 * Конвертация значения datetime-local input в UTC ISO для отправки на API.
 *
 * @param value - значение из input type="datetime-local" (например: "2025-01-27T15:30")
 * @returns UTC ISO строка (например: "2025-01-27T10:30:00.000Z" если клиент в UTC+5)
 */
export function datetimeLocalToUtc(value: string | null | undefined): string | null {
  if (!value) return null;
  // datetime-local значение интерпретируется как локальное время
  return new Date(value).toISOString();
}

/**
 * Конвертация UTC ISO строки в значение для datetime-local input.
 *
 * @param isoString - UTC ISO строка (например: "2025-01-27T10:30:00Z")
 * @returns значение для datetime-local (например: "2025-01-27T15:30" если клиент в UTC+5)
 */
export function utcToDatetimeLocal(isoString: string | null | undefined): string {
  if (!isoString) return '';
  // format выводит в локальном времени
  return format(parseISO(isoString), "yyyy-MM-dd'T'HH:mm");
}

/**
 * Конвертация UTC времени (HH:mm) в локальное время для отображения.
 * Используется для настроек типа archive_completed_time.
 *
 * @param utcTime - время в UTC (например: "03:00")
 * @returns локальное время (например: "08:00" если клиент в UTC+5)
 */
export function utcTimeToLocal(utcTime: string | null | undefined): string {
  if (!utcTime) return '';
  // Интерпретируем как сегодня в UTC
  const today = new Date();
  const [hours, minutes] = utcTime.split(':').map(Number);
  const utcDate = new Date(
    Date.UTC(today.getFullYear(), today.getMonth(), today.getDate(), hours, minutes)
  );
  return format(utcDate, 'HH:mm');
}

/**
 * Конвертация локального времени (HH:mm) в UTC для отправки на API.
 * Используется для настроек типа archive_completed_time.
 *
 * @param localTime - локальное время (например: "08:00")
 * @returns время в UTC (например: "03:00" если клиент в UTC+5)
 */
export function localTimeToUtc(localTime: string | null | undefined): string {
  if (!localTime) return '';
  const today = new Date();
  const [hours, minutes] = localTime.split(':').map(Number);
  // Создаём дату в локальном времени
  const localDate = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
    hours,
    minutes
  );
  // Получаем UTC часы и минуты
  const utcHours = localDate.getUTCHours().toString().padStart(2, '0');
  const utcMinutes = localDate.getUTCMinutes().toString().padStart(2, '0');
  return `${utcHours}:${utcMinutes}`;
}

/**
 * Проверка: дата в прошлом (сравнение с текущим временем).
 */
export function isPast(isoString: string | null | undefined): boolean {
  if (!isoString) return false;
  return parseISO(isoString).getTime() < Date.now();
}

/**
 * Проверка: дата в будущем.
 */
export function isFuture(isoString: string | null | undefined): boolean {
  if (!isoString) return false;
  return parseISO(isoString).getTime() > Date.now();
}

/**
 * Проверка: дата сегодня (в локальном времени клиента).
 */
export function isToday(isoString: string | null | undefined): boolean {
  if (!isoString) return false;
  const date = parseISO(isoString);
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

/**
 * Получить текущее время в UTC ISO формате.
 */
export function nowUtcIso(): string {
  return new Date().toISOString();
}

/**
 * Конвертация даты (Y-m-d) в UTC ISO (начало дня в локальном времени → UTC).
 * Для фильтров где нужна только дата.
 *
 * @param dateStr - строка даты (например: "2025-01-27")
 * @returns UTC ISO строка начала дня
 */
export function dateToUtcIso(dateStr: string | null | undefined): string | null {
  if (!dateStr) return null;
  // Интерпретируем как начало дня в локальном времени
  const date = new Date(dateStr + 'T00:00:00');
  return date.toISOString();
}

/**
 * Конвертация UTC ISO в локальную дату (Y-m-d) для input type="date".
 */
export function utcToDateInput(isoString: string | null | undefined): string {
  if (!isoString) return '';
  return format(parseISO(isoString), 'yyyy-MM-dd');
}

// =============================================================================
// Сравнение дедлайнов
// =============================================================================

/**
 * Вычисляет количество часов до дедлайна.
 *
 * @param isoString - UTC ISO строка дедлайна
 * @returns часы до дедлайна (отрицательное если просрочено), Infinity если дедлайн не задан
 */
export function hoursUntilDeadline(isoString: string | null | undefined): number {
  if (!isoString) return Infinity;
  const deadline = parseISO(isoString);
  return differenceInHours(deadline, new Date());
}

/**
 * Статус дедлайна для UI стилизации.
 */
export type DeadlineStatus = 'normal' | 'soon' | 'urgent' | 'overdue';

/**
 * Определяет статус дедлайна для UI стилизации.
 *
 * @param isoString - UTC ISO строка дедлайна
 * @returns статус: 'overdue' (просрочено), 'urgent' (<2ч), 'soon' (<24ч), 'normal'
 */
export function getDeadlineStatus(isoString: string | null | undefined): DeadlineStatus {
  const hours = hoursUntilDeadline(isoString);
  if (hours < 0) return 'overdue';
  if (hours < 2) return 'urgent';
  if (hours < 24) return 'soon';
  return 'normal';
}

// =============================================================================
// Периоды для отчётов
// =============================================================================

/**
 * Диапазон дат (от и до).
 */
export interface DateRange {
  from: string;
  to: string;
}

/**
 * Получить диапазон текущей недели (Пн-Вс) в локальном времени.
 *
 * @returns объект с датами from и to в формате YYYY-MM-DD
 */
export function getCurrentWeekRange(): DateRange {
  const now = new Date();
  return {
    from: format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
    to: format(endOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
  };
}

/**
 * Получить диапазон текущего месяца в локальном времени.
 *
 * @returns объект с датами from и to в формате YYYY-MM-DD
 */
export function getCurrentMonthRange(): DateRange {
  const now = new Date();
  return {
    from: format(startOfMonth(now), 'yyyy-MM-dd'),
    to: format(endOfMonth(now), 'yyyy-MM-dd'),
  };
}

// =============================================================================
// Вспомогательные функции
// =============================================================================

/**
 * Получить текущую дату в формате YYYY-MM-DD (локальное время).
 */
export function getTodayDateString(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

/**
 * Получить текущий год (локальное время).
 */
export function getCurrentYear(): number {
  return new Date().getFullYear();
}

/**
 * Форматирование текущего времени для live-отображения (HH:mm:ss).
 */
export function formatCurrentTime(): string {
  return format(new Date(), 'HH:mm:ss', { locale: ru });
}

// =============================================================================
// Утилиты для календаря
// =============================================================================

/**
 * Получить количество дней в месяце.
 *
 * @param year - год
 * @param month - месяц (1-12)
 */
export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/**
 * Получить день недели первого дня месяца.
 *
 * @param year - год
 * @param month - месяц (1-12)
 * @returns 0 = Понедельник, 6 = Воскресенье
 */
export function getFirstDayOfMonth(year: number, month: number): number {
  const day = new Date(year, month - 1, 1).getDay();
  return day === 0 ? 6 : day - 1;
}
