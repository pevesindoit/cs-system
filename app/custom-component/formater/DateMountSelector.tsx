"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, Calendar, ChevronDown } from "lucide-react";

interface DateRange {
    start_date: string;
    end_date: string;
}

interface Props {
    onChange: (range: DateRange) => void;
    initialDate?: Date;
    label?: string;
}

const MONTHS = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

export default function DateMountSelector({ onChange, initialDate = new Date(), label = "Select Month" }: Props) {
    const [isOpen, setIsOpen] = useState(false);

    // View state (what year is currently being viewed in the dropdown)
    const [viewYear, setViewYear] = useState(initialDate.getFullYear());

    // Selection state (what is actually selected)
    const [selectedDate, setSelectedDate] = useState({
        month: initialDate.getMonth(),
        year: initialDate.getFullYear()
    });

    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleMonthSelect = (monthIndex: number) => {
        // Update selection state
        setSelectedDate({ month: monthIndex, year: viewYear });

        // 1. Calculate Dates
        const start = new Date(viewYear, monthIndex, 1);
        const end = new Date(viewYear, monthIndex + 1, 0); // Last day of month

        // 2. Format YYYY-MM-DD
        const format = (d: Date) => {
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${y}-${m}-${day}`;
        };

        // 3. Send to parent
        onChange({
            start_date: format(start),
            end_date: format(end)
        });

        // 4. Close dropdown
        setIsOpen(false);
    };

    const handlePrevYear = (e: React.MouseEvent) => {
        e.stopPropagation();
        setViewYear((prev) => prev - 1);
    };

    const handleNextYear = (e: React.MouseEvent) => {
        e.stopPropagation();
        setViewYear((prev) => prev + 1);
    };

    return (
        <div className="relative w-full" ref={dropdownRef}>
            {/* LABEL (Optional) */}
            {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}

            {/* TRIGGER BUTTON */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between bg-white border border-gray-300 text-gray-700 py-2 px-3 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            >
                <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium">
                        {MONTHS[selectedDate.month]} {selectedDate.year}
                    </span>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
            </button>

            {/* DROPDOWN PANEL */}
            {isOpen && (
                <div className="absolute z-50 mt-1 w-64 bg-white rounded-lg shadow-xl border border-gray-200 p-4 animate-in fade-in zoom-in-95 duration-100">

                    {/* Header: Year Navigator */}
                    <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
                        <button
                            onClick={handlePrevYear}
                            className="p-1 hover:bg-gray-100 rounded-full text-gray-600 transition-colors"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>

                        <span className="text-base font-bold text-gray-800">{viewYear}</span>

                        <button
                            onClick={handleNextYear}
                            className="p-1 hover:bg-gray-100 rounded-full text-gray-600 transition-colors"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Body: Month Grid */}
                    <div className="grid grid-cols-3 gap-2">
                        {MONTHS.map((month, index) => {
                            // Check if this month is the currently SELECTED one
                            const isSelected = index === selectedDate.month && viewYear === selectedDate.year;

                            return (
                                <button
                                    key={month}
                                    onClick={() => handleMonthSelect(index)}
                                    className={`
                                        py-2 text-xs font-semibold rounded-md transition-all
                                        ${isSelected
                                            ? "bg-blue-600 text-white shadow-md"
                                            : "bg-gray-50 text-gray-700 hover:bg-blue-50 hover:text-blue-700"
                                        }
                                    `}
                                >
                                    {month}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}