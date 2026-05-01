"use client";

interface Range {
    start_date: string;
    end_date: string;
}

export default function DateRangePicker({
    onChange,
    value
}: {
    onChange: (range: Range) => void;
    value: Range;
}) {
    const handleChange = (key: "start_date" | "end_date", val: string) => {
        const updated = { ...value, [key]: val };
        onChange(updated);
    };

    return (
        <div className="flex flex-col space-y-2 text-[.7rem] md:w-auto w-full">
            <div className="flex items-center gap-3 w-full">
                {/* Start */}
                <div className="flex flex-col w-full">
                    <input
                        type="date"
                        className="border p-2 rounded"
                        value={value.start_date}
                        onChange={(e) => handleChange("start_date", e.target.value)}
                    />
                </div>

                <span className="font-medium text-gray-500">to</span>

                {/* End */}
                <div className="flex flex-col w-full">
                    <input
                        type="date"
                        className="border p-2 rounded"
                        value={value.end_date}
                        min={value.start_date}
                        onChange={(e) => handleChange("end_date", e.target.value)}
                    />
                </div>
            </div>
        </div>
    );
}
