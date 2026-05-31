import * as React from "react";
import { CheckIcon, ChevronsUpDown } from "lucide-react";
import * as RPNInput from "react-phone-number-input";
import flags from "react-phone-number-input/flags";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";

type PhoneInputProps = Omit<
  React.ComponentProps<typeof RPNInput.default>,
  "onChange"
> & {
  onChange?: (value: RPNInput.Value) => void;
};

const PhoneInput = React.forwardRef<
  React.ComponentRef<typeof RPNInput.default>,
  PhoneInputProps
>(({ className, onChange, ...props }, ref) => {
  return (
    <RPNInput.default
      ref={ref}
      className={cn("flex", className)}
      flagComponent={FlagComponent}
      countrySelectComponent={CountrySelect}
      inputComponent={InputComponent}
      smartCaret={false}
      onChange={(value) => onChange?.(value || ("" as RPNInput.Value))}
      {...props}
    />
  );
});
PhoneInput.displayName = "PhoneInput";

// Input that matches shadcn styling
const InputComponent = React.forwardRef<
  HTMLInputElement,
  React.ComponentProps<"input">
>(({ className, ...props }, ref) => (
  <Input
    className={cn("rounded-s-none rounded-e-lg", className)}
    {...props}
    ref={ref}
  />
));
InputComponent.displayName = "InputComponent";

type CountryEntry = {
  label: string;
  value: RPNInput.Country | undefined;
};

type CountrySelectProps = {
  disabled?: boolean;
  value: RPNInput.Country;
  onChange: (value: RPNInput.Country) => void;
  options: CountryEntry[];
};

const CountrySelect = ({
  disabled,
  value: selectedCountry,
  onChange,
  options,
}: CountrySelectProps) => {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="flex gap-1 rounded-e-none rounded-s-lg border-r-0 px-3 focus:z-10"
          disabled={disabled}
        >
          <FlagComponent country={selectedCountry} countryName={selectedCountry} />
          <ChevronsUpDown
            className={cn(
              "-mr-2 size-4 opacity-50",
              disabled ? "hidden" : "opacity-100"
            )}
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandInput placeholder="Search country..." />
          <CommandList>
            <CommandEmpty>No country found.</CommandEmpty>
            <CommandGroup>
              <ScrollArea className="h-72">
                {options
                  .filter((o) => o.value)
                  .map((option) => (
                    <CommandItem
                      className="gap-2"
                      key={option.value}
                      onSelect={() => {
                        onChange(option.value as RPNInput.Country);
                        setOpen(false);
                      }}
                    >
                      <FlagComponent
                        country={option.value!}
                        countryName={option.label}
                      />
                      <span className="flex-1 text-sm">{option.label}</span>
                      <span className="text-sm text-foreground/50">
                        {`+${RPNInput.getCountryCallingCode(option.value!)}`}
                      </span>
                      <CheckIcon
                        className={cn(
                          "ml-auto size-4",
                          option.value === selectedCountry
                            ? "opacity-100"
                            : "opacity-0"
                        )}
                      />
                    </CommandItem>
                  ))}
              </ScrollArea>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

const FlagComponent = ({
  country,
  countryName,
}: RPNInput.FlagProps) => {
  const Flag = flags[country];
  return (
    <span className="flex h-4 w-6 overflow-hidden rounded-sm">
      {Flag && <Flag title={countryName} />}
    </span>
  );
};

export { PhoneInput };
export type { PhoneInputProps };
