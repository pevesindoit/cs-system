"use client";

import { useState } from "react";

type EditableInputProps<T extends string | number> = {
    value: T | null;
    rowId: string;
    field: string;
    onSave: (id: string, field: string, value: T) => Promise<void>;
    className?: string;
};

export default function EditableInput<T extends string | number>({
    value,
    rowId,
    field,
    onSave,
    className = "",
}: EditableInputProps<T>) {
    const [isEditing, setIsEditing] = useState(false);
    const [localValue, setLocalValue] = useState<T>(
        value ?? ("" as T)
    );
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        if (localValue === value || value === null) {
            setIsEditing(false);
            return;
        }

        setLoading(true);
        try {
            await onSave(rowId, field, localValue);
        } finally {
            setLoading(false);
            setIsEditing(false);
        }
    };

    if (isEditing) {
        return (
            <input
                autoFocus
                value={String(localValue)}
                onChange={(e) => {
                    const newValue =
                        typeof value === "number"
                            ? (Number(e.target.value) as T)
                            : (e.target.value as T);

                    setLocalValue(newValue);
                }}
                onBlur={() => handleSave()}
                onKeyDown={(e) => {
                    if (e.key === "Enter") handleSave();
                    if (e.key === "Escape") {
                        setLocalValue(value ?? ("" as T));
                        setIsEditing(false);
                    }
                }}
                className="w-full border-r px-4 text-[10px] focus:outline-none"
            />
        );
    }

    return (
        <div
            onClick={() => setIsEditing(true)}
            className={`cursor-pointer hover:bg-gray-100 text-[10px] px-4 border-r py-1 ${className}`}
        >
            {loading ? "Saving..." : value}
        </div>
    );
}
