"use client"
import { useEffect, useState } from "react";
import H1 from "../custom-component/H1";
import { getReport } from "../function/fetch/get/fetch"; // Ensure ReportItem is imported
import DateRangePicker from "../custom-component/DateRangePicker";
import { ReportItem } from "../types/types";

const GetDefaultate = () => {
    const today = new Date();
    // End date = today
    const end = today.toISOString().split("T")[0];
    // Start date = 30 days before
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    const start = startDate.toISOString().split("T")[0];

    return {
        start_date: start,
        end_date: end,
    };
};

export default function Report() {
    const [range, setRange] = useState(GetDefaultate());
    // 1. Create state to store the incoming report data
    const [reportData, setReportData] = useState([]);
    const [reportSummary, setReportSummary] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const payload: ReportItem = {
                    start_date: range?.start_date,
                    end_date: range?.end_date,

                };

                // 3. Call the API
                const res = await getReport(payload);

                console.log(res?.data.data, "inimi")
                setReportSummary(res?.data.data.summary)

                if (res?.data) {
                    setReportData(res.data.data);
                }
            } catch (error) {
                console.error("Error fetching report:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [range]);

    console.log(range, "inimi")

    if (loading) return <div>Loading Report...</div>;

    return (
        <div className="">
            <H1>Performance Report</H1>
            <DateRangePicker onChange={setRange} />
            {/* 4. Display the Data */}
            <div className="border rounded-[5px] h-full py-10 px-9 bg-[#FEFEFE] gap-8">

            </div>


            {/* Debugging: See raw data */}
        </div>
    );
}