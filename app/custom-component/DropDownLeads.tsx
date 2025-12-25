import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

type Item = {
    value: number | string;
    label: string;
    className: string
};

interface DropDownGridProps {
    items: Item[];
    className?: string;
    value?: number;
    placeholder?: string;
    onValueChange: (value: string) => void; // 👈 number
}

export function DropDownLeads({
    items,
    className = "",
    value,
    placeholder = "",
    onValueChange,
}: DropDownGridProps) {
    console.log(items, "ini itemnya")
    return (
        <Select
            value={value !== undefined ? String(value) : undefined}
            onValueChange={(val) => onValueChange(val)}
        >
            <SelectTrigger
                className={`h-6! min-h-6
          w-full
           bg-white rounded-md py-4 px-4
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
