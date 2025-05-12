import { useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

export default function ImprovedCalendar({
  mode = "multiple",
  selected = [],
  onSelect,
  className = "",
  classNames = {},
  components = {},
  styles = {},
}) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Navigation functions
  const prevMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
    );
  };

  const nextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
    );
  };

  // Date selection handler
  const handleDateSelect = (date) => {
    if (!onSelect) return;

    const dateStr = date.toISOString().split("T")[0];
    const isSelected = selected.some(
      (d) => d.toISOString().split("T")[0] === dateStr
    );

    if (mode === "single") {
      onSelect(isSelected ? null : date);
    } else {
      if (isSelected) {
        onSelect(
          selected.filter((d) => d.toISOString().split("T")[0] !== dateStr)
        );
      } else {
        onSelect([...selected, date]);
      }
    }
  };

  // Check if a date is selected
  const isDateSelected = (date) => {
    if (!date) return false;
    const dateStr = date.toISOString().split("T")[0];
    return selected.some((d) => d.toISOString().split("T")[0] === dateStr);
  };

  // Check if a date is today
  const isToday = (date) => {
    if (!date) return false;
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  // Generate calendar days
  const getDaysInMonth = (year, month) =>
    new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const renderCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDayOfMonth = getFirstDayOfMonth(year, month);

    const days = [];

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="w-10 h-10"></div>);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const selected = isDateSelected(date);
      const today = isToday(date);

      days.push(
        <button
          key={day}
          type="button"
          onClick={() => handleDateSelect(date)}
          className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors
            ${
              selected
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "hover:bg-gray-100"
            }
            ${today && !selected ? "border border-blue-500 text-blue-600" : ""}
          `}
        >
          {day}
        </button>
      );
    }

    return days;
  };

  // Format month and year for display
  const formatMonthYear = (date) => {
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  };

  // Use provided components or defaults
  const {
    IconLeft = () => <ChevronLeft className="h-5 w-5 text-gray-500" />,
    IconRight = () => <ChevronRight className="h-5 w-5 text-gray-500" />,
  } = components;

  return (
    <div
      className={`bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden ${className}`}
    >
      {/* Calendar Header */}
      <div className="p-4 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between">
          <button
            onClick={prevMonth}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Previous month"
          >
            <IconLeft />
          </button>

          <h2 className="text-lg font-medium text-gray-900">
            {formatMonthYear(currentMonth)}
          </h2>

          <button
            onClick={nextMonth}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Next month"
          >
            <IconRight />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="p-4 pb-2">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 mb-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div
              key={day}
              className="text-center text-sm font-medium text-gray-500 h-8 flex items-center justify-center"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-1 place-items-center">
          {renderCalendarDays()}
        </div>
      </div>

      {/* Selected Dates Display */}
      {selected.length > 0 && (
        <div className="p-4 bg-gray-50 border-t border-gray-200">
          <h3 className="text-sm font-medium text-gray-700 mb-2">
            Selected dates ({selected.length}):
          </h3>
          <div className="flex flex-wrap gap-2">
            {selected
              .sort((a, b) => a - b)
              .map((date, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                >
                  {date.toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                  <button
                    type="button"
                    onClick={() => {
                      const dateStr = date.toISOString().split("T")[0];
                      onSelect(
                        selected.filter(
                          (d) => d.toISOString().split("T")[0] !== dateStr
                        )
                      );
                    }}
                    className="ml-1.5 rounded-full p-0.5 hover:bg-blue-200"
                    aria-label="Remove date"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
