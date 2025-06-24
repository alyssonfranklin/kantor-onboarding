import React from 'react';

interface ProgressBarProps {
  value: number; // Current progress value (0-100)
  color?: string; // Color of the progress bar
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  color = '#E62E05'
}) => {
  return (
    <div className={`w-32 bg-gray-200 rounded-full h-3 relative border border-gray-200`}>
      <div
        className={`bg-[${color}] h-3 rounded-full`}
        style={{ width: `${value}%` }}
      ></div>
    </div>
  );
};

export default ProgressBar;