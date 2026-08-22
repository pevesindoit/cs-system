import React, { useState } from "react";

interface AdsPerformanceItem {
    ads_id: string;
    ads_name: string;
    total: number;
    total_omset?: number;
    closing: number;
    warm: number;
    survey: number;
    los: number;
    hold: number;
    hot: number;
    "closing proyek": number;
    closing_customer?: number;
    closing_customers_details?: { phone: string; name: string }[];
}

const formatIDR = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
};

interface AdsPerformanceCardProps {
    data: AdsPerformanceItem[];
}

export const AdsPerformanceCard = ({ data = [] }: AdsPerformanceCardProps) => {

    const [expandedAds, setExpandedAds] = useState<Record<string, boolean>>({});
    
    const toggleExpand = (adsId: string) => {
        setExpandedAds(prev => ({ ...prev, [adsId]: !prev[adsId] }));
    };

    const safeData = Array.isArray(data) ? data : [];

    // Calculate maximum closing to use as base for the bar width
    // Or we could use total leads as base. The user wants to see which ads perform best (closing)
    let maxClosing = 0;
    safeData.forEach(item => {
        const totalClosing = item.closing + item["closing proyek"];
        if (totalClosing > maxClosing) maxClosing = totalClosing;
    });

    return (
        <div className="bg-white rounded-[10px] p-6 border h-full">
            <h2 className="text-lg font-bold mb-6 text-gray-800">
                Top Ads Performance
            </h2>

            <div className="space-y-6 overflow-y-auto max-h-[800px] pr-2 custom-scrollbar">
                {safeData.map((item, index) => {
                    const totalClosing = item.closing + item["closing proyek"];
                    const percentage = maxClosing > 0 ? (totalClosing / maxClosing) * 100 : 0;

                    return (
                        <div key={item.ads_id} className="group border-b pb-4 last:border-0 last:pb-0">
                            <div 
                                className="cursor-pointer transition-colors hover:bg-gray-50 -mx-2 px-2 py-2 rounded-md"
                                onClick={() => toggleExpand(item.ads_id)}
                            >
                                <div className="flex justify-between text-sm mb-2">
                                <span className="font-semibold text-gray-700">
                                    {index + 1}. {item.ads_name || "Unknown Ad"}
                                </span>
                                <div className="flex flex-col items-end">
                                    <span className="text-gray-500 font-medium">
                                        {item.total} Total Leads
                                    </span>
                                    {item.total_omset !== undefined && (
                                        <span className="text-emerald-600 font-bold text-xs mt-1">
                                            {formatIDR(item.total_omset)}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Progress Bar Container */}
                            <div className="w-full bg-gray-100 rounded-full h-3 mb-2 relative overflow-hidden">
                                <div
                                    className={`h-3 rounded-full transition-all duration-500 ease-out ${index === 0 ? "bg-green-500" : "bg-blue-400 group-hover:bg-blue-500"
                                        }`}
                                    style={{ width: `${percentage}%` }}
                                ></div>
                            </div>

                            {/* Details Grid */}
                            <div className="grid grid-cols-4 gap-2 text-[0.7rem] text-gray-600 mt-2">
                                <div className="text-center bg-gray-50 p-1 rounded">
                                    <span className="block font-bold text-green-600">{totalClosing}</span>
                                    <span>Closing(s)</span>
                                </div>
                                <div className="text-center bg-gray-50 p-1 rounded">
                                    <span className="block font-bold text-emerald-600">{item.closing_customer || 0}</span>
                                    <span className="text-[0.65rem]">Costumers</span>
                                </div>
                                <div className="text-center bg-gray-50 p-1 rounded">
                                    <span className="block font-bold text-orange-500">{item.hot}</span>
                                    <span>Hot</span>
                                </div>
                                <div className="text-center bg-gray-50 p-1 rounded">
                                    <span className="block font-bold text-yellow-500">{item.warm}</span>
                                    <span>Warm</span>
                                </div>
                                <div className="text-center bg-gray-50 p-1 rounded">
                                    <span className="block font-bold text-blue-500">{item.survey}</span>
                                    <span>Survey</span>
                                </div>
                                <div className="text-center bg-gray-50 p-1 rounded">
                                    <span className="block font-bold text-purple-500">{item.hold}</span>
                                    <span>Hold</span>
                                </div>
                                <div className="text-center bg-gray-50 p-1 rounded">
                                    <span className="block font-bold text-red-500">{item.los}</span>
                                    <span>Los</span>
                                </div>
                            </div>
                            
                            {/* Clickable wrapper closes here */}
                            </div>

                            {expandedAds[item.ads_id] && item.closing_customers_details && item.closing_customers_details.length > 0 && (
                                <div className="mt-3 bg-gray-50 p-3 rounded border border-gray-100 animate-in fade-in slide-in-from-top-1">
                                    <span className="text-[0.65rem] font-bold text-gray-700 block mb-2 uppercase tracking-wider">Closing Customers Details:</span>
                                    <div className="flex flex-col gap-2">
                                        {item.closing_customers_details.map((customer, i) => (
                                            <div key={i} className="flex justify-between items-center text-[0.7rem] bg-white px-3 py-1.5 rounded border border-gray-200 shadow-sm">
                                                <span className="font-semibold text-gray-800">{customer.name}</span>
                                                <span className="text-gray-500 font-mono tracking-tight">{customer.phone}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}

                {safeData.length === 0 && (
                    <p className="text-center text-gray-400 text-sm py-4">
                        No ads performance data found for this period.
                    </p>
                )}
            </div>
        </div>
    );
};
