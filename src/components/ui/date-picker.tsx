import * as React from "react";
import { format, getMonth, getYear, setMonth, setYear } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";

interface DatePickerProps {
  value?: string;
  onValueChange: (value: string) => void;
  startYear?: number;
  endYear?: number;
}

export default function DatePicker({
  value,
  onValueChange,
  startYear = getYear(new Date()) - 5,
  endYear = getYear(new Date()) + 10,
}: DatePickerProps) {
  // Derive selected date from value prop (single source of truth from parent)
  const selectedDate = React.useMemo(
    () => (value ? new Date(value) : undefined),
    [value]
  );

  // displayMonth controls what the calendar shows — independent of the selected date
  // so the user can navigate months/years without changing the selected value.
  const [displayMonth, setDisplayMonth] = React.useState<Date>(
    selectedDate ?? new Date()
  );

  // Sync displayMonth when value changes externally (e.g. form reset, route change)
  React.useEffect(() => {
    if (selectedDate) {
      setDisplayMonth(selectedDate);
    }
  }, [selectedDate]);

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const years = React.useMemo(
    () =>
      Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i),
    [startYear, endYear]
  );

  // Clamp a date's year to the valid range
  const clampYear = (d: Date): Date => {
    const y = d.getFullYear();
    if (y < startYear) return setYear(d, startYear);
    if (y > endYear) return setYear(d, endYear);
    return d;
  };

  const handleMonthChange = (month: string) => {
    const newDisplay = setMonth(displayMonth, months.indexOf(month));
    setDisplayMonth(clampYear(newDisplay));
  };

  const handleYearChange = (year: string) => {
    const newDisplay = setYear(displayMonth, parseInt(year));
    setDisplayMonth(clampYear(newDisplay));
  };

  // Called when the user clicks a day in the calendar
  const handleSelect = (selected: Date | undefined) => {
    if (selected) {
      const clamped = clampYear(selected);
      onValueChange(clamped.toISOString());
    }
  };

  // Calendar arrow navigation — only changes the displayed month, not the selected value
  const handleMonthNavigate = (month: Date) => {
    const clamped = clampYear(month);
    setDisplayMonth(clamped);
  };

  const hasValue = !!selectedDate;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"ghost-outline"}
          className={cn(
            "w-full justify-start text-left font-normal",
            !hasValue && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {hasValue ? (
            format(selectedDate, "PPP")
          ) : (
            <span>Pick a date</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <div className="flex justify-between p-2">
          <Select
            onValueChange={handleMonthChange}
            value={months[getMonth(displayMonth)]}
          >
            <SelectTrigger className="w-[110px]">
              <SelectValue placeholder="Month" />
            </SelectTrigger>
            <SelectContent>
              {months.map((month) => (
                <SelectItem key={month} value={month}>
                  {month}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            onValueChange={handleYearChange}
            value={getYear(displayMonth).toString()}
          >
            <SelectTrigger className="w-[110px]">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleSelect}
          initialFocus
          month={displayMonth}
          onMonthChange={handleMonthNavigate}
        />
      </PopoverContent>
    </Popover>
  );
}
