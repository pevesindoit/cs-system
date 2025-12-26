import { DailyReportItem } from '@/app/types/types';
import React from 'react';

// 1. Type Definition for a single item in the array

// 2. Helper for Money formatting
const formatIDR = (val: number) =>
    "Rp " + val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");

const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString('id-ID', {
        day: 'numeric', month: 'short', year: 'numeric'
    });
};

export function ReportDetail({ data }: { data: DailyReportItem[] }) {
    // If data is null or undefined, default to empty array to prevent crash
    const safeData = Array.isArray(data) ? data : [];

    return (
        <div className="w-full overflow-x-auto border rounded-lg shadow-sm bg-white">
            <table className="w-full text-sm text-left text-gray-600">
                <thead className="bg-gray-50 border-b">
                    <tr>
                        {[
                            "Tanggal",
                            "Budget",
                            "Total Spend",
                            "Actual Lead",
                            "Warm Leads",
                            "Closing",
                            "Closing Rate",
                            "Omset",
                            "Ads vs Omset"
                        ].map((h, i) => (
                            <th
                                key={i}
                                scope="col"
                                className="px-4 py-3 font-semibold text-gray-700 border-r last:border-r-0 whitespace-nowrap"
                            >
                                {h}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                    {safeData.length > 0 ? (
                        safeData.map((row, index) => (
                            <tr key={index} className="hover:bg-gray-50 transition-colors">

                                {/* Tanggal / Date */}
                                <td className="px-4 py-3 border-r font-medium text-gray-900 whitespace-nowrap">
                                    {formatDate(row.date)}
                                </td>

                                {/* Budget */}
                                <td className="px-4 py-3 border-r whitespace-nowrap">
                                    {formatIDR(row.budget)}
                                </td>

                                {/* Total Spend */}
                                <td className="px-4 py-3 border-r text-red-600 font-medium whitespace-nowrap">
                                    {formatIDR(row.total_spend)}
                                </td>

                                {/* Actual Lead */}
                                <td className="px-4 py-3 border-r text-center font-bold text-gray-800">
                                    {row.actual_lead}
                                </td>

                                {/* Warm Leads */}
                                <td className="px-4 py-3 border-r text-center text-yellow-600">
                                    {row.warm_leads}
                                </td>

                                {/* Closing */}
                                <td className="px-4 py-3 border-r text-center text-green-600 font-bold">
                                    {row.closing}
                                </td>

                                {/* Closing Rate */}
                                <td className="px-4 py-3 border-r text-center text-blue-600">
                                    {row.closing_rate}
                                </td>

                                {/* Omset */}
                                <td className="px-4 py-3 border-r font-bold text-green-700 whitespace-nowrap">
                                    {formatIDR(row.omset)}
                                </td>

                                {/* Ads vs Omset */}
                                <td className="px-4 py-3 text-center font-medium">
                                    {/* Highlight red if cost is high (>30%), otherwise gray */}
                                    <span className={parseFloat(row.ads_vs_omset) > 30 ? "text-red-500" : "text-gray-700"}>
                                        {row.ads_vs_omset}
                                    </span>
                                </td>

                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={9} className="px-4 py-8 text-center text-gray-500 italic">
                                No data available.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}