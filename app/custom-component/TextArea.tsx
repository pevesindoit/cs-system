import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label";

interface TextAreaProps {
    placeholder?: string;
    label?: string;
    value?: string;                // Controlled value (optional)
    onValueChange: (value: string) => void;
}

export function TextArea({
    placeholder = "Type your text here...",
    label,
    value,
    onValueChange
}: TextAreaProps) {
    return (
        <div className="grid w-full gap-1.5">
            {label && <Label>{label}</Label>}
            <Textarea
                placeholder={placeholder}
                value={value}
                rows={4}
                onChange={(e) => onValueChange(e.target.value)}
            />
        </div>
    )
}