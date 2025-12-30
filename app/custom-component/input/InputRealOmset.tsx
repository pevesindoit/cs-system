"use client";

import { useState } from "react";
import { SelectItemData, RealOmsetLogData } from "@/app/types/types";
import { DropDownGrid } from "../DropdownGrid";

// Define Props
interface InputProps {
    onAddData: (data: RealOmsetLogData) => void;
    branches?: SelectItemData[]; // Renamed from platforms to branches
}

export default function InputRealOmset({
    onAddData,
    branches = [], // Default value prevents "undefined" error
}: InputProps) {

    // 1. State
    const [formData, setFormData] = useState<RealOmsetLogData>({
        created_at: new Date().toISOString().split("T")[0],
        branch_id: "",
        total: 0, // Represents "Total Omset Harian"
    });

    // 2. Handle Changes
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;

        setFormData((prev) => {
            // Handle Numeric Field (total)
            if (name === "total") {
                return {
                    ...prev,
                    [name]: value === "" ? 0 : Number(value),
                };
            }
            // Handle Text/Date Fields
            return { ...prev, [name]: value };
        });
    };

    // 3. Handle Submit
    const handleAdd = () => {
        if (!formData.branch_id) return alert("Pilih Cabang");

        // Send to parent
        onAddData(formData);
        console.log(formData, "ini didalam setelah kirim")

        // Reset Form (Keep Date for faster entry, reset total)
        setFormData((prev) => ({
            ...prev,
            total: 0,
        }));
    };

    return (
        <tr className="border-b-2 bg-white">
            {/* 1. TANGGAL (Sticky Left) */}
            <td className="p-0 bg-white z-10 align-middle sticky left-0 border-r">
                <div className="px-1 py-1">
                    <input
                        type="date"
                        name="created_at"
                        value={formData.created_at}
                        onChange={handleChange}
                        className="w-full bg-transparent outline-none focus:bg-gray-50 pl-1"
                    />
                </div>
            </td>

            {/* 2. CABANG (BRANCH) */}
            <td className="p-0 border-r align-middle">
                <div className="px-1">
                    <DropDownGrid
                        items={(branches ?? [])}
                        onValueChange={(value) =>
                            setFormData((prev) => ({ ...prev, branch_id: value }))
                        }
                    />
                </div>
            </td>

            {/* 3. TOTAL OMSET HARIAN */}
            <td className="p-0 border-r align-middle">
                <div className="px-1">
                    <input
                        type="number"
                        name="total"
                        placeholder="0"
                        value={formData.total || ""}
                        onChange={handleChange}
                        className="w-full h-8 px-1 bg-transparent outline-none focus:bg-gray-50 text-right"
                    />
                </div>
            </td>

            {/* 4. ACTION */}
            <td className="p-0 text-center align-middle">
                <div className="flex justify-center items-center h-full hover:bg-gray-100">
                    <button
                        onClick={handleAdd}
                        className="text-[10px] w-full h-full py-2 px-2 text-blue-600 font-bold"
                    >
                        Simpan
                    </button>
                </div>
            </td>
        </tr>
    );
}