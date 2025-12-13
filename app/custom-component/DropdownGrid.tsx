import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

type Item = {
    value: string;
    label: string;
};

interface DropDownGridProps {
    items: Item[];
    className?: string;
    value?: string;
    placeholder?: string;
    onValueChange: (value: string) => void;
}

export function DropDownGrid({
    items,
    className = "",
    value,
    placeholder = "",
    onValueChange,
}: DropDownGridProps) {
    return (
        <Select value={value} onValueChange={onValueChange}>
            <SelectTrigger
                className={`
          w-full h-7 px-1
          bg-transparent
          border-none shadow-none rounded-none
          text-[10px]
          focus:ring-0 focus:bg-gray-50
          ${className}
        `}
            >
                <SelectValue placeholder={placeholder} />
            </SelectTrigger>

            <SelectContent
                className="w-full min-w-(--radix-select-trigger-width) text-[10px] p-0"
                align="start"
            >
                {items.map((item) => (
                    <SelectItem
                        key={item.value}
                        value={item.value}
                        className="h-7 text-[10px]"
                    >
                        {item.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
