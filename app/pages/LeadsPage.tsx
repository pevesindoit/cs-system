"use client"
import { useEffect, useState } from "react";
import DateRangePicker from "../custom-component/DateRangePicker";
import H1 from "../custom-component/H1";
import { LeadsTableManager } from "../custom-component/table/LeadsTableManager";
import { getCs, getFilterData } from "../function/fetch/get/fetch";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { useRouter } from "next/navigation";
import { DropDownLeads } from "../custom-component/DropDownLeads";
import { ChartCard } from "../custom-component/table/ChartCard";
import { itemType } from "@/app/types/types"

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

export function LeadsPage() {
    const [range, setRange] = useState(GetDefaultate());
    const [css, setCss] = useState([]);
    const [cs, setCs] = useState<string>("");
    const [branchs, setBranchs] = useState([]);
    const [branch, setBranch] = useState<string>("");
    const [totalLeads, setTotalLeads] = useState<Record<string, number>>({});
    const [chart, setChart] = useState([])
    const router = useRouter()
    const [data, setData] = useState([])
    const [user, setUser] = useState("")

    useEffect(() => {
        async function loadUser() {
            try {
                const { data } = await supabaseBrowser.auth.getUser();

                if (!data?.user) {
                    router.push("/login");
                    return;
                }
                setUser(data.user.id);
            } catch (error) {
                console.log(error)
            }
        }
        loadUser();
    }, [router]);

    useEffect(() => {
        const fetch = async () => {
            const res = await getCs()
            const rawData = res?.data
            const formattedListPlatform = rawData.cs.map((item: itemType) => ({
                value: item.id,
                label: item.name,
                classname: item.classname
            }));
            const formattedListBranch = rawData.branch.map((item: itemType) => ({
                value: item.id,
                label: item.name,
                classname: item.classname
            }));
            setCss(formattedListPlatform)
            setBranchs(formattedListBranch)
        }
        fetch()
    }, [])

    //filter the leads
    useEffect(() => {
        const rangeWithFilter = {
            ...range,
            cs,
            branch,
        };

        const fetchFilter = async () => {
            const res = await getFilterData(rangeWithFilter)
            setData(res?.data.leads)
            setTotalLeads(res?.data.statusCounts)
            setChart(res?.data.chartData)
        }
        fetchFilter()
    }, [range, cs, branch])

    return (
        <div className="space-y-7">
            <div className="h-full">
                <H1>Leads Management</H1>
                <div className="space-y-4">
                    <div className="flex space-x-3">
                        <DateRangePicker onChange={setRange} />
                        <div className="grid grid-cols-3 w-full gap-3">
                            <DropDownLeads
                                items={css}
                                onValueChange={(val) => {
                                    console.log("Selected ID:", val); // val is a number here
                                    setCs(val);
                                }}
                                placeholder="Select status..." />

                            <DropDownLeads
                                items={branchs}
                                onValueChange={(val) => {
                                    console.log("Selected ID:", val); // val is a number here
                                    setBranch(val);
                                }}
                                placeholder="Select status..." />
                        </div>
                    </div>

                    <div className="bg-white rounded-[10px] py-7 px-8 border overflow-hidden text-[.7rem]">
                        <div className="grid grid-cols-6 gap-2">
                            {Object.entries(totalLeads).map(([status, total]) => (
                                <div key={status} className="flex justify-between border rounded-[10px] py-10 px-5">
                                    <p className="capitalize font-bold">{status}</p>
                                    <p>{total}</p>
                                </div>
                            ))}
                        </div>

                    </div>
                    <ChartCard data={chart} />
                    <LeadsTableManager data={data} />
                </div>
            </div>
        </div>
    )
}