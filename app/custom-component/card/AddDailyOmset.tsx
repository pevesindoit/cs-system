"use client"
import { useEffect, useState } from "react";
import H1 from "../H1"
import { itemType, ReusableCsData, SelectItemData, SocialLogData } from "@/app/types/types";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import InputSocialGrowth from "../input/InputSocialGrowth";
import ListSocialGrowth from "../input/ListSocialGrowth";
import { addSocialMediaGrowth } from "@/app/function/fetch/add/fetch";
import { getCs, getSocialMediaGrowth } from "@/app/function/fetch/get/fetch";

export default function AddDailyOmset({ platforms, branches }: ReusableCsData) {
    const [tableData, setTableData] = useState<SocialLogData[]>([]);
    const [userId, setUserId] = useState("");

    // 1. Get User ID
    useEffect(() => {
        const getUser = async () => {
            const { data } = await supabaseBrowser.auth.getUser();
            if (data.user) setUserId(data.user.id);
        }
        getUser();
    }, []);

    // 2. Fetch Data when UserId exists
    useEffect(() => {
        if (!userId) return;
        const fetchData = async () => {
            const res = await getSocialMediaGrowth(userId)
            console.log(res, "ini sisinasdk")
            if (res?.status === 200) {
                setTableData(res?.data.data);
            }
        }
        fetchData()
    }, [userId])

    // 3. Handle Add New Data
    const handleNewData = async (newItem: SocialLogData) => {
        const payload = { ...newItem, user_id: userId };
        const res = await addSocialMediaGrowth(payload);
        console.log(res?.data.allLeads, "ini bede")
        if (res?.status === 200) {
            setTableData(res?.data.allLeads);
        }
    };

    const headers = [
        "Tanggal",
        "Platform",
        "Followers",
        "Reach / Views",
        "Engage / Clicks",
        "Notes",
        "Action"
    ];

    return (
        <div className="w-full py-3 pr-3 pl-3 md:pl-0 relative gap-3 overflow-x-auto md:overflow-x-visible no-scrollbar min-w-max">
            {/* SINGLE TABLE WRAPPER */}
            <H1>Social Media Growth</H1>
            <table className="w-full border rounded-md text-[10px] bg-white border-separate border-spacing-0">

                {/* HEADERS */}
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
                    {/* INPUT ROW */}
                    <InputSocialGrowth onAddData={handleNewData} platforms={platforms} />

                    {/* DATA ROWS */}
                    <ListSocialGrowth data={tableData} />
                </tbody>

            </table>
        </div>
    );

}