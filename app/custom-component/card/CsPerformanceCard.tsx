import React from "react";

// Helper to format IDR
const formatRupiah = (number: number) => {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(number);
};

interface ScPerformanceItem {
    name: string;
    user_id: string;
    total_nominal: number;
    closing_count: number;
}

interface CsPerformanceCardProps {
    data: ScPerformanceItem[];
}

// FIX: Add default value "data = []" here to prevent the "not iterable" crash
export const CsPerformanceCard = ({ data = [] }: CsPerformanceCardProps) => {

    // Safety check: ensure data is actually an array before sorting
    const safeData = Array.isArray(data) ? data : [];

    // 1. Sort data by highest nominal
    const sortedData = [...safeData].sort((a, b) => b.total_nominal - a.total_nominal);

    // 2. Find the maximum value to calculate bar percentages
    const maxValue = sortedData.length > 0 ? sortedData[0].total_nominal : 0;

    return (
        <div className="bg-white rounded-[10px] p-6 border h-full">
            <h2 className="text-lg font-bold mb-6 text-gray-800">
                Top CS Performance (Closing)
            </h2>

            <div className="space-y-5 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
                {sortedData.map((item, index) => {
                    // Calculate percentage width relative to the top performer
                    const percentage = maxValue > 0 ? (item.total_nominal / maxValue) * 100 : 0;

                    return (
                        <div key={item.user_id} className="group">
                            <div className="flex justify-between text-xs mb-1">
                                <span className="font-semibold text-gray-700">
                                    {index + 1}. {item.name}
                                </span>
                                <span className="text-gray-500 font-medium">
                                    {item.closing_count} Leads
                                </span>
                            </div>

                            {/* Progress Bar Container */}
                            <div className="w-full bg-gray-100 rounded-full h-2.5 mb-1 relative overflow-hidden">
                                <div
                                    className={`h-2.5 rounded-full transition-all duration-500 ease-out ${index === 0 ? "bg-green-500" : "bg-blue-400 group-hover:bg-blue-500"
                                        }`}
                                    style={{ width: `${percentage}%` }}
                                ></div>
                            </div>

                            <div className="text-right">
                                <span className="text-xs font-bold text-gray-800">
                                    {formatRupiah(item.total_nominal)}
                                </span>
                            </div>
                        </div>
                    );
                })}

                {sortedData.length === 0 && (
                    <p className="text-center text-gray-400 text-sm py-4">
                        No closing data found for this period.
                    </p>
                )}
            </div>
        </div>
    );
};