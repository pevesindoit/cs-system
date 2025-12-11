"use client";

import { useEffect, useState } from "react";
import DashboardCard from "../custom-component/card/DashboardCard";
import H1 from "../custom-component/H1";
import { getDashboardData } from "../function/fetch/get/fetch";
import DateRangePicker from "../custom-component/DateRangePicker";

export default function Dashboard() {
    const [range, setRange] = useState({
        start_date: "",
        end_date: ""
    });
    const [revenue, setRevenue] = useState<number | null>(null);
    const [adsSpend, setAdsSpend] = useState<number | null>(null);
    const [adsRoas, setRoas] = useState<number | null>(null);
    const [adsConvertionRate, setConvertionRate] = useState<number | null>(null);

    console.log(range, "ini rangnya")

    useEffect(() => {
        if (!range.start_date || !range.end_date) return;

        const fetchData = async () => {
            const res = await getDashboardData(range);
            console.log("Dashboard data:", res);
            setRevenue(res?.data.revenue)
            setAdsSpend(res?.data.
                ads_spend)
            setRoas(res?.data.
                roas)
            setConvertionRate(res?.data.
                conversion_rate)
        };

        fetchData();
    }, [range]);

    return (
        <div className="space-y-7">
            <div className="h-full">
                <H1>Dashboard</H1>

                {/* Single Date Picker Component */}
                <DateRangePicker onChange={setRange} />

                <div className="grid grid-cols-2 gap-8 mt-8">
                    <DashboardCard>

                        {/* Stats here */}
                    </DashboardCard>
                </div>
            </div>
        </div>
    );
}
