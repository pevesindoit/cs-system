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
    ads_vs_omset: string;
    ppn: number;             // Data: 4620
    cost_per_lead: number;   // Data: 0
    target_omset: number;
}

export interface BranchWeeklyReport {
    branch_id: string;
    branch_name: string;
    weeks: WeeklyDataRow[];
}



export default function ReportBranch({ data }: { data: BranchWeeklyReport[] | null }) {
    console.log(data, "ini data")
    // LOADING SKELETON
    if (!data) {
        return (
            <div className="space-y-8 mt-8 animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
                {[1, 2].map((i) => (
                    <div key={i} className="border rounded-lg bg-white overflow-hidden shadow-sm">
                        <div className="bg-gray-100 px-6 py-4 border-b h-12"></div>
                        <div className="p-6 space-y-4">
                            <div className="h-6 bg-gray-200 rounded w-full"></div>
                            <div className="h-6 bg-gray-100 rounded w-full"></div>
                            <div className="h-6 bg-gray-200 rounded w-full"></div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    // Safety check for empty array (after null check)
    if (!Array.isArray(data) || data.length === 0) return null;

    return (
        <div className="space-y-8 mt-8">
            <h2 className="text-xl font-bold text-gray-800 border-b pb-2">
                Laporan Cabang Perbulan
            </h2>

            {data.map((branch, index) => {
                const totals = (branch.weeks || []).reduce((acc, curr) => {
                    acc.budget += curr.budget || 0;
                    acc.ppn += curr.ppn || 0;
                    acc.total_spend += curr.total_spend || 0;
                    acc.target_leads += curr.target_leads || 0;
                    acc.target_omset += curr.target_omset || 0;
                    acc.actual_lead += curr.actual_lead || 0;
                    acc.warm_leads += curr.warm_leads || 0;
                    acc.closing += curr.closing || 0;
                    acc.omset += curr.omset || 0;
                    return acc;
                }, {
                    budget: 0,
                    ppn: 0,
                    total_spend: 0,
                    target_leads: 0,
                    target_omset: 0,
                    actual_lead: 0,
                    warm_leads: 0,
                    closing: 0,
                    omset: 0,
                });

                const totalTargetVsActual = totals.target_leads > 0 ? (totals.actual_lead / totals.target_leads) * 100 : 0;
                const totalCostPerLead = totals.actual_lead > 0 ? totals.total_spend / totals.actual_lead : 0;
                const totalClosingRate = totals.actual_lead > 0 ? (totals.closing / totals.actual_lead) * 100 : 0;
                const totalAdsVsOmset = totals.omset > 0 ? (totals.total_spend / totals.omset) * 100 : 0;

                return (
                <div
                    key={branch.branch_id || index}
                    className="border rounded-lg bg-white overflow-hidden shadow-sm page-break"
                    style={{ pageBreakAfter: 'always' }}
                >
                    {/* BRANCH HEADER */}
                    <div className="bg-gray-100 px-4 py-2 border-b flex justify-between items-center">
                        <h3 className="text-base font-bold text-gray-700 capitalize">
                            {branch.branch_name}
                        </h3>
                        <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded border shadow-sm">
                            {branch.weeks ? branch.weeks.length : 0} Weeks Recorded
                        </span>
                    </div>

                    {/* WEEKLY TABLE */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-[0.55rem] text-left text-gray-500">
                            <thead className="text-[0.5rem] text-gray-700 bg-gray-50 border-b uppercase font-bold">
                                <tr>
                                    <th className="px-1.5 py-1">Period</th>
                                    <th className="px-1.5 py-1 text-center">Budget Iklan</th>
                                    <th className="px-1.5 py-1 text-center">PPN 11%</th>
                                    <th className="px-1.5 py-1 text-center">Total Spend</th>
                                    <th className="px-1.5 py-1 text-center">Target Leads</th>
                                    <th className="px-1.5 py-1 text-center">Target Omset</th>
                                    <th className="px-1.5 py-1 text-center">Actual Leads</th>
                                    <th className="px-1.5 py-1 text-center">CPL</th>
                                    <th className="px-1.5 py-1 text-center">T v A</th>
                                    <th className="px-1.5 py-1 text-center">Warm</th>
                                    <th className="px-1.5 py-1 text-center">Close</th>
                                    {/* Added Columns */}
                                    <th className="px-1.5 py-1 text-center">Real Omset</th>
                                    <th className="px-1.5 py-1 text-center">% CR</th>
                                    <th className="px-1.5 py-1 text-center">Ads/Omset</th>
                                </tr>
                            </thead>
                            <tbody>
                                {branch.weeks && branch.weeks.length > 0 ? (
                                    <>
                                        {branch.weeks.map((week, idx) => {
                                            // Calculations: Use data if provided, or calculate fallback
                                            // Note: Your data provides 'ppn' and 'cost_per_lead', so we use them directly
                                            // but we keep the fallback || 0 for safety.

                                            return (
                                                <tr
                                                    key={idx}
                                                    className="bg-white border-b hover:bg-gray-50 transition-colors"
                                                >
                                                    {/* 1. Period */}
                                                    <td className="px-1.5 py-1 whitespace-nowrap">
                                                        <div className="font-semibold text-gray-900">
                                                            {week.week_name}
                                                        </div>
                                                        <div className="text-[0.5rem] text-gray-400">
                                                            {week.date_range}
                                                        </div>
                                                    </td>

                                                    {/* 2. Budget */}
                                                    <td className="px-1.5 py-1 text-right">
                                                        {(week.budget || 0).toLocaleString("id-ID")}
                                                    </td>

                                                    {/* 3. PPN */}
                                                    <td className="px-1.5 py-1 text-right text-gray-500">
                                                        {(week.ppn || 0).toLocaleString("id-ID")}
                                                    </td>

                                                    {/* 4. Total Spend */}
                                                    <td className="px-1.5 py-1 text-right font-medium text-gray-900">
                                                        {(week.total_spend || 0).toLocaleString("id-ID")}
                                                    </td>

                                                    {/* 5. Target Leads */}
                                                    <td className="px-1.5 py-1 text-center text-gray-600">
                                                        {(week.target_leads || 0).toLocaleString("id-ID")}
                                                    </td>

                                                    {/* Target Omset */}
                                                    <td className="px-1.5 py-1 text-center font-medium text-gray-900">
                                                        {(week.target_omset || 0).toLocaleString("id-ID")}
                                                    </td>

                                                    {/* 6. Actual Leads */}
                                                    <td className="px-1.5 py-1 text-right font-bold text-gray-900">
                                                        {week.actual_lead || 0}
                                                    </td>

                                                    {/* 7. Cost Per Lead */}
                                                    <td className="px-1.5 py-1 text-right text-[0.55rem]">
                                                        {/* Using the pre-calculated value from your DB if available */}
                                                        {(week.cost_per_lead || 0).toLocaleString("id-ID")}
                                                    </td>

                                                    {/* 8. Target vs Actual */}
                                                    <td className={`px-1.5 py-1 text-center text-[0.55rem] font-semibold ${parseFloat(week.target_vs_actual) >= 100
                                                        ? "text-green-600"
                                                        : "text-red-500"
                                                        }`}>
                                                        {week.target_vs_actual || "0%"}
                                                    </td>

                                                    {/* 9. Warm */}
                                                    <td className="px-1.5 py-1 text-center text-orange-600 font-medium">
                                                        {week.warm_leads || 0}
                                                    </td>

                                                    {/* 10. Closing */}
                                                    <td className="px-1.5 py-1 text-right text-green-600 font-bold">
                                                        {week.closing || 0}
                                                    </td>

                                                    {/* 11. Real Omset (Added) */}
                                                    <td className="px-1.5 py-1 text-right font-bold text-blue-600">
                                                        {(week.omset || 0).toLocaleString("id-ID")}
                                                    </td>

                                                    {/* 12. Closing Rate */}
                                                    <td className="px-1.5 py-1 text-right text-gray-600">
                                                        {week.closing_rate || "0%"}
                                                    </td>

                                                    {/* 13. Ads vs Omset (Added) */}
                                                    <td className="px-1.5 py-1 text-right text-[0.55rem] text-gray-500">
                                                        {week.ads_vs_omset || "0%"}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {/* TOTAL ROW */}
                                        <tr className="bg-gray-100 font-bold border-t-2 border-gray-300">
                                            <td className="px-1.5 py-1 whitespace-nowrap text-gray-900">
                                                Total
                                            </td>
                                            <td className="px-1.5 py-1 text-right text-gray-900">
                                                {totals.budget.toLocaleString("id-ID")}
                                            </td>
                                            <td className="px-1.5 py-1 text-right text-gray-900">
                                                {totals.ppn.toLocaleString("id-ID")}
                                            </td>
                                            <td className="px-1.5 py-1 text-right text-gray-900">
                                                {totals.total_spend.toLocaleString("id-ID")}
                                            </td>
                                            <td className="px-1.5 py-1 text-center text-gray-900">
                                                {totals.target_leads.toLocaleString("id-ID")}
                                            </td>
                                            <td className="px-1.5 py-1 text-center text-gray-900">
                                                {totals.target_omset.toLocaleString("id-ID")}
                                            </td>
                                            <td className="px-1.5 py-1 text-right text-gray-900">
                                                {totals.actual_lead}
                                            </td>
                                            <td className="px-1.5 py-1 text-right text-[0.55rem] text-gray-900">
                                                {Math.round(totalCostPerLead).toLocaleString("id-ID")}
                                            </td>
                                            <td className={`px-1.5 py-1 text-center text-[0.55rem] ${totalTargetVsActual >= 100 ? "text-green-600" : "text-red-500"}`}>
                                                {totalTargetVsActual.toFixed(2)}%
                                            </td>
                                            <td className="px-1.5 py-1 text-center text-orange-600">
                                                {totals.warm_leads}
                                            </td>
                                            <td className="px-1.5 py-1 text-right text-green-600">
                                                {totals.closing}
                                            </td>
                                            <td className="px-1.5 py-1 text-right text-blue-600">
                                                {totals.omset.toLocaleString("id-ID")}
                                            </td>
                                            <td className="px-1.5 py-1 text-right text-gray-900">
                                                {totalClosingRate.toFixed(2)}%
                                            </td>
                                            <td className="px-1.5 py-1 text-right text-[0.55rem] text-gray-900">
                                                {totalAdsVsOmset.toFixed(2)}%
                                            </td>
                                        </tr>
                                    </>
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
            )})}
        </div>
    );
}