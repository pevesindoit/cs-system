import React from "react";
import { ReportSummaryData } from "@/app/types/types";

// ─── Interfaces ──────────────────────────────────────────────────────────────

interface WeeklyDataRow {
    week_name: string;
    date_range: string;
    google_ads: number;
    meta_ads: number;
    tiktok_ads: number;
    total_ads: number;
    omset: number; // This hooks natively into real_omset from the API
    ads_ratio: string;
    ads_vs_omset: string;
}

interface BranchAdsReport {
    branch_id: string;
    branch_name: string;
    weeks: WeeklyDataRow[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(n: number) {
    return (n || 0).toLocaleString("id-ID");
}

const formatIDR = (value: number | undefined | null) => {
    const v = value || 0;
    return "Rp " + v.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

const parsePercent = (value: string | number | undefined): number => {
    if (!value) return 0;
    if (typeof value === "number") return value;
    return parseFloat(value.replace("%", "")) || 0;
};

// ─── Stat Card ───────────────────────────────────────────────────────────────

const StatCard = ({
    title,
    value,
    subValue = null,
    valueClassName = "text-gray-900",
    accent,
}: {
    title: string;
    value: string | number;
    subValue?: string | React.ReactNode | null;
    valueClassName?: string;
    accent?: string;
}) => (
    <div
        className={`bg-white p-5 border rounded-xl shadow-sm flex flex-col justify-between h-full ${accent ? `border-l-4 ${accent}` : "border-gray-200"
            }`}
    >
        <div>
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                {title}
            </div>
            <div className={`mt-2 text-2xl font-bold break-words ${valueClassName}`}>
                {value}
            </div>
        </div>
        {subValue && (
            <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
                {subValue}
            </div>
        )}
    </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdsVsOmset({
    data,
    summary,
}: {
    data: BranchAdsReport[] | null;
    summary?: ReportSummaryData | null;
}) {
    // ── Loading skeleton ─────────────────────────────────────────────────────
    if (!data) {
        return (
            <div className="space-y-8 mt-8 animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div
                            key={i}
                            className="h-28 bg-gray-100 rounded-xl border border-gray-200"
                        ></div>
                    ))}
                </div>
                {[1, 2].map((i) => (
                    <div
                        key={i}
                        className="border rounded-lg bg-white overflow-hidden shadow-sm"
                    >
                        <div className="bg-gray-100 px-6 py-4 border-b h-12"></div>
                        <div className="p-6 space-y-3">
                            <div className="h-6 bg-gray-200 rounded w-full"></div>
                            <div className="h-6 bg-gray-100 rounded w-full"></div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (!Array.isArray(data) || data.length === 0) return null;

    // ── Aggregate global totals from all branches ────────────────────────────
    const grand = data.reduce(
        (acc, branch) => {
            (branch.weeks || []).forEach((w) => {
                acc.google += w.google_ads || 0;
                acc.meta += w.meta_ads || 0;
                acc.tiktok += w.tiktok_ads || 0;
                acc.total_ads += w.total_ads || 0;
                acc.omset += w.omset || 0; // Summarizing real_omset
            });
            return acc;
        },
        { google: 0, meta: 0, tiktok: 0, total_ads: 0, omset: 0 }
    );

    const grandRatio =
        grand.omset > 0
            ? ((grand.total_ads / grand.omset) * 100).toFixed(2)
            : "0.00";
    const grandRatioNum = parseFloat(grandRatio);

    const adsVsOmsetNum = summary ? parsePercent(summary.ads_vs_omset) : 0;

    return (
        <div className="space-y-8 mt-8">

            {/* ── PER-BRANCH BREAKDOWN TABLE ────────────────────────────── */}
            <div>
                <h2 className="text-xl font-bold text-gray-800 border-b pb-2">
                    Ads vs Omset — Per Cabang
                </h2>

                {data.map((branch, index) => {
                    const totals = (branch.weeks || []).reduce(
                        (acc, w) => {
                            acc.google_ads += w.google_ads || 0;
                            acc.meta_ads += w.meta_ads || 0;
                            acc.tiktok_ads += w.tiktok_ads || 0;
                            acc.total_ads += w.total_ads || 0;
                            acc.omset += w.omset || 0;
                            return acc;
                        },
                        {
                            google_ads: 0,
                            meta_ads: 0,
                            tiktok_ads: 0,
                            total_ads: 0,
                            omset: 0,
                        }
                    );

                    const totalRatio =
                        totals.omset > 0
                            ? ((totals.total_ads / totals.omset) * 100).toFixed(2)
                            : "0.00";

                    return (
                        <div
                            key={branch.branch_id || index}
                            className="border rounded-lg bg-white overflow-hidden shadow-sm mt-4"
                            style={{ pageBreakAfter: "always" }}
                        >
                            <div className="bg-gray-100 px-4 py-2 border-b flex justify-between items-center">
                                <h3 className="text-base font-bold text-gray-700 capitalize">
                                    {branch.branch_name}
                                </h3>
                                <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded border shadow-sm">
                                    {branch.weeks ? branch.weeks.length : 0} Weeks Recorded
                                </span>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-[0.65rem] text-left text-gray-500">
                                    <thead className="text-[0.6rem] text-gray-700 bg-gray-50 border-b uppercase font-bold">
                                        <tr>
                                            <th className="px-3 py-2">Period</th>
                                            <th className="px-3 py-2 text-right text-blue-600">Google Ads</th>
                                            <th className="px-3 py-2 text-right text-indigo-600">Meta Ads</th>
                                            <th className="px-3 py-2 text-right text-pink-600">TikTok Ads</th>
                                            <th className="px-3 py-2 text-right font-bold text-gray-900 bg-gray-100">Total Ads</th>
                                            <th className="px-3 py-2 text-right text-green-600">Real Omset</th>
                                            <th className="px-3 py-2 text-center text-orange-600">Ratio (%)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {branch.weeks && branch.weeks.length > 0 ? (
                                            <>
                                                {branch.weeks.map((week, idx) => {
                                                    const ratio =
                                                        week.ads_ratio ||
                                                        week.ads_vs_omset ||
                                                        "0%";
                                                    const ratioNum = parseFloat(ratio);
                                                    return (
                                                        <tr
                                                            key={idx}
                                                            className="bg-white border-b hover:bg-gray-50 transition-colors"
                                                        >
                                                            <td className="px-3 py-2 whitespace-nowrap">
                                                                <div className="font-semibold text-gray-900">{week.week_name}</div>
                                                                <div className="text-[0.5rem] text-gray-400">{week.date_range}</div>
                                                            </td>
                                                            <td className="px-3 py-2 text-right text-blue-700">{fmt(week.google_ads)}</td>
                                                            <td className="px-3 py-2 text-right text-indigo-700">{fmt(week.meta_ads)}</td>
                                                            <td className="px-3 py-2 text-right text-pink-700">{fmt(week.tiktok_ads)}</td>
                                                            <td className="px-3 py-2 text-right font-bold text-gray-900 bg-gray-50">{fmt(week.total_ads)}</td>
                                                            <td className="px-3 py-2 text-right font-bold text-green-700">{fmt(week.omset)}</td>
                                                            <td className={`px-3 py-2 text-center font-semibold ${ratioNum > 30 ? "text-red-500" : "text-green-600"}`}>
                                                                {ratio}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}

                                                <tr className="bg-gray-100 font-bold border-t-2 border-gray-300">
                                                    <td className="px-3 py-2 whitespace-nowrap text-gray-900">Total</td>
                                                    <td className="px-3 py-2 text-right text-blue-700">{fmt(totals.google_ads)}</td>
                                                    <td className="px-3 py-2 text-right text-indigo-700">{fmt(totals.meta_ads)}</td>
                                                    <td className="px-3 py-2 text-right text-pink-700">{fmt(totals.tiktok_ads)}</td>
                                                    <td className="px-3 py-2 text-right text-gray-900 bg-gray-50">{fmt(totals.total_ads)}</td>
                                                    <td className="px-3 py-2 text-right text-green-700">{fmt(totals.omset)}</td>
                                                    <td className={`px-3 py-2 text-center ${parseFloat(totalRatio) > 30 ? "text-red-500" : "text-green-600"}`}>
                                                        {totalRatio}%
                                                    </td>
                                                </tr>
                                            </>
                                        ) : (
                                            <tr>
                                                <td colSpan={7} className="text-center py-6 text-gray-400 italic">
                                                    No data available for this branch.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    );
                })}
            </div>
            {/* ── PERFORMANCE OVERVIEW ───────────────────────────────────── */}
            <div>
                <h3 className="text-xl font-bold text-gray-800 mb-4">
                    Performance Overview
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <StatCard
                        title="Total Real Omset"
                        value={formatIDR(summary?.omset ?? grand.omset)}
                        valueClassName="text-green-700"
                        accent="border-green-400"
                        subValue={summary ? `Target: ${formatIDR(summary.omset_target)} (${summary.target_vs_actual_omset})` : undefined}
                    />
                    <StatCard
                        title="Total Ads Spend"
                        value={formatIDR(summary?.total_spend ?? grand.total_ads)}
                        valueClassName="text-red-600"
                        accent="border-red-400"
                        subValue={summary ? `Budget: ${formatIDR(summary.budget)}` : undefined}
                    />
                    <StatCard
                        title="Ads vs Omset"
                        value={summary ? summary.ads_vs_omset : `${grandRatio}%`}
                        valueClassName={(summary ? adsVsOmsetNum : grandRatioNum) > 30 ? "text-red-600" : "text-blue-700"}
                        accent={(summary ? adsVsOmsetNum : grandRatioNum) > 30 ? "border-red-400" : "border-blue-400"}
                        subValue="Lower % = better efficiency"
                    />
                    <StatCard
                        title="Closing Rate"
                        value={summary?.closing_rate ?? "—"}
                        valueClassName="text-purple-700"
                        accent="border-purple-400"
                        subValue={summary ? `${summary.closing} closing from ${summary.actual_lead} leads` : undefined}
                    />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <StatCard
                        title="Google Ads"
                        value={formatIDR(grand.google)}
                        valueClassName="text-blue-700"
                        accent="border-blue-400"
                        subValue={grand.total_ads > 0 ? `${((grand.google / grand.total_ads) * 100).toFixed(1)}% of total ads` : "0% of total ads"}
                    />
                    <StatCard
                        title="Meta Ads (FB + IG)"
                        value={formatIDR(grand.meta)}
                        valueClassName="text-indigo-700"
                        accent="border-indigo-400"
                        subValue={grand.total_ads > 0 ? `${((grand.meta / grand.total_ads) * 100).toFixed(1)}% of total ads` : "0% of total ads"}
                    />
                    <StatCard
                        title="TikTok Ads"
                        value={formatIDR(grand.tiktok)}
                        valueClassName="text-pink-700"
                        accent="border-pink-400"
                        subValue={grand.total_ads > 0 ? `${((grand.tiktok / grand.total_ads) * 100).toFixed(1)}% of total ads` : "0% of total ads"}
                    />
                </div>
            </div>
        </div>
    );
}