import { ReportSummaryData } from '@/app/types/types';
import React from 'react';

// --- HELPER FUNCTIONS ---

const formatIDR = (value: number) => {
    return "Rp " + value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

const parsePercent = (valueString: string): number => {
    if (!valueString) return 0;
    return parseFloat(valueString.replace('%', '')) || 0;
};

// Reusable Card Sub-component
const StatCard = ({
    title,
    value,
    subValue = null,
    valueClassName = "text-gray-900"
}: {
    title: string;
    value: string | number;
    subValue?: string | React.ReactNode | null;
    valueClassName?: string;
}) => (
    <div className="bg-white p-5 border border-gray-200 rounded-xl shadow-sm flex flex-col justify-between h-full">
        <div>
            <dt className="text-sm font-medium text-gray-500 uppercase tracking-wider">{title}</dt>
            <dd className={`mt-2 text-2xl font-bold ${valueClassName} truncate`}>{value}</dd>
        </div>
        {subValue && (
            <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
                {subValue}
            </div>
        )}
    </div>
);

// --- MAIN COMPONENT ---

// Update: Allow 'null' for the initial loading state
export function ReportSummary({ data }: { data: ReportSummaryData | null }) {

    // --- LOADING STATE ---
    // If data is null, show a simple loading skeleton instead of crashing
    if (!data) {
        return (
            <div className="w-full max-w-7xl mx-auto p-4">
                <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-6"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-32 bg-gray-100 rounded-xl animate-pulse border border-gray-200"></div>
                    ))}
                </div>
            </div>
        );
    }

    // --- LOGIC HELPERS ---
    const leadAchievedNum = parsePercent(data.target_vs_actual_leads);
    const omsetAchievedNum = parsePercent(data.target_vs_actual_omset);
    const adsVsOmsetNum = parsePercent(data.ads_vs_omset);

    const getAchievementColor = (val: number) => val >= 100 ? 'text-green-600' : 'text-yellow-600';

    return (
        <div className="w-full mx-auto p-4">
            <h3 className="text-xl font-bold mb-6 text-gray-800">Performance Overview</h3>

            <div className="space-y-6">

                {/* --- Row 1: Key Financials & Efficiency --- */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                        title="Total Omset (Revenue)"
                        value={formatIDR(data.omset)}
                        valueClassName="text-green-700"
                        subValue={
                            <span>
                                Target: {formatIDR(data.target_omset)}
                                <span className={`ml-1 ${getAchievementColor(omsetAchievedNum)}`}>
                                    ({data.target_vs_actual_omset})
                                </span>
                            </span>
                        }
                    />
                    <StatCard
                        title="Total Spend"
                        value={formatIDR(data.total_spend)}
                        valueClassName="text-red-600"
                        subValue={`Budget: ${formatIDR(data.budget)}`}
                    />
                    <StatCard
                        title="Ads vs Omset (Cost %)"
                        value={data.ads_vs_omset}
                        valueClassName={adsVsOmsetNum > 30 ? "text-red-600" : "text-blue-900"}
                        subValue="Lower % is better efficiency"
                    />
                    <StatCard
                        title="Closing Rate"
                        value={data.closing_rate}
                        valueClassName="text-blue-600"
                        subValue={`${data.closing} sales from leads`}
                    />
                </div>

                {/* --- Row 2: Lead Funnel Breakdown --- */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard
                        title="Actual Leads"
                        value={data.actual_lead}
                        subValue={`Target: ${data.target_lead}`}
                    />
                    <StatCard
                        title="Lead Achievement"
                        value={data.target_vs_actual_leads}
                        valueClassName={getAchievementColor(leadAchievedNum)}
                    />
                    <StatCard
                        title="Warm Leads"
                        value={data.warm_leads}
                        valueClassName="text-yellow-600"
                    />
                    <StatCard
                        title="Total Closing"
                        value={data.closing}
                        valueClassName="text-green-600"
                    />
                </div>

            </div>
        </div>
    );
}