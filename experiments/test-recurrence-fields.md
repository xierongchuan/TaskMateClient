# Тест полей повторяемости задач

## Проблема
Пользователь сообщил: "Браузер показывает так как и раньше, так же там всё ещё стоят год мес и день"

## Анализ
После изучения кода выяснилось, что в `TaskModal.tsx` были установлены значения `recurrence_day_of_week` и `recurrence_day_of_month` в состоянии формы (строки 42-43), но не было соответствующих полей ввода в UI.

## Решение
Добавлены два условных поля ввода:

### 1. Для еженедельной повторяемости (weekly)
- **Поле**: "День недели" (recurrence_day_of_week)
- **Тип**: Выпадающий список (select)
- **Опции**: Понедельник (1) - Воскресенье (0)
- **Условие отображения**: `formData.recurrence === 'weekly'`

### 2. Для ежемесячной повторяемости (monthly)
- **Поле**: "День месяца" (recurrence_day_of_month)
- **Тип**: Выпадающий список (select)
- **Опции**: 1-31
- **Условие отображения**: `formData.recurrence === 'monthly'`

## Структура полей повторяемости

```
Повторяемость: [select] -> Не повторяется / Ежедневно / Еженедельно / Ежемесячно

↓ (если НЕ "Не повторяется")
Время повторения: [time input step="60"] -> HH:MM (без секунд)

↓ (если "Еженедельно")
День недели: [select] -> Понедельник / Вторник / ... / Воскресенье

↓ (если "Ежемесячно")
День месяца: [select] -> 1 / 2 / ... / 31
```

## Изменения в коде

**Файл**: `src/components/tasks/TaskModal.tsx`
**Строки**: 217-251

### Добавленный код для "День недели":
```typescript
{formData.recurrence === 'weekly' && (
  <div>
    <label className="block text-sm font-medium text-gray-700">День недели</label>
    <select
      value={formData.recurrence_day_of_week || ''}
      onChange={(e) => setFormData({ ...formData, recurrence_day_of_week: e.target.value ? parseInt(e.target.value) : undefined })}
      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
    >
      <option value="">Выберите день недели</option>
      <option value="1">Понедельник</option>
      <option value="2">Вторник</option>
      <option value="3">Среда</option>
      <option value="4">Четверг</option>
      <option value="5">Пятница</option>
      <option value="6">Суббота</option>
      <option value="0">Воскресенье</option>
    </select>
  </div>
)}
```

### Добавленный код для "День месяца":
```typescript
{formData.recurrence === 'monthly' && (
  <div>
    <label className="block text-sm font-medium text-gray-700">День месяца</label>
    <select
      value={formData.recurrence_day_of_month || ''}
      onChange={(e) => setFormData({ ...formData, recurrence_day_of_month: e.target.value ? parseInt(e.target.value) : undefined })}
      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
    >
      <option value="">Выберите день месяца</option>
      {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
        <option key={day} value={day}>{day}</option>
      ))}
    </select>
  </div>
)}
```

## Тестирование

### Сценарий 1: Ежедневная повторяемость
1. Выбрать "Ежедневно" в поле "Повторяемость"
2. Появится поле "Время повторения" с форматом ЧЧ:ММ (без секунд)
3. НЕ появятся поля "День недели" или "День месяца"

### Сценарий 2: Еженедельная повторяемость
1. Выбрать "Еженедельно" в поле "Повторяемость"
2. Появится поле "Время повторения" с форматом ЧЧ:ММ
3. Появится поле "День недели" с выбором дня недели

### Сценарий 3: Ежемесячная повторяемость
1. Выбрать "Ежемесячно" в поле "Повторяемость"
2. Появится поле "Время повторения" с форматом ЧЧ:ММ
3. Появится поле "День месяца" с выбором числа от 1 до 31

### Сценарий 4: Без повторяемости
1. Выбрать "Не повторяется" в поле "Повторяемость"
2. НЕ появятся никакие дополнительные поля

## Результаты сборки
- ✅ Build successful (TypeScript компиляция без ошибок)
- ✅ Lint: нет новых ошибок (38 существующих ошибок не связаны с этим изменением)

## Ответ на issue #54
Теперь пользователь может видеть и выбирать "день" (день недели или день месяца) в зависимости от выбранного типа повторяемости. Это решает проблему отсутствия полей для указания конкретного дня повторения задачи.
