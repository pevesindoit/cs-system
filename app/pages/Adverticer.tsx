"use client";

import { useEffect, useState } from "react";
import InputAdvertiser from "../custom-component/table/InputAdvertiser";
import ListAdvertiser from "../custom-component/table/ListAdvertiser";
import { AdvertiserData, ReusableCsData } from "@/app/types/types";
import { addAdvertise } from "../function/fetch/add/fetch";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { getDataAdvertiserList } from "../function/fetch/get/fetch";
import H1 from "../custom-component/H1";


export default function Advertiser({ platforms, branches }: ReusableCsData) {
    const [tableData, setTableData] = useState<AdvertiserData[]>([]);
    const [userId, setUserId] = useState("");

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
            const res = await getDataAdvertiserList(userId)
            if (res?.status === 200) {
                setTableData(res?.data.data);
            }
        }
        fetchData()
    }, [userId])

    const handleNewData = async (newItem: AdvertiserData) => {
        const payload = { ...newItem, ads_manager_id: userId };
        const res = await addAdvertise(payload);
        console.log(res?.data.allLeads, "inimi datanya")
        if (res?.status === 200) {
            setTableData(res?.data.allLeads);
        }
    };

    const headers = [
        "Tanggal", "Cabang", "Spend", "PPN", "Total Budget",
        "Platform", "Target Leads", "Target Omset", "Cost per Lead", "Konversi Google",
        "Cost per Konversi", "Keterangan", "Action",
    ];

    return (
        <div className="w-full py-3 pr-3 pl-3 md:pl-0 relative gap-3 overflow-x-auto md:overflow-x-visible no-scrollbar min-w-max">
            {/* SINGLE TABLE WRAPPER */}
            <H1>Ads Spend</H1>
            <table className="w-full border rounded-md text-[10px] bg-white border-separate border-spacing-0">

                {/* HEADERS DEFINED HERE */}
                <thead className="bg-gray-50 border-b w-full">
                    <tr>
                        {headers.map((h, i) => (
                            <th
                                key={i}
                                scope="col"
                                className={`px-2 py-2 font-medium text-left border-r border-b last:border-r-0 whitespace-nowrap ${i === 0 ? "sticky left-0 z-20 bg-gray-50" : ""}`}
                            >
                                {h}
                            </th>
                        ))}
                    </tr>
                </thead>

                <tbody className="divide-y divide-gray-200">
                    {/* INPUT ROW (Sticky below header) */}
                    {/* We pass the handler here, but it renders a TR inside */}
                    <InputAdvertiser onAddData={handleNewData} platforms={platforms} // Pass prop
                        branches={branches} />

                    {/* DATA ROWS */}
                    {/* We pass the data here, it renders multiple TRs inside */}
                    <ListAdvertiser data={tableData} platforms={platforms} // Pass prop
                        branches={branches} />
                </tbody>

            </table>
        </div>
    );
}