"use client"
import { useEffect, useState } from "react";
import DateRangePicker from "../custom-component/DateRangePicker";
import H1 from "../custom-component/H1";
import { LeadsTableManager } from "../custom-component/table/LeadsTableManager";
import { getCs, getCsPerformance, getFilterData } from "../function/fetch/get/fetch";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { useRouter } from "next/navigation";
import { DropDownLeads } from "../custom-component/DropDownLeads";

// ✅ FIX 1: Removed curly braces { } because ChartCard is likely a default export
import { ChartCard } from "../custom-component/table/ChartCard";

// ✅ FIX 2: These are correct as Named Exports (keep the curly braces)
import { Pagination } from "../custom-component/table/Pagination";
import { CsPerformanceCard } from "../custom-component/card/CsPerformanceCard";

import { itemType } from "@/app/types/types";

const GetDefaultate = () => {
    const today = new Date();
    const end = today.toISOString().split("T")[0];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    const start = startDate.toISOString().split("T")[0];
    return { start_date: start, end_date: end };
};

export function CsPerformance() {
    const [range, setRange] = useState(GetDefaultate());
    const [css, setCss] = useState([]);
    const [cs, setCs] = useState<string>("");
    const [branchs, setBranchs] = useState([]);
    const [branch, setBranch] = useState<string>("");

    // Data States
    const [totalLeads, setTotalLeads] = useState<Record<string, number>>({});
    const [chart, setChart] = useState([]);
    const [scPerformance, setScPerformance] = useState([]);
    const [data, setData] = useState([]);

    // Pagination States
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [totalItems, setTotalItems] = useState(0);
    const LIMIT = 10;

    const router = useRouter();
    const [statusSelected, setStatusSelected] = useState("");
    const [user, setUser] = useState("");

    // Auth Check
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

    // Initial Fetch (Options)
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

    // Filter Fetch (Main Data Loop)
    useEffect(() => {
        const rangeWithFilter = {
            ...range,
            cs,
            branch,
            status: statusSelected,
            page: currentPage,
            limit: LIMIT
        };

        const fetchFilter = async () => {
            const res = await getCsPerformance(rangeWithFilter);

            // 1. Table Data
            setData(res?.data.leads || []);

            // 2. Pagination Data
            if (res?.data.pagination) {
                setTotalPages(res.data.pagination.totalPages);
                setTotalItems(res.data.pagination.totalItems);
            }

            // 3. Analytics
            setTotalLeads(res?.data.statusCounts || {});
            setChart(res?.data.chartData || []);
            setScPerformance(res?.data.scPerformance || []);
        };
        fetchFilter();
    }, [range, cs, branch, statusSelected, currentPage]);

    // Reset to page 1 if filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [range, cs, branch, statusSelected]);

    return (
        <div className="space-y-7 pb-10">
            <div className="h-full">
                <H1>Leads Management</H1>
                <div className="space-y-4">

                    {/* Filter Section */}
                    <div className="md:flex md:space-x-3">
                        <DateRangePicker onChange={setRange} />
                        <div className="grid md:grid-cols-3 w-full gap-3">
                            <DropDownLeads
                                items={css}
                                onValueChange={setCs}
                                placeholder="Select CS..." />
                            <DropDownLeads
                                items={branchs}
                                onValueChange={setBranch}
                                placeholder="Select Branch..." />
                        </div>
                    </div>

                    {/* Status Cards */}
                    <div className="bg-white rounded-[10px] py-7 px-8 border overflow-hidden text-[.7rem]">
                        <div className="grid md:grid-cols-6 grid-cols-2 gap-2">
                            {Object.entries(totalLeads).map(([status, total]) => (
                                <div
                                    key={status}
                                    onClick={() => setStatusSelected(status === statusSelected ? "" : status)}
                                    className={`flex justify-between border rounded-[10px] py-10 px-5 cursor-pointer transition-colors ${status === statusSelected ? "bg-green-200 border-green-400" : "bg-white hover:bg-gray-50"
                                        }`}
                                >
                                    <p className="capitalize font-bold">{status}</p>
                                    <p>{total}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Analytics Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        <div className="lg:col-span-2">
                            <ChartCard data={chart} />
                        </div>
                        <div className="lg:col-span-1">
                            <CsPerformanceCard data={scPerformance} />
                        </div>
                    </div>

                    {/* Table & Pagination */}
                    <div>
                        <LeadsTableManager data={data} />

                        <div className="mt-4">
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                totalItems={totalItems}
                                onPageChange={(page) => setCurrentPage(page)}
                            />
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}