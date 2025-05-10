import React from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

export function Calendar({
  selected,
  onSelect,
  className,
  modifiers,
  modifiersStyles,
}) {
  return (
    <DayPicker
      mode="multiple"
      selected={selected}
      onSelect={onSelect}
      className={className}
      modifiers={modifiers}
      modifiersStyles={modifiersStyles}
    />
  );
}
