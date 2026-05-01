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



export default function ReportBranch({ data, omsetLabel, leadsLabel }: { data: BranchWeeklyReport[] | null; omsetLabel?: string; leadsLabel?: string }) {
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
                                    <th className="px-4 py-3 text-center">Target Omset</th>
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
                                                        {(week.target_leads || 0).toLocaleString("id-ID")}
                                                    </td>

                                                    {/* Target Omset */}
                                                    <td className="px-4 py-3 text-center font-medium text-gray-900">
                                                        {(week.target_omset || 0).toLocaleString("id-ID")}
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
                                                        {`${parseFloat(week.target_vs_actual || "0").toFixed(2)}%`}
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
                                                        {`${parseFloat(week.ads_vs_omset || "0").toFixed(2)}%`}
                                                    </td>
                                                </tr>
                                            );
                                        })}

                                        {/* TOTAL ROW */}
                                        {(() => {
                                            const totalBudget = branch.weeks.reduce((s, w) => s + (w.budget || 0), 0);
                                            const totalPpn = branch.weeks.reduce((s, w) => s + (w.ppn || 0), 0);
                                            const totalSpend = branch.weeks.reduce((s, w) => s + (w.total_spend || 0), 0);
                                            const totalTargetLeads = branch.weeks.reduce((s, w) => s + (w.target_leads || 0), 0);
                                            const totalTargetOmset = branch.weeks.reduce((s, w) => s + (w.target_omset || 0), 0);
                                            const totalActualLead = branch.weeks.reduce((s, w) => s + (w.actual_lead || 0), 0);
                                            const totalWarm = branch.weeks.reduce((s, w) => s + (w.warm_leads || 0), 0);
                                            const totalClosing = branch.weeks.reduce((s, w) => s + (w.closing || 0), 0);
                                            const totalOmset = branch.weeks.reduce((s, w) => s + (w.omset || 0), 0);

                                            // Derived totals
                                            const totalCpl = totalActualLead > 0 ? totalSpend / totalActualLead : 0;
                                            const totalTva = totalTargetLeads > 0 ? (totalActualLead / totalTargetLeads) * 100 : 0;
                                            const totalClosingRate = totalActualLead > 0 ? (totalClosing / totalActualLead) * 100 : 0;
                                            const totalAdsVsOmset = totalOmset > 0 ? (totalSpend / totalOmset) * 100 : 0;

                                            return (
                                                <tr className="bg-gray-100 border-t-2 border-gray-300 font-bold text-gray-800">
                                                    <td className="px-4 py-3 whitespace-nowrap text-gray-900 font-bold">
                                                        Total
                                                    </td>
                                                    <td className="px-4 py-3 text-right">{totalBudget.toLocaleString("id-ID")}</td>
                                                    <td className="px-4 py-3 text-right text-gray-600">{totalPpn.toLocaleString("id-ID")}</td>
                                                    <td className="px-4 py-3 text-right">{totalSpend.toLocaleString("id-ID")}</td>
                                                    <td className="px-4 py-3 text-center">{totalTargetLeads.toLocaleString("id-ID")}</td>
                                                    <td className="px-4 py-3 text-center">{totalTargetOmset.toLocaleString("id-ID")}</td>
                                                    <td className="px-4 py-3 text-right">{totalActualLead}</td>
                                                    <td className="px-4 py-3 text-right text-xs">{Math.round(totalCpl).toLocaleString("id-ID")}</td>
                                                    <td className={`px-4 py-3 text-center text-xs font-bold ${totalTva >= 100 ? "text-green-600" : "text-red-500"}`}>
                                                        {totalTva.toFixed(2)}%
                                                    </td>
                                                    <td className="px-4 py-3 text-center text-orange-600">{totalWarm}</td>
                                                    <td className="px-4 py-3 text-right text-green-600">{totalClosing}</td>
                                                    <td className="px-4 py-3 text-right text-blue-600">{totalOmset.toLocaleString("id-ID")}</td>
                                                    <td className="px-4 py-3 text-right text-gray-600">{totalClosingRate.toFixed(2)}%</td>
                                                    <td className="px-4 py-3 text-right text-xs text-gray-500">{totalAdsVsOmset.toFixed(2)}%</td>
                                                </tr>
                                            );
                                        })()}
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
            ))}
        </div>
    );
}