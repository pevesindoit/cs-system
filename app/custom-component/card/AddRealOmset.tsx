"use client"
import { useEffect, useState } from "react";
import H1 from "../H1"
// Ensure you have a type definition for your Omset Data (e.g., RealOmsetLogData)
import { itemType, RealOmsetLogData, SelectItemData } from "@/app/types/types";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

// You will need to create these two components based on your SocialGrowth inputs
import InputRealOmset from "../input/InputRealOmset";
import ListRealOmset from "../input/ListRealOmset";

// Ensure these fetch functions exist in your backend logic
import { addRealOmset } from "@/app/function/fetch/add/fetch";
import { getCs, getRealOmset } from "@/app/function/fetch/get/fetch";

export default function AddRealOmset() {
    const [tableData, setTableData] = useState<RealOmsetLogData[]>([]);
    const [userId, setUserId] = useState("");
    const [branches, setBranches] = useState<SelectItemData[]>([]);

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
            // Assumes you have a getRealOmset function
            const res = await getRealOmset(userId)
            if (res?.status === 200) {
                setTableData(res?.data.data);
            }
        }
        fetchData()
    }, [userId])

    // 3. Handle Add New Data
    const handleNewData = async (newItem: RealOmsetLogData) => {
        const payload = { ...newItem, user_id: userId };
        // Assumes you have an addRealOmset function
        const res = await addRealOmset(payload);
        if (res?.status === 200) {
            setTableData(res?.data.allOmset); // Adjust based on your API response key
        }
    };

    const headers = [
        "Tanggal",
        "Cabang",
        "Total Omset Harian",
        "Action"
    ];

    // 4. Fetch Branch Data (Cabang)
    useEffect(() => {
        const fetch = async () => {
            const res = await getCs()
            const rawData = res?.data

            // Assuming getCs returns a 'cabang' array. If it's different, adjust here.
            const formattedListBranches = rawData.branch ? rawData.branch.map((item: itemType) => ({
                value: item.id,
                label: item.name,
                classname: item.classname
            })) : [];
            console.log(branches, "")

            setBranches(formattedListBranches)
        }
        fetch()
    }, [])

    return (
        <div className="w-full py-3 pr-3 pl-3 md:pl-0 relative gap-3 overflow-x-auto md:overflow-x-visible no-scrollbar min-w-max">
            {/* SINGLE TABLE WRAPPER */}
            <H1>Real Omset Harian</H1>
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
                    {/* INPUT ROW - Passing branches instead of platforms */}
                    <InputRealOmset onAddData={handleNewData} branches={branches} />

                    {/* DATA ROWS */}
                    <ListRealOmset data={tableData} />
                </tbody>

            </table>
        </div>
    );
}