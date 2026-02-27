import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { taskGeneratorsApi } from '../../api/taskGenerators';
import { Select } from '../ui/Select';

interface GeneratorSelectorProps {
  dealershipId?: number | null;
  value?: number | null;
  onChange: (generatorId: number | null) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  showAllOption?: boolean;
  allOptionLabel?: string;
  label?: string;
}

/**
 * Селектор для выбора генератора задач.
 *
 * @example
 * <GeneratorSelector
 *   dealershipId={1}
 *   value={selectedGeneratorId}
 *   onChange={setSelectedGeneratorId}
 *   showAllOption
 * />
 */
export const GeneratorSelector: React.FC<GeneratorSelectorProps> = ({
  dealershipId,
  value,
  onChange,
  placeholder = 'Выберите генератор',
  className = '',
  disabled = false,
  showAllOption = false,
  allOptionLabel = 'Все генераторы',
  label,
}) => {
  const { data: generatorsData, isLoading } = useQuery({
    queryKey: ['generator-selector', dealershipId],
    queryFn: async () => {
      const params: { per_page: number; dealership_id?: number } = {
        per_page: 100,
      };
      if (dealershipId) {
        params.dealership_id = dealershipId;
      }
      return taskGeneratorsApi.getGenerators(params);
    },
    staleTime: 1000 * 60,
  });

  const generators = generatorsData?.data || [];

  const options = [
    {
      value: '',
      label: isLoading ? 'Загрузка...' : (showAllOption ? allOptionLabel : placeholder),
    },
    ...generators.map((gen) => ({
      value: String(gen.id),
      label: gen.title,
    })),
  ];

  return (
    <Select
      label={label}
      value={value ? String(value) : ''}
      onChange={(e) => onChange(e.target.value ? parseInt(e.target.value, 10) : null)}
      options={options}
      disabled={disabled || isLoading}
      className={className}
    />
  );
};
