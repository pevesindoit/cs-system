import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

type Item = {
    value: number;
    label: string;
};

interface DropDownGridProps {
    items: Item[];
    className?: string;
    value?: number;
    placeholder?: string;
    onValueChange: (value: number) => void; // 👈 number
}

export function DropDownGridInt({
    items,
    className = "",
    value,
    placeholder = "",
    onValueChange,
}: DropDownGridProps) {
    return (
        <Select
            value={value !== undefined ? String(value) : undefined}
            onValueChange={(val) => onValueChange(Number(val))}
        >
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
                {items.map((item, index) => (
                    <SelectItem
                        key={index}
                        value={String(item.value)} // 👈 string for Radix
                        className="h-7 text-[10px]"
                    >
                        {item.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
