"use client"
import { useEffect, useState } from "react";
import DateRangePicker from "../custom-component/DateRangePicker";
import H1 from "../custom-component/H1";
import { getAdsPerformance, getBranch } from "../function/fetch/get/fetch";
import { useAuth } from "../custom-component/global/AuthProfider";
import { useRouter } from "next/navigation";
import { DropDownLeads } from "../custom-component/DropDownLeads";
import { AdsPerformanceCard } from "../custom-component/card/AdsPerformanceCard";
import { itemType } from "@/app/types/types";

const GetDefaultDate = () => {
    const today = new Date();
    const end = today.toISOString().split("T")[0];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    const start = startDate.toISOString().split("T")[0];
    return { start_date: start, end_date: end };
};

export function AdsPerformancePage() {
    const [range, setRange] = useState(GetDefaultDate());
    const [branchs, setBranchs] = useState<{value: string, label: string, className: string}[]>([]);
    const [branch, setBranch] = useState<string>("");

    const [adsPerformanceData, setAdsPerformanceData] = useState([]);
    
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();

    // Auth Check
    useEffect(() => {
        if (!authLoading && !user) {
            router.push("/login");
        }
    }, [user, authLoading, router]);

    // Initial Fetch Options (Branches)
    useEffect(() => {
        const fetchOptions = async () => {
            const branchRes = await getBranch();
            if (branchRes?.data?.data) {
                const formattedListBranch = branchRes.data.data.map((item: itemType) => ({
                    value: item.id,
                    label: item.name,
                    className: item.classname || ""
                }));
                setBranchs(formattedListBranch);
            }
        };
        fetchOptions();
    }, []);

    // Fetch Ads Performance Data
    useEffect(() => {
        const fetchPerformance = async () => {
            const payload = {
                start_date: range.start_date,
                end_date: range.end_date,
                branch: branch
            };
            const res = await getAdsPerformance(payload);
            
            if (res?.data?.adsPerformance) {
                setAdsPerformanceData(res.data.adsPerformance);
            }
        };
        fetchPerformance();
    }, [range, branch]);

    return (
        <div className="space-y-7 pb-10">
            <div className="h-full">
                <H1>Ads Performance</H1>
                <div className="space-y-4">
                    {/* Filter Section */}
                    <div className="md:flex md:space-x-3 items-center">
                        <DateRangePicker value={range} onChange={setRange} />
                        <div className="grid md:grid-cols-2 w-full max-w-md gap-3">
                            <DropDownLeads
                                items={branchs}
                                value={branch as any}
                                onValueChange={setBranch}
                                placeholder="Select Branch..." />
                        </div>
                    </div>

                    {/* Analytics Section */}
                    <div className="grid grid-cols-1 gap-4">
                        <div className="w-full">
                            <AdsPerformanceCard data={adsPerformanceData} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
