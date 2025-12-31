import React from "react";
// Import the interface if you moved it to types.ts, otherwise define here:
interface AdsDataRow {
    week: string;
    google_ads: number;
    meta_ads: number;
    tiktok_ads: number;
    total_ads: number;
    omset: number;
    ads_ratio: string;
}

export default function AdsReport({ data }: { data: AdsDataRow[] }) {
    // Safety check: if no data, don't render anything or render empty state
    if (!data || data.length === 0) return null;

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