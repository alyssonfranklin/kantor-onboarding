import React, { useState } from "react";

interface CalendarRangePickerProps {
  maxDate?: Date;
  onChange?: (range: { startDate: Date | null; endDate: Date | null }) => void;
  onConfirm: () => void;
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isDateInRange(date: Date, start: Date | null, end: Date | null) {
  if (!start || !end) return false;
  return date >= start && date <= end;
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

const WEEK_DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export const CalendarRangePicker: React.FC<CalendarRangePickerProps> = ({
  maxDate,
  onChange,
  onConfirm
}) => {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  const handlePrevMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
    );
  };

  const handleNextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
    );
  };

  const handleDateClick = (date: Date) => {
    if (!startDate || (startDate && endDate)) {
      setStartDate(date);
      setEndDate(null);
      onChange?.({ startDate: date, endDate: null });
    } else if (startDate && !endDate) {
      if (date < startDate) {
        setStartDate(date);
        setEndDate(startDate);
        onChange?.({ startDate: date, endDate: startDate });
      } else {
        setEndDate(date);
        onChange?.({ startDate, endDate: date });
      }
    }
  };

  const renderDays = () => {
    const days = [];
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDayOfWeek = new Date(year, month, 1).getDay();
    const daysInMonth = getDaysInMonth(year, month);

    // Fill empty days before the first day
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const disabled =
        (maxDate && date > maxDate) ||
        date > new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const selected =
        (startDate && isSameDay(date, startDate)) ||
        (endDate && isSameDay(date, endDate));
      const inRange = isDateInRange(date, startDate, endDate);

      days.push(
        <button
          key={day}
          className={`w-8 h-8 rounded-full flex items-center justify-center
            ${
              selected
                ? "bg-blue-600 text-white"
                : inRange
                ? "bg-blue-100 text-blue-700"
                : "hover:bg-blue-50"
            }
            ${disabled ? "text-gray-300 cursor-not-allowed" : ""}
          `}
          onClick={() => !disabled && handleDateClick(date)}
          disabled={disabled}
        >
          {day}
        </button>
      );
    }
    return days;
  };

  const confirmDates = () => {
    onConfirm();
  }

  return (
    <div className="w-80 p-4 bg-white rounded-lg shadow">
      <div className="flex items-center justify-between mb-2">
        <button
          className="p-1 rounded hover:bg-gray-100"
          onClick={handlePrevMonth}
        >
          &lt;
        </button>
        <span className="font-semibold">
          {currentMonth.toLocaleString("default", {
            month: "long",
            year: "numeric",
          })}
        </span>
        <button
          className="p-1 rounded hover:bg-gray-100"
          onClick={handleNextMonth}
        >
          &gt;
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center mb-1">
        {WEEK_DAYS.map((d) => (
          <div key={d} className="text-xs font-medium text-gray-500">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">{renderDays()}</div>
      <div className="mt-4 text-xs text-gray-600 flex justify-between items-center gap-2">
        <div>
          {startDate && (
            <span>
              Start: {startDate.toLocaleDateString()}
              {endDate && (
                <span> &rarr; End: {endDate.toLocaleDateString()}</span>
              )}
            </span>
          )}
        </div>
        <div>
          {startDate && endDate && (
            <button 
              type="button"
              className="inline-flex items-center text-white bg-green-500 p-1 rounded-md cursor-pointer"
              onClick={confirmDates}
            >
              <svg
                className="w-4 h-4 mr-1"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CalendarRangePicker;