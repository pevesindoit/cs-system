// components/CustomSelect.tsx
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label";

// Define the shape of a single item
type SelectItemData = {
    value: string;
    label: string;
}

interface CustomSelectProps {
    items: SelectItemData[];       // The dynamic list of options
    placeholder?: string;          // Optional placeholder text
    label?: string;                // Optional group label (e.g., "Fruits")
    onValueChange: (value: string) => void; // Callback to send value to parent
}

export function DropDown({
    items,
    placeholder = "Select an option",
    label,
    onValueChange
}: CustomSelectProps) {
    return (
        <div className="space-y-1">
            <Label htmlFor="email">{label}</Label>
            <Select onValueChange={onValueChange}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder={placeholder} />
                </SelectTrigger>
                <SelectContent>
                    <SelectGroup>
                        {label && <SelectLabel>{label}</SelectLabel>}

                        {/* 👇 Map through the items prop to generate options dynamically */}
                        {items.map((item) => (
                            <SelectItem key={item.value} value={item.value}>
                                {item.label}
                            </SelectItem>
                        ))}
                    </SelectGroup>
                </SelectContent>
            </Select>
        </div>

    )
}