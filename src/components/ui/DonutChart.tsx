import React from 'react';

interface DonutChartSegment {
  value: number;
  color: string;
  label: string;
}

interface DonutChartProps {
  segments: DonutChartSegment[];
  size?: number;
  strokeWidth?: number;
  centerValue?: string | number;
  centerLabel?: string;
  className?: string;
}

/**
 * SVG-based donut chart component for visualizing statistics.
 *
 * @example
 * <DonutChart
 *   segments={[
 *     { value: 75, color: '#22c55e', label: 'Выполнено' },
 *     { value: 15, color: '#ef4444', label: 'Просрочено' },
 *     { value: 10, color: '#f59e0b', label: 'В ожидании' },
 *   ]}
 *   centerValue="75%"
 *   centerLabel="Выполнение"
 * />
 */
export const DonutChart: React.FC<DonutChartProps> = ({
  segments,
  size = 160,
  strokeWidth = 24,
  centerValue,
  centerLabel,
  className = '',
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  // Calculate total and filter out zero values
  const total = segments.reduce((sum, s) => sum + s.value, 0);

  if (total === 0) {
    return (
      <div className={`flex flex-col items-center justify-center ${className}`} style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-gray-200 dark:text-gray-700"
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center">
          <span className="text-sm text-gray-500 dark:text-gray-400">Нет данных</span>
        </div>
      </div>
    );
  }

  // Calculate segment positions
  let accumulatedOffset = 0;
  // Gap between segments in pixels (along the circumference)
  const GAP_LENGTH = 2;
  const activeSegments = segments.filter(s => s.value > 0);
  const shouldApplyGap = activeSegments.length > 1;

  const renderedSegments = activeSegments.map((segment) => {
    const percentage = segment.value / total;
    const segmentLength = percentage * circumference;
    // Subtract gap from length if we have multiple segments to create clean separation
    const visibleLength = shouldApplyGap ? Math.max(0, segmentLength - GAP_LENGTH) : segmentLength;

    const dashArray = `${visibleLength} ${circumference - visibleLength}`;
    const dashOffset = -accumulatedOffset;
    accumulatedOffset += segmentLength;

    return {
      ...segment,
      percentage,
      dashArray,
      dashOffset,
    };
  });

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-gray-100 dark:text-gray-800"
        />

        {/* Segment circles */}
        {renderedSegments.map((segment, index) => (
          <circle
            key={index}
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={segment.color}
            strokeWidth={strokeWidth}
            strokeDasharray={segment.dashArray}
            strokeDashoffset={segment.dashOffset}
            strokeLinecap="butt"
            className="transition-all duration-500 ease-out"
            style={{
              animation: 'donutSegmentFill 0.8s ease-out forwards',
              animationDelay: `${index * 0.1}s`,
            }}
          />
        ))}
      </svg>

      {/* Center content */}
      {(centerValue !== undefined || centerLabel) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {centerValue !== undefined && (
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              {centerValue}
            </span>
          )}
          {centerLabel && (
            <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {centerLabel}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

interface DonutChartLegendProps {
  segments: DonutChartSegment[];
  className?: string;
}

/**
 * Legend component for DonutChart.
 */
export const DonutChartLegend: React.FC<DonutChartLegendProps> = ({
  segments,
  className = '',
}) => {
  const total = segments.reduce((sum, s) => sum + s.value, 0);

  return (
    <div className={`space-y-2 ${className}`}>
      {segments.map((segment, index) => {
        const percentage = total > 0 ? Math.round((segment.value / total) * 100) : 0;
        return (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: segment.color }}
            />
            <span className="text-gray-600 dark:text-gray-300 flex-1">
              {segment.label}
            </span>
            <span className="text-gray-900 dark:text-white font-medium">
              {segment.value}
            </span>
            <span className="text-gray-400 dark:text-gray-500 text-xs w-10 text-right">
              ({percentage}%)
            </span>
          </div>
        );
      })}
    </div>
  );
};
