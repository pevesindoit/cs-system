import React from "react";

interface BranchData {
    name: string;
    budget: number;
    total_spend: number;
    actual_lead: number;
    closing: number;
    warm_leads: number;
    omset: number;
    closing_rate: string;
    ads_vs_omset: string;
}

export default function ReportBranch({ data }: { data: BranchData[] }) {
    if (!data || data.length === 0) return null;

    return (
        <div className="mt-8">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Breakdown Percabang</h3>
            <div className="overflow-x-auto border rounded-lg">
                <table className="w-full text-sm text-left text-gray-500">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
                        <tr>
                            <th className="px-4 py-3">Nama Cabang</th>
                            <th className="px-4 py-3 text-right">Budget (Ads)</th>
                            <th className="px-4 py-3 text-right">Total Spend (+PPN)</th>
                            <th className="px-4 py-3 text-center">Leads</th>
                            <th className="px-4 py-3 text-center">Warm</th>
                            <th className="px-4 py-3 text-center">Closing</th>
                            <th className="px-4 py-3 text-right">Closing Rate</th>
                            <th className="px-4 py-3 text-right">Omset</th>
                            <th className="px-4 py-3 text-right">Ads vs Omset</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((row, index) => (
                            <tr key={index} className="bg-white border-b hover:bg-gray-50">
                                <td className="px-4 py-3 font-medium text-gray-900">{row.name}</td>
                                <td className="px-4 py-3 text-right">{row.budget.toLocaleString("id-ID")}</td>
                                <td className="px-4 py-3 text-right">{row.total_spend.toLocaleString("id-ID")}</td>
                                <td className="px-4 py-3 text-center">{row.actual_lead}</td>
                                <td className="px-4 py-3 text-center text-orange-600">{row.warm_leads}</td>
                                <td className="px-4 py-3 text-center text-green-600 font-bold">{row.closing}</td>
                                <td className="px-4 py-3 text-right">{row.closing_rate}</td>
                                <td className="px-4 py-3 text-right font-semibold text-gray-900">
                                    {row.omset.toLocaleString("id-ID")}
                                </td>
                                <td className="px-4 py-3 text-right">{row.ads_vs_omset}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}