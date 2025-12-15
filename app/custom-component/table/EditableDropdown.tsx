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
    const [loading, setLoading] = useState(false);

    // 🔑 SELECT selalu string
    const [localValue, setLocalValue] = useState(
        value !== null ? String(value) : ""
    );

    const handleSave = async (rawValue: string) => {
        if (!rawValue) {
            setIsEditing(false);
            return;
        }

        // 🔑 konversi balik ke T (NUMBER atau STRING)
        const newValue =
            typeof options[0]?.value === "number"
                ? (Number(rawValue) as T)
                : (rawValue as T);

        if (newValue === value) {
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
                    setLocalValue(e.target.value);
                    handleSave(e.target.value);
                }}
                onBlur={() => setIsEditing(false)}
                className="w-full border-r px-3 py-1 text-[10px] focus:outline-none"
            >
                <option value="" disabled>
                    Select...
                </option>

                {options.map((opt) => (
                    <option
                        key={String(opt.value)}
                        value={String(opt.value)} // 👈 selalu string
                    >
                        {opt.label}
                    </option>
                ))}
            </select>
        );
    }

    // ❗ JANGAN tampilkan ID sebagai fallback
    const currentLabel =
        options.find((o) => o.value === value)?.label ?? "—";

    return (
        <div
            onClick={() => setIsEditing(true)}
            className={`cursor-pointer hover:bg-gray-100 text-[10px] px-4 border-r py-1 items-end flex ${className}`}
        >
            {loading ? "Saving..." : currentLabel}
        </div>
    );
}
