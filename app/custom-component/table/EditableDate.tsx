"use client";

import { useState } from "react";

type EditableDateProps = {
    value: string | null; // YYYY-MM-DD
    rowId: string;
    field: string;
    onSave: (id: string, field: string, value: string) => Promise<void>;
    className?: string;
};

const formatDate = (date: string) => {
    const d = new Date(date);
    if (isNaN(d.getTime())) return "-";

    return new Intl.DateTimeFormat("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    }).format(d);
};

export default function EditableDate({
    value,
    rowId,
    field,
    onSave,
    className = "",
}: EditableDateProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [localValue, setLocalValue] = useState<string>(value ?? "");
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        if (localValue === value) {
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
                type="date"
                value={localValue}
                onChange={(e) => setLocalValue(e.target.value)}
                onBlur={handleSave}
                onKeyDown={(e) => {
                    if (e.key === "Enter") handleSave();
                    if (e.key === "Escape") {
                        setLocalValue(value ?? "");
                        setIsEditing(false);
                    }
                }}
                className="w-full border-r px-3 py-1 text-[10px] focus:outline-none"
            />
        );
    }

    return (
        <div
            onClick={() => setIsEditing(true)}
            className={`cursor-pointer hover:bg-gray-100 text-[10px] px-3 py-1 border-r items-end flex ${className}`}
        >
            {loading ? "Saving..." : value ? formatDate(value) : "-"}
        </div>
    );
}
