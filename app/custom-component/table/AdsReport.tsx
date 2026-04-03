import React from "react";
// Import the interface if you moved it to types.ts, otherwise define here:
interface AdsDataRow {
    week: string;
    budget_iklan: number;
    total_spend: number;
    target_leads: number;
    target_omset: number;
    cost_perlead: number;
    google_ads: number;
    meta_ads: number;
    tiktok_ads: number;
    total_ads: number;
    omset: number;
    ads_ratio: string;
}

export default function AdsReport({ data }: { data: AdsDataRow[] | null }) {
    // LOADING SKELETON
    if (!data) {
        return (
            <div className="space-y-4 animate-pulse">
                <div className="h-7 bg-gray-200 rounded w-1/4 mb-2"></div>
                <div className="border rounded-lg shadow-sm bg-white p-4">
                    <div className="space-y-3">
                        <div className="h-8 bg-gray-100 rounded"></div>
                        <div className="h-8 bg-gray-50 rounded"></div>
                        <div className="h-8 bg-gray-100 rounded"></div>
                    </div>
                </div>
            </div>
        );
    }

    // Safety check: if no data, don't render anything or render empty state
    if (data.length === 0) return null;

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-800 border-b pb-2">
                Ads Performance
            </h2>

            <div className="overflow-x-auto border rounded-lg shadow-sm">
                <table className="w-full text-sm text-left text-gray-500">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
                        <tr>
                            <th className="px-6 py-3">Period</th>
                            <th className="px-6 py-3 text-right text-purple-600">Budget Iklan</th>
                            <th className="px-6 py-3 text-right text-purple-600">Total Spend (Inc. PPN)</th>
                            <th className="px-6 py-3 text-right text-purple-600">Target Leads</th>
                            <th className="px-6 py-3 text-right text-purple-600">Target Omset</th>
                            <th className="px-6 py-3 text-right text-purple-600">Cost Per Lead</th>
                            <th className="px-6 py-3 text-right">Google Ads</th>
                            <th className="px-6 py-3 text-right">Meta Ads</th>
                            <th className="px-6 py-3 text-right">TikTok Ads</th>
                            <th className="px-6 py-3 text-right font-bold text-gray-900 bg-gray-50">
                                Total Ads Spend
                            </th>
                            <th className="px-6 py-3 text-right text-blue-600">
                                Real Omset
                            </th>
                            <th className="px-6 py-3 text-center">
                                Ads Ratio
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((row, index) => (
                            <tr
                                key={index}
                                className="bg-white border-b hover:bg-gray-50 transition-colors"
                            >
                                {/* Period */}
                                <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                                    {row.week}
                                </td>

                                {/* Budget Iklan */}
                                <td className="px-6 py-4 text-right">
                                    {(row.budget_iklan || 0).toLocaleString("id-ID")}
                                </td>

                                {/* Total Spend */}
                                <td className="px-6 py-4 text-right">
                                    {(row.total_spend || 0).toLocaleString("id-ID")}
                                </td>

                                {/* Target Leads */}
                                <td className="px-6 py-4 text-right">
                                    {(row.target_leads || 0).toLocaleString("id-ID")}
                                </td>

                                {/* Target Omset */}
                                <td className="px-6 py-4 text-right">
                                    {(row.target_omset || 0).toLocaleString("id-ID")}
                                </td>

                                {/* Cost Per Lead */}
                                <td className="px-6 py-4 text-right">
                                    {(row.cost_perlead || 0).toLocaleString("id-ID")}
                                </td>

                                {/* Google Ads */}
                                <td className="px-6 py-4 text-right">
                                    {(row.google_ads || 0).toLocaleString("id-ID")}
                                </td>

                                {/* Meta Ads */}
                                <td className="px-6 py-4 text-right">
                                    {(row.meta_ads || 0).toLocaleString("id-ID")}
                                </td>

                                {/* TikTok Ads */}
                                <td className="px-6 py-4 text-right">
                                    {(row.tiktok_ads || 0).toLocaleString("id-ID")}
                                </td>

                                {/* Total Ads */}
                                <td className="px-6 py-4 text-right font-bold text-gray-900 bg-gray-50">
                                    {(row.total_ads || 0).toLocaleString("id-ID")}
                                </td>

                                {/* Omset */}
                                <td className="px-6 py-4 text-right font-bold text-blue-600">
                                    {(row.omset || 0).toLocaleString("id-ID")}
                                </td>

                                {/* Ads Ratio */}
                                <td className={`px-6 py-4 text-center font-semibold ${parseFloat(row.ads_ratio) > 30
                                    ? "text-red-500" // Warning color if ratio is high
                                    : "text-green-600"
                                    }`}>
                                    {row.ads_ratio || "0%"}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}