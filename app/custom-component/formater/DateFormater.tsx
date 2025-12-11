"use client";

interface FormatDateProps {
    value: string;        // the raw timestamp
    showTime?: boolean;   // choose to show time or not
}

export default function FormatDate({ value, showTime = true }: FormatDateProps) {
    if (!value) return <span>-</span>;

    const date = new Date(value);

    const formatted = date.toLocaleString("id-ID", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        ...(showTime && {
            hour: "2-digit",
            minute: "2-digit",
        }),
    });

    return <span className="">{formatted}</span>;
}
