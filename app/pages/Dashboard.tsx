"use client";

import { useEffect, useState } from "react";
import DashboardCard from "../custom-component/card/DashboardCard";
import H1 from "../custom-component/H1";
import { getDashboardData } from "../function/fetch/get/fetch";
import DateRangePicker from "../custom-component/DateRangePicker";
import { Calculator, Divide, DollarSign, TrendingUp } from "lucide-react";
import LeadsSource from "../custom-component/card/LeadsSource";
import { LeadsTableManager } from "../custom-component/table/LeadsTableManager";

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

type LeadSourceDetail = {
    count: number;
    percentage: number;
};

export default function Dashboard() {
    const [range, setRange] = useState(GetDefaultate());
    const [revenue, setRevenue] = useState<string>("");
    const [adsSpend, setAdsSpend] = useState<string>("");
    const [adsRoas, setRoas] = useState<string>("");
    const [adsConvertionRate, setConvertionRate] = useState<string>("");
    const [leadsSource, setLeadsSource] = useState<Record<string, LeadSourceDetail>>({});

    useEffect(() => {
        if (!range.start_date || !range.end_date) return;

        const fetchData = async () => {
            const res = await getDashboardData(range);
            const revenueFormatter = Number(res?.data?.revenue || 0).toLocaleString("id-ID");
            const adsSpendFormatter = Number(res?.data?.ads_spend || 0).toLocaleString("id-ID");
            const roasFormatter = Number(res?.data?.roas || 0).toFixed(2);
            const convertionRateFormater = Number(res?.data?.conversion_rate || 0).toFixed(2);
            setRevenue(`Rp ${revenueFormatter}`)
            setAdsSpend(`Rp ${adsSpendFormatter}`)
            setRoas(`${roasFormatter}x`)
            setConvertionRate(`${convertionRateFormater}%`)
            setLeadsSource(res?.data.lead_sources
            )
        };

        fetchData();
    }, [range]);

    return (
        <div className="space-y-7">
            <div className="h-full">
                <H1>Dashboard</H1>

                {/* Single Date Picker Component */}
                <DateRangePicker onChange={setRange} />
                <div className="space-y-8">
                    <div className="pt-4 md:grid md:grid-cols-[60%_37%] md:gap-6 space-x-2">
                        <div className="md:grid md:grid-cols-2 md:gap-8">
                            <DashboardCard
                                label="Total Revenue"
                                value={revenue}
                                subLabel="Dari Closing"
                                icon={<DollarSign size={30} />}>
                            </DashboardCard>
                            <DashboardCard
                                label="Total Pengeluaran Iklan"
                                value={adsSpend}
                                subLabel="Dari Semua  Platform"
                                icon={<Calculator size={30} />}>
                            </DashboardCard>
                            <DashboardCard
                                label="ROAS"
                                value={adsRoas}
                                subLabel="Revenue / Spending"
                                icon={<Divide size={30} />}>
                            </DashboardCard>
                            <DashboardCard
                                label="Convertion Rate"
                                value={adsConvertionRate}
                                subLabel="1 dari 4 leads"
                                icon={<TrendingUp size={30} />}>
                            </DashboardCard>
                        </div>
                        <LeadsSource data={leadsSource} />
                    </div>
                </div>
            </div>
        </div >
    );
}
