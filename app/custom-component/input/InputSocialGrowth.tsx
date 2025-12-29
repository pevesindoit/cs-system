"use client";

import { useState } from "react";
import { SocialLogData } from "@/app/types/types";
import { DropDownGrid } from "../DropdownGrid";

// Define Props
interface InputProps {
  onAddData: (data: SocialLogData) => void;
}

export default function InputSocialGrowth({ onAddData }: InputProps) {
  // 1. State
  const [formData, setFormData] = useState<SocialLogData>({
    entry_date: new Date().toISOString().split("T")[0],
    platform: "",
    followers: 0,
    reach_or_impressions: 0,
    engagement_or_clicks: 0,
    notes: "",
  });

  // 2. Static Data for Dropdown
  const platforms = [
    {
      value: "Instagram",
      label: "Instagram",
      classname: "text-pink-600 font-semibold",
    },
    { value: "TikTok", label: "TikTok", classname: "text-black font-semibold" },
    {
      value: "Facebook",
      label: "Facebook",
      classname: "text-blue-700 font-semibold",
    },
    {
      value: "Website",
      label: "Website",
      classname: "text-green-600 font-semibold",
    },
  ];

  // 3. Helper for Website Logic
  const isWebsite = formData.platform === "Website";

  // 4. Handle Changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setFormData((prev) => {
      // Handle Number Fields
      if (
        ["followers", "reach_or_impressions", "engagement_or_clicks"].includes(
          name
        )
      ) {
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
    if (!formData.platform) return alert("Pilih Platform");

    // Send to parent
    onAddData(formData);

    // Reset Form (Keep Date for faster entry)
    setFormData((prev) => ({
      ...prev,
      followers: 0,
      reach_or_impressions: 0,
      engagement_or_clicks: 0,
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
            name="entry_date"
            value={formData.entry_date}
            onChange={handleChange}
            className="w-full bg-transparent outline-none focus:bg-gray-50 pl-1"
          />
        </div>
      </td>

      {/* 2. PLATFORM */}
      <td className="p-0 border-r align-middle">
        <div className="px-1">
          <DropDownGrid
            items={platforms}
            onValueChange={(value) =>
              setFormData((prev) => ({ ...prev, platform: value }))
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
            name="reach_or_impressions"
            placeholder="0"
            value={formData.reach_or_impressions || ""}
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
            name="engagement_or_clicks"
            placeholder="0"
            value={formData.engagement_or_clicks || ""}
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
