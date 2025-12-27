"use client";

import { getCs } from "@/app/function/fetch/get/fetch";
import { AdvertiserData, itemType } from "@/app/types/types";
import { useEffect, useState } from "react";
import { DropDownGrid } from "../DropdownGrid";

// 2. Define the Props Interface
interface InputProps {
    onAddData: (newItem: AdvertiserData) => void;
}

// 3. Update Component to accept props
export default function InputAdvertiser({ onAddData }: InputProps) {

    // State
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split("T")[0],
        cabang_id: "",
        spend: 0,
        ppn: 0,
        platform_id: "",
        leads: 0,
        konversi_google: 0,
        keterangan: "",
    });

    const [branchs, setBranchs] = useState([]);
    const [platforms, setPlatforms] = useState([]);

    // Helpers & Calculations
    const isGoogle = formData.platform_id === "google";

    // --- LOGIC: Total Budget = Spend + PPN ---
    // This is "derived state". It updates instantly whenever spend or ppn changes.
    const totalBudget = Number(formData.spend) + Number(formData.ppn);

    const costPerLead = formData.leads > 0 ? Math.round(totalBudget / formData.leads) : 0;
    const costPerKonversi = formData.konversi_google > 0 ? Math.round(totalBudget / formData.konversi_google) : 0;

    // Handle Changes
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;

        setFormData((prev) => {
            // 1. Handle Number Fields
            if (["spend", "ppn", "leads", "konversi_google"].includes(name)) {
                const newValue = value === "" ? 0 : Number(value);

                // --- NEW LOGIC: Auto-calculate PPN (12%) when Spend changes ---
                if (name === "spend") {
                    return {
                        ...prev,
                        spend: newValue,
                        // Automatically set PPN to 12% of Spend
                        ppn: Math.round(newValue * 0.11)
                    };
                }

                return {
                    ...prev,
                    [name]: newValue
                };
            }

            // 2. Handle Platform Field (Specific Logic)
            if (name === "platform_id") {
                return {
                    ...prev,
                    platform_id: value,
                    // Reset konversi_google if switching away from google
                    konversi_google: value !== "google" ? 0 : prev.konversi_google
                };
            }

            // 3. Handle Generic String Fields
            return { ...prev, [name]: value };
        });
    };

    // 4. Update Handle Submit
    const handleAdd = () => {
        // Construct the full payload
        const payload: AdvertiserData = {
            ...formData,
            // Ensure types match what your interface expects
            platform_id: formData.platform_id,
            total_budget: totalBudget, // Uses the calculation above
            cost_per_lead: costPerLead,
            cost_per_konversi: costPerKonversi,
        };

        // Send data to Parent
        onAddData(payload);

        // Reset Form
        setFormData({
            date: new Date().toISOString().split("T")[0],
            cabang_id: "",
            spend: 0,
            ppn: 0,
            platform_id: "",
            leads: 0,
            konversi_google: 0,
            keterangan: "",
        });
    };

    useEffect(() => {
        const fetch = async () => {
            const res = await getCs()
            const rawData = res?.data
            const formattedListPlatform = rawData?.ads_platform?.map((item: itemType) => ({
                value: item.id,
                label: item.name,
                classname: item.classname
            })) || [];
            const formattedListBranch = rawData?.branch?.map((item: itemType) => ({
                value: item.id,
                label: item.name,
                classname: item.classname
            })) || [];

            setPlatforms(formattedListPlatform)
            setBranchs(formattedListBranch)
        }
        fetch()
    }, [])

    console.log(formData, "ini data formya")

    return (
        <tr className="border-b-2 bg-white">
            {/* 1. TANGGAL */}
            <td className="p-0 bg-white z-10 align-middle sticky left-0 border-r">
                <div className="px-1 py-1">
                    <input type="date" name="date" value={formData.date} onChange={handleChange} className="w-full bg-transparent outline-none focus:bg-gray-50 pl-1" />
                </div>
            </td>

            {/* 2. CABANG */}
            <td className="p-0 border-r align-middle">
                <div className="px-1">
                    <DropDownGrid
                        items={branchs}
                        onValueChange={(value) =>
                            setFormData((prev) => ({ ...prev, cabang_id: value }))
                        }
                    />
                </div>
            </td>

            {/* 3. SPEND */}
            <td className="p-0 border-r align-middle">
                <div className="px-1">
                    <input type="number" name="spend" placeholder="0" value={formData.spend || ""} onChange={handleChange} className="w-full h-8 px-1 bg-transparent outline-none focus:bg-gray-50 text-right" />
                </div>
            </td>

            {/* 4. PPN */}
            <td className="p-0 border-r align-middle">
                <div className="px-1">
                    <input type="number" name="ppn" placeholder="0" value={formData.ppn || ""} onChange={handleChange} className="w-full h-8 px-1 bg-transparent outline-none focus:bg-gray-50 text-right" />
                </div>
            </td>

            {/* 5. TOTAL BUDGET (Spend + PPN) */}
            <td className="p-0 border-r align-middle bg-gray-50">
                <div className="px-1">
                    <input disabled value={totalBudget.toLocaleString("id-ID")} className="w-full h-8 px-1 bg-transparent outline-none text-gray-500 font-semibold text-right cursor-not-allowed" />
                </div>
            </td>

            {/* 6. PLATFORM */}
            <td className="p-0 border-r align-middle">
                <div className="px-1">
                    <DropDownGrid
                        items={platforms}
                        onValueChange={(value) =>
                            setFormData((prev) => ({ ...prev, platform_id: value }))
                        }
                    />
                </div>
            </td>

            {/* 7. LEADS */}
            <td className="p-0 border-r align-middle">
                <div className="px-1">
                    <input type="number" name="leads" placeholder="0" value={formData.leads || ""} onChange={handleChange} className="w-full h-8 px-1 bg-transparent outline-none focus:bg-gray-50 text-right" />
                </div>
            </td>

            {/* 8. CPL */}
            <td className="p-0 border-r align-middle bg-gray-50">
                <div className="px-1">
                    <input disabled value={costPerLead.toLocaleString("id-ID")} className="w-full h-8 px-1 bg-transparent outline-none text-gray-500 font-semibold text-right cursor-not-allowed" />
                </div>
            </td>

            {/* 9. KONVERSI GOOGLE */}
            <td className={`p-0 border-r align-middle ${!isGoogle ? "bg-gray-100" : ""}`}>
                <div className="px-1">
                    <input type="number" name="konversi_google" placeholder={isGoogle ? "0" : "-"} disabled={!isGoogle} value={isGoogle ? (formData.konversi_google || "") : ""} onChange={handleChange} className={`w-full h-8 px-1 bg-transparent outline-none text-right ${isGoogle ? "focus:bg-gray-50" : "cursor-not-allowed bg-gray-100"}`} />
                </div>
            </td>

            {/* 10. CPK */}
            <td className={`p-0 border-r align-middle ${!isGoogle ? "bg-gray-100" : "bg-gray-50"}`}>
                <div className="px-1">
                    <input disabled value={isGoogle ? costPerKonversi.toLocaleString("id-ID") : "-"} className={`w-full h-8 px-1 bg-transparent outline-none text-gray-500 font-semibold text-right cursor-not-allowed`} />
                </div>
            </td>

            {/* 11. KETERANGAN */}
            <td className="p-0 border-r align-middle">
                <div className="px-1">
                    <input type="text" name="keterangan" value={formData.keterangan} onChange={handleChange} className="w-full h-8 px-1 bg-transparent outline-none focus:bg-gray-50" />
                </div>
            </td>

            {/* 12. ACTION */}
            <td className="p-0 text-center align-middle">
                <div className="flex justify-center items-center h-full hover:bg-gray-100">
                    <button onClick={handleAdd} className="text-[10px] w-full h-full py-2 px-2 text-blue-600 font-bold">
                        Simpan
                    </button>
                </div>
            </td>
        </tr>
    )
}