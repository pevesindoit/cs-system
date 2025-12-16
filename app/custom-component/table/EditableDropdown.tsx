"use client";

import { useState, CSSProperties } from "react";

// 1. Update the Option type to include an optional className
export type Option<T extends string | number> = {
    label: string;
    value: T;
    className?: string; // e.g., "bg-[#DEE3FC] text-[#372E2E]"
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
    className,
}: EditableSelectProps<T>) {
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);

    // 2. HELPER: Converts your DB string into a Style Object
    const parseColors = (clsString?: string): CSSProperties => {
        if (!clsString) return {};

        // Regex to extract hex codes from "bg-[#...]" and "text-[#...]"
        const bgMatch = clsString.match(/bg-\[(#[a-fA-F0-9]+)\]/);
        const textMatch = clsString.match(/text-\[(#[a-fA-F0-9]+)\]/);

        return {
            backgroundColor: bgMatch ? bgMatch[1] : undefined,
            color: textMatch ? textMatch[1] : undefined,
        };
    };

    // 🔑 SELECT always handles strings internally
    const [localValue, setLocalValue] = useState(
        value !== null ? String(value) : ""
    );

    const handleSave = async (rawValue: string) => {
        if (!rawValue) {
            setIsEditing(false);
            return;
        }

        // 🔑 Convert back to T (NUMBER or STRING)
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

    // Helper to get the option object of the currently selected local value
    const getOptionByValue = (val: string | number | null) =>
        options.find((o) => String(o.value) === String(val));

    if (isEditing) {
        // Find the option currently selected in the dropdown to show its color while editing
        const activeOption = getOptionByValue(localValue);

        return (
            <select
                autoFocus
                value={localValue}
                onChange={(e) => {
                    setLocalValue(e.target.value);
                    handleSave(e.target.value);
                }}
                onBlur={() => setIsEditing(false)}
                // 3. APPLY STYLE OBJECT HERE (Fixes the type error)
                style={parseColors(activeOption?.className)}
                className={`w-full border-r px-3 py-1 text-[10px] focus:outline-none ${activeOption?.className || ""}`}
            >
                <option value="" disabled>
                    Select...
                </option>

                {options.map((opt) => (
                    <option
                        key={String(opt.value)}
                        value={String(opt.value)}
                        // Note: 'style' on <option> only works in some browsers (like Chrome on Windows). 
                        // It is often ignored on Mac/Mobile.
                        style={parseColors(opt.className)}
                    >
                        {opt.label}
                    </option>
                ))}
            </select>
        );
    }

    // Find the option for the current saved value
    const currentOption = getOptionByValue(value);
    const currentLabel = currentOption?.label ?? "—";

    // 4. PREPARE STYLE FOR VIEW MODE
    const currentStyle = parseColors(currentOption?.className);

    return (
        <div
            onClick={() => setIsEditing(true)}
            // 5. APPLY STYLE OBJECT HERE
            style={currentStyle}
            className={`cursor-pointer hover:opacity-80 text-[10px] px-4 border-r py-1 items-end flex transition-colors ${className}`}
        >
            {loading ? "Saving..." : currentLabel}
        </div>
    );
}