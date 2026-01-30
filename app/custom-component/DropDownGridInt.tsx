import * as React from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "cmdk";
import * as Popover from "@radix-ui/react-popover";

type Item = {
    value: number;
    label: string;
};

interface DropDownGridProps {
    items: Item[];
    className?: string;
    value?: number;
    placeholder?: string;
    onValueChange: (value: number) => void;
}

export function DropDownGridInt({
    items,
    className = "",
    value,
    placeholder = "Select...",
    onValueChange,
}: DropDownGridProps) {
    const [open, setOpen] = React.useState(false);
    const [searchValue, setSearchValue] = React.useState("");

    // Find the label for the current value to display in the button
    const selectedLabel = items.find((item) => item.value === value)?.label;

    const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
        // Capture single characters to start searching immediately
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
            e.preventDefault();
            setSearchValue(e.key);
            setOpen(true);
        }
    };

    return (
        <Popover.Root open={open} onOpenChange={(newOpen) => {
            setOpen(newOpen);
            if (!newOpen) {
                setSearchValue("");
            }
        }}>
            <Popover.Trigger asChild>
                <button
                    onKeyDown={handleKeyDown}
                    role="combobox"
                    aria-expanded={open}
                    className={cn(
                        "flex items-center justify-between",
                        "h-6! min-h-6 w-full px-1",
                        "bg-transparent",
                        "border-none shadow-none rounded-none",
                        "text-[10px]",
                        "focus:outline-hidden focus:ring-0 focus:bg-gray-50",
                        "data-[state=open]:bg-gray-50",
                        className
                    )}
                >
                    <span className="truncate text-left flex-1">
                        {selectedLabel || placeholder}
                    </span>
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </button>
            </Popover.Trigger>
            <Popover.Content
                className="w-[200px] p-0 z-50 bg-popover text-popover-foreground rounded-md border shadow-md outline-none"
                align="start"
                sideOffset={4}
            >
                <Command className="flex h-full w-full flex-col overflow-hidden rounded-md bg-popover text-popover-foreground">
                    <div className="flex items-center border-b px-3" cmdk-input-wrapper="">
                        <CommandInput
                            value={searchValue}
                            onValueChange={setSearchValue}
                            placeholder="Search..."
                            className="flex h-10 w-full rounded-md bg-transparent py-3 text-xs outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                        />
                    </div>
                    <CommandList>
                        <CommandEmpty className="py-6 text-center text-xs">No results found.</CommandEmpty>
                        <CommandGroup>
                            {items.map((item) => (
                                <CommandItem
                                    key={item.value}
                                    value={item.label} // Keeps search working by label
                                    onSelect={() => {
                                        onValueChange(item.value);
                                        setOpen(false);
                                    }}
                                    className={cn(
                                        "relative flex cursor-default select-none items-center justify-start rounded-sm px-2 h-7 text-[10px] outline-none",
                                        "data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50",
                                        "data-[selected='true']:bg-accent data-[selected='true']:text-accent-foreground",
                                        "hover:bg-accent hover:text-accent-foreground"
                                    )}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            value === item.value ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    {item.label}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </Popover.Content>
        </Popover.Root>
    );
}
