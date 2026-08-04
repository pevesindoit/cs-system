"use client";

interface FormatDateProps {
    value: string;
    showTime?: boolean;
    showWeekday?: boolean;
}

export default function FormatDate({ value, showTime = true, showWeekday = false }: FormatDateProps) {
    // Cek jika kosong
    if (!value) return <span>-</span>;

    const date = new Date(value);

    // Cek jika tanggal tidak valid (misal: "abc")
    if (isNaN(date.getTime())) return <span>Invalid Date</span>;

    const formatted = date.toLocaleString("id-ID", {
        ...(showWeekday && { weekday: "long" }),
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        ...(showTime && {
            hour: "2-digit",
            minute: "2-digit",
        }),
    });

    return <span>{formatted}</span>;
}