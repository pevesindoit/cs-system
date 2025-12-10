import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

type SelectItemData = {
    value: string;
    label: string;
};

interface CustomSelectProps {
    items: SelectItemData[];
    placeholder?: string;
    label?: string;
    onValueChange: (value: string) => void;
    enableAddOption?: boolean; // 👈 NEW
    onAdd?: () => void;        // 👈 NEW
}

export function DropDownInput({
    items,
    placeholder = "Select an option",
    label,
    onValueChange,
    enableAddOption = false,
    onAdd
}: CustomSelectProps) {
    return (
        <div className="space-y-1">
            <Label>{label}</Label>

            <Select onValueChange={(value) => {
                if (value === "__add_new__") {
                    onAdd?.(); // run callback
                    return;
                }
                onValueChange(value);
            }}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder={placeholder} />
                </SelectTrigger>

                <SelectContent>
                    <SelectGroup>
                        {label && <SelectLabel>{label}</SelectLabel>}

                        {items.map((item, index) => (
                            <SelectItem key={index} value={item.value}>
                                {item.label}
                            </SelectItem>
                        ))}

                        {/* 👇 "Add new" option */}
                        {enableAddOption && (
                            <SelectItem value="__add_new__" className="text-blue-600">
                                + Add New
                            </SelectItem>
                        )}
                    </SelectGroup>
                </SelectContent>
            </Select>
        </div>
    );
}
