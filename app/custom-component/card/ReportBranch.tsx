import React from "react";

// 1. Interfaces matching your specific data provided
interface WeeklyDataRow {
    week_name: string;
    date_range: string;
    budget: number;
    total_spend: number;
    actual_lead: number;
    closing: number;
    warm_leads: number;
    omset: number;           // Data: 0
    target_leads: number;    // Data: 44
    target_vs_actual: string;// Data: "0.00%"
    closing_rate: string;    // Data: "0.00%"
    ads_vs_omset: string;    // Data: "0.00%"
    ppn: number;             // Data: 4620
    cost_per_lead: number;   // Data: 0
}

interface BranchWeeklyReport {
    branch_id: string;
    branch_name: string;
    weeks: WeeklyDataRow[];
}

export default function ReportBranch({ data }: { data: BranchWeeklyReport[] }) {
    // Safety check
    if (!data || !Array.isArray(data) || data.length === 0) return null;

    return (
        <div className="space-y-8 mt-8">
            <h2 className="text-xl font-bold text-gray-800 border-b pb-2">
                Laporan Cabang Perbulan
            </h2>

            {data.map((branch, index) => (
                <div
                    key={branch.branch_id || index}
                    className="border rounded-lg bg-white overflow-hidden shadow-sm"
                >
                    {/* BRANCH HEADER */}
                    <div className="bg-gray-100 px-6 py-4 border-b flex justify-between items-center">
                        <h3 className="text-lg font-bold text-gray-700 capitalize">
                            {branch.branch_name}
                        </h3>
                        <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded border shadow-sm">
                            {branch.weeks ? branch.weeks.length : 0} Weeks Recorded
                        </span>
                    </div>

                    {/* WEEKLY TABLE */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-500">
                            <thead className="text-[.7rem] text-gray-700 bg-gray-50 border-b">
                                <tr>
                                    <th className="px-4 py-3">Period</th>
                                    <th className="px-4 py-3 text-center">Budget Iklan</th>
                                    <th className="px-4 py-3 text-center">PPN 11%</th>
                                    <th className="px-4 py-3 text-center">Total Spend</th>
                                    <th className="px-4 py-3 text-center">Target Leads</th>
                                    <th className="px-4 py-3 text-center">Actual Leads</th>
                                    <th className="px-4 py-3 text-center">Cost Perlead</th>
                                    <th className="px-4 py-3 text-center">Target vs Actual</th>
                                    <th className="px-4 py-3 text-center">Warm</th>
                                    <th className="px-4 py-3 text-center">Closing</th>
                                    {/* Added Columns */}
                                    <th className="px-4 py-3 text-center">Real Omset</th>
                                    <th className="px-4 py-3 text-center">% Closing Rate</th>
                                    <th className="px-4 py-3 text-center">Ads vs Omset</th>
                                </tr>
                            </thead>
                            <tbody>
                                {branch.weeks && branch.weeks.length > 0 ? (
                                    branch.weeks.map((week, idx) => {
                                        // Calculations: Use data if provided, or calculate fallback
                                        // Note: Your data provides 'ppn' and 'cost_per_lead', so we use them directly
                                        // but we keep the fallback || 0 for safety.

                                        return (
                                            <tr
                                                key={idx}
                                                className="bg-white border-b hover:bg-gray-50 transition-colors"
                                            >
                                                {/* 1. Period */}
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <div className="font-semibold text-gray-900">
                                                        {week.week_name}
                                                    </div>
                                                    <div className="text-xs text-gray-400">
                                                        {week.date_range}
                                                    </div>
                                                </td>

                                                {/* 2. Budget */}
                                                <td className="px-4 py-3 text-right">
                                                    {(week.budget || 0).toLocaleString("id-ID")}
                                                </td>

                                                {/* 3. PPN */}
                                                <td className="px-4 py-3 text-right text-gray-500">
                                                    {(week.ppn || 0).toLocaleString("id-ID")}
                                                </td>

                                                {/* 4. Total Spend */}
                                                <td className="px-4 py-3 text-right font-medium text-gray-900">
                                                    {(week.total_spend || 0).toLocaleString("id-ID")}
                                                </td>

                                                {/* 5. Target Leads */}
                                                <td className="px-4 py-3 text-center text-gray-600">
                                                    {week.target_leads || 0}
                                                </td>

                                                {/* 6. Actual Leads */}
                                                <td className="px-4 py-3 text-right font-bold text-gray-900">
                                                    {week.actual_lead || 0}
                                                </td>

                                                {/* 7. Cost Per Lead */}
                                                <td className="px-4 py-3 text-right text-xs">
                                                    {/* Using the pre-calculated value from your DB if available */}
                                                    {(week.cost_per_lead || 0).toLocaleString("id-ID")}
                                                </td>

                                                {/* 8. Target vs Actual */}
                                                <td className={`px-4 py-3 text-center text-xs font-semibold ${parseFloat(week.target_vs_actual) >= 100
                                                    ? "text-green-600"
                                                    : "text-red-500"
                                                    }`}>
                                                    {week.target_vs_actual || "0%"}
                                                </td>

                                                {/* 9. Warm */}
                                                <td className="px-4 py-3 text-center text-orange-600 font-medium">
                                                    {week.warm_leads || 0}
                                                </td>

                                                {/* 10. Closing */}
                                                <td className="px-4 py-3 text-right text-green-600 font-bold">
                                                    {week.closing || 0}
                                                </td>

                                                {/* 11. Real Omset (Added) */}
                                                <td className="px-4 py-3 text-right font-bold text-blue-600">
                                                    {(week.omset || 0).toLocaleString("id-ID")}
                                                </td>

                                                {/* 12. Closing Rate */}
                                                <td className="px-4 py-3 text-right text-gray-600">
                                                    {week.closing_rate || "0%"}
                                                </td>

                                                {/* 13. Ads vs Omset (Added) */}
                                                <td className="px-4 py-3 text-right text-xs text-gray-500">
                                                    {week.ads_vs_omset || "0%"}
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td
                                            colSpan={13}
                                            className="text-center py-6 text-gray-400 italic"
                                        >
                                            No weekly data available for this branch.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            ))}
        </div>
    );
}