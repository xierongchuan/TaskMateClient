#!/usr/bin/env node

/**
 * Тест проверки форматирования времени для recurrence_time
 *
 * Проверяет поведение с step="60" в input type="time"
 */

console.log('=== Тест форматирования recurrence_time ===\n');

// Симуляция значений, которые может вернуть input type="time" с step="60"
const testCases = [
  { input: '14:30', expected: '14:30', description: 'HH:MM формат (от step="60")' },
  { input: '09:05', expected: '09:05', description: 'С ведущими нулями' },
  { input: '00:00', expected: '00:00', description: 'Полночь' },
  { input: '23:59', expected: '23:59', description: 'Последняя минута дня' },
  { input: '14:30:00', expected: '14:30', description: 'HH:MM:SS (если браузер вернет с секундами)' },
  { input: '', expected: '', description: 'Пустая строка' },
  { input: null, expected: null, description: 'Null значение' },
  { input: undefined, expected: undefined, description: 'Undefined значение' },
];

// Симуляция логики из TaskModal.tsx handleSubmit
function formatRecurrenceTime(time) {
  if (!time) return time;
  return time.substring(0, 5);
}

let passed = 0;
let failed = 0;

console.log('Проверка форматирования:\n');

testCases.forEach((testCase, index) => {
  const result = formatRecurrenceTime(testCase.input);
  const isPass = result === testCase.expected;

  if (isPass) {
    passed++;
    console.log(`✅ Тест ${index + 1}: ${testCase.description}`);
  } else {
    failed++;
    console.log(`❌ Тест ${index + 1}: ${testCase.description}`);
    console.log(`   Ввод: "${testCase.input}"`);
    console.log(`   Ожидалось: "${testCase.expected}"`);
    console.log(`   Получено: "${result}"`);
  }
});

console.log('\n=== Результаты ===');
console.log(`Пройдено: ${passed}/${testCases.length}`);
console.log(`Провалено: ${failed}/${testCases.length}`);

console.log('\n=== Примеры использования step="60" ===');
console.log('В HTML5 input type="time" с step="60":');
console.log('- Показывает только часы и минуты (скрывает секунды в интерфейсе)');
console.log('- Возвращает значение в формате HH:MM (без секунд)');
console.log('- step="60" означает шаг в 60 секунд = 1 минута');
console.log('- Пользователь не может вводить секунды в UI');

console.log('\n=== Поведение в разных браузерах ===');
console.log('Chrome/Edge: step="60" → возвращает HH:MM');
console.log('Firefox: step="60" → возвращает HH:MM');
console.log('Safari: step="60" → возвращает HH:MM');
console.log('\nВсе современные браузеры поддерживают step="60" одинаково.');

if (failed === 0) {
  console.log('\n✅ Все тесты пройдены успешно!');
  process.exit(0);
} else {
  console.log('\n❌ Некоторые тесты провалены!');
  process.exit(1);
}
