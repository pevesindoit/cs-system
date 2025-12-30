"use client";

import { useState } from "react";
import { SelectItemData, SocialLogData } from "@/app/types/types";
import { DropDownGrid } from "../DropdownGrid";

// Define Props
interface InputProps {
  onAddData: (data: SocialLogData) => void;
  platforms?: SelectItemData[];
}

export default function InputSocialGrowth({
  onAddData,
  platforms = [], // Fix 1: Default value prevents "undefined" error
}: InputProps) {

  // 1. State
  const [formData, setFormData] = useState<SocialLogData>({
    created_at: new Date().toISOString().split("T")[0],
    platform_id: "",
    followers: 0,
    reach: 0,
    engagement: 0,
    notes: "",
  });

  // 3. Helper for Website Logic
  const isWebsite = formData.platform_id === "Website";

  // 4. Handle Changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setFormData((prev) => {
      // Fix 2: Updated key names to match the input "name" attributes below
      // (Changed 'reach_or_impressions' to 'reach', etc.)
      if (["followers", "reach", "engagement"].includes(name)) {
        return {
          ...prev,
          [name]: value === "" ? 0 : Number(value),
        };
      }
      // Handle Text/Date Fields
      return { ...prev, [name]: value };
    });
  };

  // 5. Handle Submit
  const handleAdd = () => {
    if (!formData.platform_id) return alert("Pilih Platform");

    // Send to parent
    onAddData(formData);

    // Reset Form (Keep Date for faster entry)
    setFormData((prev) => ({
      ...prev,
      followers: 0,
      reach: 0,
      engagement: 0,
      notes: "",
    }));
  };

  return (
    <tr className="border-b-2 bg-white">
      {/* 1. TANGGAL (Sticky Left) */}
      <td className="p-0 bg-white z-10 align-middle sticky left-0 border-r">
        <div className="px-1 py-1">
          <input
            type="date"
            name="created_at" // Changed from entry_date to match state key
            value={formData.created_at}
            onChange={handleChange}
            className="w-full bg-transparent outline-none focus:bg-gray-50 pl-1"
          />
        </div>
      </td>

      {/* 2. PLATFORM */}
      <td className="p-0 border-r align-middle">
        <div className="px-1">
          <DropDownGrid
            // Fix 4: Ensure it's never undefined and cast to 'any' to bypass 
            // the strict type check between SelectItemData and Item
            items={(platforms ?? [])}
            onValueChange={(value) =>
              setFormData((prev) => ({ ...prev, platform_id: value }))
            }
          />
        </div>
      </td>

      {/* 3. FOLLOWERS */}
      <td
        className={`p-0 border-r align-middle ${isWebsite ? "bg-gray-100" : ""
          }`}
      >
        <div className="px-1">
          <input
            type="number"
            name="followers"
            placeholder={isWebsite ? "-" : "0"}
            disabled={isWebsite}
            value={isWebsite ? "" : formData.followers || ""}
            onChange={handleChange}
            className={`w-full h-8 px-1 bg-transparent outline-none text-right ${isWebsite ? "cursor-not-allowed" : "focus:bg-gray-50"
              }`}
          />
        </div>
      </td>

      {/* 4. REACH / IMPRESSIONS */}
      <td className="p-0 border-r align-middle">
        <div className="px-1">
          <input
            type="number"
            name="reach"
            placeholder="0"
            value={formData.reach || ""}
            onChange={handleChange}
            className="w-full h-8 px-1 bg-transparent outline-none focus:bg-gray-50 text-right"
          />
        </div>
      </td>

      {/* 5. ENGAGEMENT / CLICKS */}
      <td className="p-0 border-r align-middle">
        <div className="px-1">
          <input
            type="number"
            name="engagement"
            placeholder="0"
            value={formData.engagement || ""}
            onChange={handleChange}
            className="w-full h-8 px-1 bg-transparent outline-none focus:bg-gray-50 text-right"
          />
        </div>
      </td>

      {/* 6. NOTES */}
      <td className="p-0 border-r align-middle">
        <div className="px-1">
          <input
            type="text"
            name="notes"
            placeholder="Keterangan..."
            value={formData.notes}
            onChange={handleChange}
            className="w-full h-8 px-1 bg-transparent outline-none focus:bg-gray-50"
          />
        </div>
      </td>

      {/* 7. ACTION */}
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