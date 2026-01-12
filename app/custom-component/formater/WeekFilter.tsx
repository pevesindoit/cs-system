"use client";

import React, { useMemo } from "react";

interface DateRange {
    start_date: string;
    end_date: string;
}

interface Props {
    startDate: string;
    endDate: string;
    onChange: (range: DateRange) => void;
    className?: string;
}

export default function WeekFilter({ startDate, endDate, onChange, className = "" }: Props) {
    const weeks = useMemo(() => {
        if (!startDate || !endDate) return [];

        const start = new Date(startDate);
        const end = new Date(endDate);
        const weekList = [];
        let current = new Date(start);
        let weekIndex = 1;

        while (current <= end) {
            // Find end of this week (Sunday) or end of Date Range
            const weekStart = new Date(current);
            const dayOfWeek = current.getDay(); // 0 is Sunday
            // Days until next Sunday
            const daysToSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;

            const weekEnd = new Date(current);
            weekEnd.setDate(current.getDate() + daysToSunday);

            // Cap at the overall endDate
            const effectiveEnd = weekEnd > end ? new Date(end) : weekEnd;

            const format = (d: Date) => d.toISOString().split('T')[0];

            weekList.push({
                label: `Week ${weekIndex} (${format(weekStart)} - ${format(effectiveEnd)})`,
                value: {
                    start_date: format(weekStart),
                    end_date: format(effectiveEnd)
                }
            });

            // Move to next Monday
            current = new Date(effectiveEnd);
            current.setDate(current.getDate() + 1);
            weekIndex++;
        }

        return weekList;
    }, [startDate, endDate]);

    return (
        <select
            className={`border p-2 rounded bg-white border p-2 rounded bg-white w-full flex items-center justify-between bg-white border border-gray-300 text-gray-700 py-2 px-3 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${className}`}
            onChange={(e) => {
                const val = e.target.value;
                if (val === "all") {
                    onChange({ start_date: startDate, end_date: endDate });
                } else {
                    const selected = weeks.find((w) => JSON.stringify(w.value) === val);
                    if (selected) {
                        onChange(selected.value);
                    }
                }
            }}
            defaultValue="all"
        >
            <option value="all">Show All Days</option>

            {weeks.map((week, idx) => (
                <option key={idx} value={JSON.stringify(week.value)}>
                    {week.label}
                </option>
            ))}
        </select >
    );
}
