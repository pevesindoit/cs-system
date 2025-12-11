"use client";

import { useState } from "react";

export default function DateRangePicker({
    onChange
}: {
    onChange: (range: { start_date: string; end_date: string }) => void;
}) {
    const [range, setRange] = useState({
        start_date: "",
        end_date: ""
    });

    const handleChange = (key: "start_date" | "end_date", value: string) => {
        const updated = { ...range, [key]: value };

        setRange(updated);

        // Only update parent when both dates exist
        if (updated.start_date && updated.end_date) {
            onChange(updated);
        }
    };

    return (
        <div className="flex flex-col space-y-2">
            <label className="font-medium">Select Date Range</label>

            <div className="flex items-center gap-3">

                {/* Start */}
                <div className="flex flex-col">
                    <input
                        type="date"
                        className="border p-2 rounded"
                        value={range.start_date}
                        onChange={(e) => handleChange("start_date", e.target.value)}
                    />
                </div>

                <span className="font-medium">to</span>

                {/* End */}
                <div className="flex flex-col">
                    <input
                        type="date"
                        className="border p-2 rounded"
                        value={range.end_date}
                        min={range.start_date} // disable dates before start_date
                        onChange={(e) => handleChange("end_date", e.target.value)}
                    />
                </div>
            </div>
        </div>
    );
}
