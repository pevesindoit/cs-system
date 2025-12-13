"use client";

import { useState } from "react";

type Option<T extends string | number> = {
    label: string;
    value: T;
};

type EditableSelectProps<T extends string | number> = {
    value: T | null;
    rowId: string;
    field: string;
    options: Option<T>[];
    onSave: (id: string, field: string, value: T) => Promise<void>;
    className?: string;
};

export default function EditableSelect<T extends string | number>({
    value,
    rowId,
    field,
    options,
    onSave,
    className = "",
}: EditableSelectProps<T>) {
    const [isEditing, setIsEditing] = useState(false);
    const [localValue, setLocalValue] = useState<T | "">(
        value ?? ""
    );
    const [loading, setLoading] = useState(false);

    const handleSave = async (newValue: T) => {
        if (newValue === value || newValue === "") {
            setIsEditing(false);
            return;
        }

        setLoading(true);
        try {
            await onSave(rowId, field, newValue);
        } finally {
            setLoading(false);
            setIsEditing(false);
        }
    };

    if (isEditing) {
        return (
            <select
                autoFocus
                value={localValue}
                onChange={(e) => {
                    const val = e.target.value as T;
                    setLocalValue(val);
                    handleSave(val);
                }}
                onBlur={() => setIsEditing(false)}
                className="w-full border-r px-3 py-1 text-[10px] focus:outline-none"
            >
                <option value="" disabled>
                    Select...
                </option>
                {options.map((opt) => (
                    <option key={String(opt.value)} value={opt.value}>
                        {opt.label}
                    </option>
                ))}
            </select>
        );
    }

    const currentLabel =
        options.find((o) => o.value === value)?.label ?? value;

    return (
        <div
            onClick={() => setIsEditing(true)}
            className={`cursor-pointer hover:bg-gray-100 text-[10px] px-4 border-r py-1 ${className}`}
        >
            {loading ? "Saving..." : currentLabel}
        </div>
    );
}
