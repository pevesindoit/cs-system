"use client";

import { useEffect, useState } from "react";
import InputAdvertiser from "../custom-component/table/InputAdvertiser";
import ListAdvertiser from "../custom-component/table/ListAdvertiser";
import { AdvertiserData, ReusableCsData } from "@/app/types/types";
import { addAdvertise } from "../function/fetch/add/fetch";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { getDataAdvertiserList, getTarget } from "../function/fetch/get/fetch";
import H1 from "../custom-component/H1";


export default function Advertiser({ platforms, branches }: ReusableCsData) {
    const [tableData, setTableData] = useState<AdvertiserData[]>([]);
    const [userId, setUserId] = useState("");
    const [targets, setTargets] = useState<any[]>([]);

    useEffect(() => {
        const getUser = async () => {
            const { data } = await supabaseBrowser.auth.getUser();
            if (data.user) setUserId(data.user.id);
        }
        getUser();
    }, [userId]);

    useEffect(() => {
        if (!userId) return;
        const fetchData = async () => {
            const [res, targetRes] = await Promise.all([
                getDataAdvertiserList(userId),
                getTarget()
            ]);
            
            if (res?.status === 200) {
                setTableData(res?.data.data);
            }
            if (targetRes?.data?.data) {
                setTargets(targetRes.data.data);
            }
        }
        fetchData()
    }, [userId])

    const handleNewData = async (newItem: AdvertiserData) => {
        const payload = { ...newItem, ads_manager_id: userId };
        const res = await addAdvertise(payload);
        if (res?.status === 200 && res.data?.newEntry) {
            setTableData(prev => [res.data.newEntry, ...prev]);
        }
    };

    const handleDelete = (id: string | number) => {
        setTableData(prev => prev.filter(item => String(item.id) !== String(id)));
    };

    const headers = [
        "Tanggal", "Cabang", "Spend", "PPN", "Total Budget",
        "Platform", "Target Leads", "Actual Leads", "Target Omset", "Cost per Lead", "Konversi Google",
        "Cost per Konversi", "Keterangan", "Action",
    ];

    return (
        <div className="w-full py-3 pr-3 pl-3 md:pl-0 relative gap-3">
            <H1>Ads Spend</H1>
            <div className="max-h-[70vh] overflow-auto w-full min-w-max pb-4 border rounded-md border-gray-200">
                {/* SINGLE TABLE WRAPPER */}
                <table className="w-full text-[10px] bg-white border-separate border-spacing-0">

                {/* HEADERS DEFINED HERE */}
                <thead className="bg-gray-50 border-b w-full">
                    <tr>
                        {headers.map((h, i) => {
                            let stickyClass = "sticky top-0 z-20 bg-gray-50";
                            if (i === 0) stickyClass = "sticky top-0 left-0 z-30 bg-gray-50 min-w-[130px] w-[130px] max-w-[130px] outline outline-1 outline-gray-200";
                            if (i === 1) stickyClass = "sticky top-0 left-[130px] z-30 bg-gray-50 min-w-[150px] w-[150px] max-w-[150px] outline outline-1 outline-gray-200";

                            return (
                                <th
                                    key={i}
                                    scope="col"
                                    className={`px-2 py-2 font-medium text-left border-r border-b last:border-r-0 whitespace-nowrap ${stickyClass}`}
                                >
                                    {h}
                                </th>
                            );
                        })}
                    </tr>
                </thead>

                <tbody className="divide-y divide-gray-200">
                    {/* INPUT ROW (Sticky below header) */}
                    {/* We pass the handler here, but it renders a TR inside */}
                    <InputAdvertiser onAddData={handleNewData} platforms={platforms} // Pass prop
                        branches={branches}
                        targets={targets} />

                    {/* DATA ROWS */}
                    {/* We pass the data here, it renders multiple TRs inside */}
                    <ListAdvertiser 
                        data={tableData} 
                        platforms={platforms} 
                        branches={branches} 
                        onDelete={handleDelete} 
                    />
                </tbody>

            </table>
            </div>
        </div>
    );
}