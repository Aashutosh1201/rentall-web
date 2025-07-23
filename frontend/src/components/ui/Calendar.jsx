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

  const isDateSelected = (date) => {
    const dateStr = date.toISOString().split("T")[0];
    return selected.some((d) => d.toISOString().split("T")[0] === dateStr);
  };

  const isToday = (date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const getDaysInMonth = (year, month) =>
    new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const renderCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDayOfMonth = getFirstDayOfMonth(year, month);
    const days = [];

    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="w-10 h-10" />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const selected = isDateSelected(date);
      const today = isToday(date);

      days.push(
        <button
          key={day}
          onClick={() => handleDateSelect(date)}
          className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-200
            ${
              selected
                ? "bg-blue-600 text-white hover:bg-blue-700 shadow"
                : today
                ? "border border-blue-500 text-blue-600 dark:text-blue-400 font-semibold"
                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
        >
          {day}
        </button>
      );
    }

    return days;
  };

  const formatMonthYear = (date) =>
    date.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const {
    IconLeft = () => <ChevronLeft className="h-5 w-5 text-gray-500 dark:text-gray-300" />,
    IconRight = () => <ChevronRight className="h-5 w-5 text-gray-500 dark:text-gray-300" />,
  } = components;

  return (
    <div
      className={`bg-white dark:bg-gray-900 dark:text-gray-100 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 ${className}`}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <button
            onClick={prevMonth}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Previous month"
          >
            <IconLeft />
          </button>

          <h2 className="text-lg font-semibold">
            {formatMonthYear(currentMonth)}
          </h2>

          <button
            onClick={nextMonth}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Next month"
          >
            <IconRight />
          </button>
        </div>
      </div>

      {/* Days */}
      <div className="p-4 pb-2">
        <div className="grid grid-cols-7 mb-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div
              key={day}
              className="text-center text-xs font-semibold text-gray-500 dark:text-gray-400 h-6"
            >
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2 place-items-center">
          {renderCalendarDays()}
        </div>
      </div>

      {/* Selected Dates */}
      {selected.length > 0 && (
        <div className="p-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-medium mb-2">
            Selected dates ({selected.length}):
          </h3>
          <div className="flex flex-wrap gap-2">
            {selected
              .sort((a, b) => a - b)
              .map((date, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
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
                    className="ml-2 hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5"
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
