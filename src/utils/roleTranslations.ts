import type { Role } from '../types/user';

/**
 * Маппинг ролей на русский язык
 */
export const roleLabels: Record<Role, string> = {
  employee: 'Сотрудник',
  observer: 'Наблюдатель',
  manager: 'Управляющий',
  owner: 'Владелец',
};

/**
 * Описания ролей на русском языке
 */
export const roleDescriptions: Record<Role, string> = {
  employee: 'Только доступ к боту',
  observer: 'Только просмотр',
  manager: 'Управление салонами',
  owner: 'Полный доступ',
};

/**
 * Получить русское название роли
 * @param role - роль пользователя
 * @returns русское название роли или оригинальное значение, если перевод не найден
 */
export function getRoleLabel(role: string): string {
  return roleLabels[role as Role] || role;
}

/**
 * Получить описание роли на русском языке
 * @param role - роль пользователя
 * @returns описание роли или пустая строка, если не найдено
 */
export function getRoleDescription(role: string): string {
  return roleDescriptions[role as Role] || '';
}

/**
 * Переводит массив ролей на русский язык
 * @param roles - массив ролей
 * @returns строка с русскими названиями ролей через запятую
 */
export function translateRoles(roles: string[]): string {
  return roles.map(getRoleLabel).join(', ');
}
