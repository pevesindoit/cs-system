import React from "react";

// 1. Define Interfaces matching the API response
interface WeeklyDataRow {
    week_name: string;
    date_range: string;
    budget: number;
    total_spend: number;
    actual_lead: number;
    closing: number;
    warm_leads: number;
    omset: number;
    closing_rate: string;
    ads_vs_omset: string;
}

interface BranchWeeklyReport {
    branch_id: string;
    branch_name: string;
    weeks: WeeklyDataRow[];
}

export default function ReportBranch({ data }: { data: BranchWeeklyReport[] }) {

    console.log(data, "ini bede")
    // Safety check
    if (!data || data.length === 0) return null;

    return (
        <div className="space-y-8 mt-8">
            <h2 className="text-xl font-bold text-gray-800 border-b pb-2">Branch Weekly Breakdown</h2>

            {data.map((branch, index) => (
                <div key={index} className="border rounded-lg bg-white overflow-hidden shadow-sm">

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
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
                                <tr>
                                    <th className="px-4 py-3">Period</th>
                                    <th className="px-4 py-3 text-right">Budget</th>
                                    <th className="px-4 py-3 text-right">Total Spend</th>
                                    <th className="px-4 py-3 text-center">Leads</th>
                                    <th className="px-4 py-3 text-center">Warm</th>
                                    <th className="px-4 py-3 text-center">Closing</th>
                                    <th className="px-4 py-3 text-right">Closing Rate</th>
                                    <th className="px-4 py-3 text-right">Omset</th>
                                    <th className="px-4 py-3 text-right">Ads vs Omset</th>
                                </tr>
                            </thead>
                            <tbody>
                                {branch.weeks && branch.weeks.length > 0 ? (
                                    branch.weeks.map((week, idx) => (
                                        <tr key={idx} className="bg-white border-b hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <div className="font-semibold text-gray-900">{week.week_name}</div>
                                                <div className="text-xs text-gray-400">{week.date_range}</div>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                {week.budget.toLocaleString("id-ID")}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                {week.total_spend.toLocaleString("id-ID")}
                                            </td>
                                            <td className="px-4 py-3 text-center font-medium text-gray-900">
                                                {week.actual_lead}
                                            </td>
                                            <td className="px-4 py-3 text-center text-orange-600 font-medium">
                                                {week.warm_leads}
                                            </td>
                                            <td className="px-4 py-3 text-center text-green-600 font-bold">
                                                {week.closing}
                                            </td>
                                            <td className="px-4 py-3 text-right text-gray-600">
                                                {week.closing_rate}
                                            </td>
                                            <td className="px-4 py-3 text-right font-semibold text-gray-900">
                                                {week.omset.toLocaleString("id-ID")}
                                            </td>
                                            <td className="px-4 py-3 text-right text-gray-600">
                                                {week.ads_vs_omset}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={9} className="text-center py-6 text-gray-400 italic">
                                            No weekly data available for this branch in the selected range.
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