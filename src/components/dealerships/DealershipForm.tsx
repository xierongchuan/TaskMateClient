import React, { useState } from 'react';
import { useCreateDealership, useUpdateDealership } from '../../hooks/useDealerships';
import type { Dealership } from '../../types/dealership';
import { TIMEZONES } from '../../types/dealership';
import { BuildingOfficeIcon, PhoneIcon, MapPinIcon, GlobeAltIcon } from '@heroicons/react/24/outline';
import { sanitizePhoneNumber } from '../../utils/phoneFormatter';
import { Input, Select, Button } from '../ui';

interface DealershipFormProps {
  dealership?: Dealership;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const DealershipForm: React.FC<DealershipFormProps> = ({
  dealership,
  onSuccess,
  onCancel
}) => {
  const [formData, setFormData] = useState({
    name: dealership?.name || '',
    address: dealership?.address || '',
    phone: dealership?.phone || '',
    timezone: dealership?.timezone || '+05:00',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const createDealership = useCreateDealership();
  const updateDealership = useUpdateDealership();

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Название обязательно для заполнения';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Название должно содержать минимум 2 символа';
    }

    if (formData.phone && formData.phone.trim()) {
      // More flexible validation: just check if it has + at the start and contains digits
      const phonePattern = /^\+?[0-9\s()\-\.]+$/;
      if (!phonePattern.test(formData.phone)) {
        newErrors.phone = 'Введите корректный номер телефона';
      } else {
        // Check sanitized version has minimum length
        const sanitized = sanitizePhoneNumber(formData.phone);
        if (sanitized.length < 8 || sanitized.length > 20) {
          newErrors.phone = 'Номер телефона должен содержать от 8 до 20 цифр';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      // Sanitize phone number before sending
      const sanitizedPhone = formData.phone.trim()
        ? sanitizePhoneNumber(formData.phone)
        : undefined;

      if (dealership) {
        // Обновление существующего автосалона
        await updateDealership.mutateAsync({
          id: dealership.id,
          data: {
            name: formData.name.trim(),
            address: formData.address.trim() || undefined,
            phone: sanitizedPhone,
            timezone: formData.timezone,
          },
        });
      } else {
        // Создание нового автосалона
        await createDealership.mutateAsync({
          name: formData.name.trim(),
          address: formData.address.trim() || undefined,
          phone: sanitizedPhone,
          timezone: formData.timezone,
        });
      }

      onSuccess?.();
    } catch (error: any) {
      console.error('Error saving dealership:', error);
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else {
        setErrors({
          general: error.response?.data?.message || 'Ошибка сохранения автосалона'
        });
      }
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const timezoneOptions = TIMEZONES.map((tz) => ({
    value: tz.value,
    label: tz.label,
  }));

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errors.general && (
        <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4">
          <p className="text-sm text-red-800 dark:text-red-200">{errors.general}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
        {/* Name Field */}
        <Input
          label="Название автосалона *"
          type="text"
          value={formData.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
          required
          minLength={2}
          placeholder="Например: Автомир Premium"
          icon={<BuildingOfficeIcon />}
          error={errors.name}
        />

        {/* Address Field */}
        <Input
          label="Адрес"
          type="text"
          value={formData.address}
          onChange={(e) => handleInputChange('address', e.target.value)}
          placeholder="Например: г. Москва, ул. Ленинградская, д. 15"
          icon={<MapPinIcon />}
          hint="Необязательно для заполнения"
        />

        {/* Phone Field */}
        <Input
          label="Телефон"
          type="tel"
          value={formData.phone}
          onChange={(e) => handleInputChange('phone', e.target.value)}
          placeholder="+998 99 495 85 14"
          icon={<PhoneIcon />}
          error={errors.phone}
          hint={!errors.phone ? "Необязательно для заполнения" : undefined}
        />

        {/* Timezone Field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Часовой пояс <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
              <GlobeAltIcon className="h-5 w-5 text-gray-400" />
            </div>
            <Select
              value={formData.timezone}
              onChange={(e) => handleInputChange('timezone', e.target.value)}
              options={timezoneOptions}
              className="pl-10"
            />
          </div>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Используется для определения выходных дней в календаре
          </p>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
        <Button
          type="submit"
          variant="primary"
          disabled={createDealership.isPending || updateDealership.isPending}
          isLoading={createDealership.isPending || updateDealership.isPending}
        >
          {dealership ? 'Сохранить изменения' : 'Создать автосалон'}
        </Button>
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
          >
            Отмена
          </Button>
        )}
      </div>
    </form>
  );
};
