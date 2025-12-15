"use client";

import { useState, useEffect } from "react";

type EditableInputProps<T extends string | number> = {
    value: T | null;
    rowId: string;
    field: string;
    onSave: (id: string, field: string, value: T) => Promise<void>;
    className?: string;
    parseValue?: (raw: string) => T;
    isNumeric?: boolean;  // Input allows only numbers
    isCurrency?: boolean; // Formats with "Rp" and dots "."
};

const formatRupiah = (value: number) =>
    new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
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
    isNumeric = false,
    isCurrency = false, // Default false
}: EditableInputProps<T>) {

    // Helper: is this field acting as a formatted number/currency?
    const isFormattedNumber = isCurrency;

    const [isEditing, setIsEditing] = useState(false);
    const [localValue, setLocalValue] = useState<string>("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (value !== null && value !== undefined) {
            // Only add dots if it is Currency
            if (isFormattedNumber) {
                setLocalValue(formatThousands(String(value)));
            } else {
                setLocalValue(String(value));
            }
        } else {
            setLocalValue("");
        }
    }, [value, isFormattedNumber]);

    const handleSave = async () => {
        // If empty and was null, cancel
        if (localValue === "" && value === null) {
            setIsEditing(false);
            return;
        }

        let finalValue: T;

        if (parseValue) {
            finalValue = parseValue(localValue);
        } else if (isFormattedNumber) {
            // If currency, strip dots before saving
            finalValue = Number(localValue.replace(/\./g, "")) as T;
        } else if (isNumeric) {
            // If just numeric (like phone), keep as string (recommended) or cast to number
            // Assuming T is number if isNumeric is set, but for phone we might use string
            finalValue = (typeof value === 'number' ? Number(localValue) : localValue) as T;
        } else {
            finalValue = localValue as T;
        }

        if (finalValue === value) {
            setIsEditing(false);
            return;
        }

        setLoading(true);
        try {
            await onSave(rowId, field, finalValue);
        } catch (error) {
            console.error("Failed to save", error);
        } finally {
            setLoading(false);
            setIsEditing(false);
        }
    };

    if (isEditing) {
        return (
            <input
                autoFocus
                // Use "tel" for phone numbers (better mobile keyboard), "numeric" for money
                inputMode={isNumeric ? (isCurrency ? "numeric" : "tel") : "text"}
                value={localValue}
                onChange={(e) => {
                    let raw = e.target.value;
                    // Strict number check if isNumeric is on
                    if (isNumeric || isCurrency) {
                        raw = raw.replace(/\D/g, ""); // Remove non-digits
                    }

                    setLocalValue(
                        isCurrency ? formatThousands(raw) : raw
                    );
                }}
                onBlur={handleSave}
                onKeyDown={(e) => {
                    if (e.key === "Enter") handleSave();
                    if (e.key === "Escape") {
                        setIsEditing(false);
                        setLocalValue(value !== null ? String(value) : "");
                    }
                }}
                className="w-full border-r rounded px-2 py-1 text-[10px] focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
        );
    }

    // --- DISPLAY LOGIC ---
    let displayValue: string | number = value ?? "-";

    if (value !== null && isCurrency) {
        displayValue = formatRupiah(Number(value));
    }

    return (
        <div
            onClick={() => !loading && setIsEditing(true)}
            className={`cursor-pointer hover:bg-gray-100 text-[10px] px-2 py-1 min-h-6 flex items-center border-r ${isCurrency ? "justify-end text-right" : "justify-start text-left"
                } ${className} ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
        >
            {loading ? "..." : displayValue}
        </div>
    );
}