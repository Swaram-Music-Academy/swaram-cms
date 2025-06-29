import { useEffect, useState } from "react";
import { ClockIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TimePickerProps {
  value?: string;
  onChange?: (newTime: string) => void;
  className?: string;
}

export function TimePicker({ value, onChange, className }: TimePickerProps) {
  const [time, setTime] = useState<string>(value || "");
  const [isOpen, setIsOpen] = useState(false);

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 12 }, (_, i) => i * 5);

  useEffect(() => {
    if (value !== undefined) setTime(value);
  }, [value]);
  const handleTimeChange = (type: "hour" | "minute", value: number) => {
    let [hr, m] = time.split(":");
    if (type === "hour") {
      hr = value.toString().padStart(2, "0");
      if (!m) m = "00";
    }
    if (type === "minute") {
      m = value.toString().padStart(2, "0");
      if (!hr) hr = "17";
    }
    if (onChange) onChange(`${hr}:${m}`);
    setTime(`${hr}:${m}`);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "bg-transparent justify-start text-left font-normal",
            className,
            !time && "text-muted-foreground"
          )}
        >
          <ClockIcon />
          <span>{time ? time : "HH:MM"}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <div className="flex sm:h-[300px] divide-x">
          {/* Hours Selection */}
          <ScrollArea>
            <div className="flex flex-col p-2">
              {[...hours].reverse().map((hour) => (
                <Button
                  key={hour}
                  size="icon"
                  variant={
                    time.split(":")[0] === hour.toString() ? "default" : "ghost"
                  }
                  className="font-normal"
                  onClick={() => handleTimeChange("hour", hour)}
                >
                  {hour.toString().padStart(2, "0")}
                </Button>
              ))}
            </div>
          </ScrollArea>

          {/* Minutes Selection */}
          <ScrollArea>
            <div className="flex flex-col p-2">
              {minutes.map((minute) => (
                <Button
                  key={minute}
                  size="icon"
                  variant={
                    time.split(":")[1] === minute.toString().padStart(2, "0")
                      ? "default"
                      : "ghost"
                  }
                  className="font-normal"
                  onClick={() => handleTimeChange("minute", minute)}
                >
                  {minute.toString().padStart(2, "0")}
                </Button>
              ))}
            </div>
          </ScrollArea>
        </div>
      </PopoverContent>
    </Popover>
  );
}
