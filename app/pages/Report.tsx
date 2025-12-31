"use client";

import { useEffect, useState } from "react";
import H1 from "../custom-component/H1";
import { getReport } from "../function/fetch/get/fetch";
import { ReportItem, ReportSummaryData } from "../types/types";
import { ReportSummary } from "../custom-component/table/ReportSummary";
import ReportBranch from "../custom-component/card/ReportBranch";
import DateMountSelector from "../custom-component/formater/DateMountSelector";
import AdsReport from "../custom-component/table/AdsReport";

// Define the interface for the new ads data here or in types.ts
export interface AdsDataRow {
    week: string;
    google_ads: number;
    meta_ads: number;
    tiktok_ads: number;
    total_ads: number;
    omset: number;
    ads_ratio: string;
}

const GetDefaultDate = () => {
    const today = new Date();
    const end = today.toISOString().split("T")[0];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    const start = startDate.toISOString().split("T")[0];

    return {
        start_date: start,
        end_date: end,
    };
};

export default function Report() {
    const [range, setRange] = useState(GetDefaultDate());

    const [reportData, setReportData] = useState<ReportSummaryData | null>(null);
    const [reportBranch, setReportBranch] = useState([]);
    // 1. New State for Ads Data
    const [adsReport, setAdsReport] = useState<AdsDataRow[]>([]);

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!range.start_date || !range.end_date) return;

            try {
                setLoading(true);
                const payload: ReportItem = {
                    start_date: range.start_date,
                    end_date: range.end_date,
                };

                const res = await getReport(payload);

                if (res?.data?.data) {
                    setReportData(res.data.data.summary);
                    setReportBranch(res.data.data.branch_breakdown || []);
                    // 2. Capture the 'ads' array from backend
                    setAdsReport(res.data.data.ads || []);
                }
            } catch (error) {
                console.error("Error fetching report:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [range]);

    if (loading) return <div>Loading Report...</div>;

    return (
        <div className="space-y-6">
            <H1>Manager Report</H1>
            <div className="flex flex-col gap-4">
                <DateMountSelector onChange={setRange} />
            </div>

            <div className="border rounded-[5px] h-full py-10 px-9 bg-[#FEFEFE] gap-8 space-y-8">
                {/* 3. Pass the data to the component */}

                <ReportBranch data={reportBranch} />
                <AdsReport data={adsReport} />
                <ReportSummary data={reportData} />
            </div>
        </div >
    );
}