"use client";

import { useEffect, useState } from "react";
import H1 from "../custom-component/H1";
import { getReport } from "../function/fetch/get/fetch";
import { ReportItem, ReportSummaryData } from "../types/types";
import { ReportSummary } from "../custom-component/table/ReportSummary";
import ReportBranch from "../custom-component/card/ReportBranch";
import DateMountSelector from "../custom-component/formater/DateMountSelector";
import AdsReport from "../custom-component/table/AdsReport";
import WeekFilter from "../custom-component/formater/WeekFilter";

export interface AdsDataRow {
    week: string;
    google_ads: number;
    meta_ads: number;
    tiktok_ads: number;
    total_ads: number;
    omset: number;
    ads_ratio: string;
}

// FIX: Use Local Time instead of UTC (toISOString)
const GetDefaultDate = () => {
    const today = new Date();

    // Helper to format as YYYY-MM-DD in LOCAL time
    const toLocalISO = (date: Date) => {
        const offset = date.getTimezoneOffset() * 60000; // offset in milliseconds
        const localDate = new Date(date.getTime() - offset);
        return localDate.toISOString().split("T")[0];
    };

    const end = toLocalISO(today);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    const start = toLocalISO(startDate);

    return {
        start_date: start,
        end_date: end,
    };
};

import { BranchWeeklyReport } from "../custom-component/card/ReportBranch";
import { Printer } from "lucide-react"; // Import Printer Icon

export default function Report() {
    const [fullMonthRange, setFullMonthRange] = useState(GetDefaultDate());
    const [range, setRange] = useState(GetDefaultDate());

    const [reportData, setReportData] = useState<ReportSummaryData | null>(null);
    // Initialize as null to show skeleton
    const [reportBranch, setReportBranch] = useState<any[] | null>(null);
    const [adsReport, setAdsReport] = useState<AdsDataRow[] | null>(null);

    const [interval, setInterval] = useState<'day' | 'week'>('week');
    // loading state is kept for logic but not for blocking UI
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setRange(fullMonthRange);
    }, [fullMonthRange]);

    useEffect(() => {
        const fetchData = async () => {
            if (!range.start_date || !range.end_date) return;

            try {
                setLoading(true);
                // Reset to null to show skeletons while fetching new data
                setReportData(null);
                setReportBranch(null);
                setAdsReport(null);

                const payload: ReportItem = {
                    start_date: range.start_date,
                    end_date: range.end_date,
                    interval: interval,
                };

                const res = await getReport(payload);

                if (res?.data?.data) {
                    setReportData(res.data.data.summary);
                    setReportBranch(res.data.data.branch_breakdown || []);
                    setAdsReport(res.data.data.ads || []);
                }
            } catch (error) {
                console.error("Error fetching report:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [range, interval]);

    // Handler for printing
    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="space-y-6">
            <style jsx global>{`
                @media print {
                    @page {
                        size: landscape;
                        margin: 10mm;
                    }
                    /* Hide everything by default */
                    body * {
                        visibility: hidden;
                    }
                    /* Show only the printable area and its children */
                    #printable-area, #printable-area * {
                        visibility: visible;
                    }
                    /* Position the printable area at the top-left */
                    #printable-area {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                    }
                    /* Ensure backgrounds (like graph colors) are printed */
                    * {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }

                    /* FIX: Ensure Scrollable Tables are fully visible in print */
                    .overflow-x-auto {
                        overflow: visible !important;
                        display: block !important;
                        width: auto !important;
                    }
                    
                    /* Scale down to fit 13 columns */
                    #printable-area {
                        zoom: 75%;
                    }
                }
            `}</style>


            {/* Parent Row: Aligns DateSelector and the Filter Group */}
            <div className="flex flex-row gap-4 items-center">

                {/* 1. Date Selector (Monthly/Ranges) */}
                <DateMountSelector onChange={setFullMonthRange} />

                {/* 2. Filter Group (Interval + WeekFilter) */}
            </div>
            <div className="flex items-center space-x-5">
                <select
                    className="border p-2 rounded bg-white w-full flex items-center justify-between bg-white border border-gray-300 text-gray-700 py-2 px-3 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    value={interval}
                    onChange={(e) => setInterval(e.target.value as 'day' | 'week')}
                >
                    <option value="week">Mingguan</option>
                    <option value="day">Harian</option>
                </select>

                {interval === 'day' && (
                    <WeekFilter
                        startDate={fullMonthRange.start_date}
                        endDate={fullMonthRange.end_date}
                        onChange={setRange}
                    />
                )}
            </div>
            <div className="flex flex-row justify-between items-center">
                <H1>Manager Report</H1>
                <button
                    onClick={handlePrint}
                    className="flex items-center gap-2 bg-black hover:bg-gray-900 text-white px-4 py-2 rounded-md shadow transition-colors"
                >
                    <Printer size={18} />
                    <span>Print / PDF</span>
                </button>
            </div>

            <div id="printable-area" className="border rounded-[5px] h-full py-10 px-9 bg-[#FEFEFE] gap-8 space-y-8 ">
                {/* Add a header specifically for print view so context is not lost */}
                <div className="hidden print:block mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">Manager Report</h1>
                    <p className="text-sm text-gray-500">
                        Period: {range.start_date} - {range.end_date}
                    </p>
                </div>

                <ReportBranch data={reportBranch} />
                <AdsReport data={adsReport} />
                <ReportSummary data={reportData} />
            </div>
        </div>
    );
}