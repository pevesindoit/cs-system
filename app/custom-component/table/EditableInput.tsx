"use client";

import { useState } from "react";

type EditableInputProps<T extends string | number> = {
    value: T | null;
    rowId: string;
    field: string;
    onSave: (id: string, field: string, value: T) => Promise<void>;
    className?: string;
    parseValue?: (raw: string) => T;
};

const formatRupiah = (value: number) =>
    new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(value);

const formatThousands = (value: string) => {
    const numeric = value.replace(/\D/g, "");
    return numeric.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

export default function EditableInput<T extends string | number>({
    value,
    rowId,
    field,
    onSave,
    className = "",
    parseValue,
}: EditableInputProps<T>) {
    const isNumberField = typeof value === "number";

    const [isEditing, setIsEditing] = useState(false);
    const [localValue, setLocalValue] = useState<string>(
        value !== null
            ? isNumberField
                ? formatThousands(String(value))
                : String(value)
            : ""
    );
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        if (localValue === "") {
            setIsEditing(false);
            return;
        }

        const finalValue: T = parseValue
            ? parseValue(localValue.replace(/\./g, ""))
            : (localValue as T);

        if (finalValue === value) {
            setIsEditing(false);
            return;
        }

        setLoading(true);
        try {
            await onSave(rowId, field, finalValue);
        } finally {
            setLoading(false);
            setIsEditing(false);
        }
    };

    if (isEditing) {
        return (
            <input
                autoFocus
                inputMode={isNumberField ? "numeric" : "text"}
                value={localValue}
                onChange={(e) => {
                    const raw = e.target.value;
                    setLocalValue(
                        isNumberField ? formatThousands(raw) : raw
                    );
                }}
                onBlur={handleSave}
                onKeyDown={(e) => {
                    if (e.key === "Enter") handleSave();
                    if (e.key === "Escape") {
                        setIsEditing(false);
                    }
                }}
                className="w-full border-r px-4 text-[10px] focus:outline-none"
            />
        );
    }

    const displayValue =
        isNumberField && typeof value === "number"
            ? formatRupiah(value)
            : value ?? "-";

    return (
        <div
            onClick={() => setIsEditing(true)}
            className={`cursor-pointer hover:bg-gray-100 text-[10px] px-4 border-r py-1 ${className}`}
        >
            {loading ? "Saving..." : displayValue}
        </div>
    );
}
