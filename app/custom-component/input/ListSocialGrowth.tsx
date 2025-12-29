"use client";

import { useEffect, useState } from "react";
import { itemType, SelectItemDataInt, SocialLogData } from "@/app/types/types";
import { getCs } from "@/app/function/fetch/get/fetch";

// Imports for Editable Table Components
import EditableDate from "../table/EditableDate";
import EditableInput from "../table/EditableInput";
import EditableSelect from "../table/EditableDropdown";

// IMPORTANT: Import your update function here. 
// If you haven't created it yet, creates a file similar to 'updateAdvertiser'
// import { updateSocialGrowth } from "@/app/function/fetch/update/update-social/fetch"; 

interface Props {
    data: SocialLogData[];
}

export default function ListSocialGrowth({ data }: Props) {
    const [rows, setRows] = useState<SocialLogData[]>(data);
    const [prevData, setPrevData] = useState<SocialLogData[]>(data);
    const [platforms, setPlatforms] = useState<SelectItemDataInt[]>([]);

    // 1. Sync State with Props (Server Data)
    if (data !== prevData) {
        setRows(data);
        setPrevData(data);
    }

    // 2. Fetch Dropdown Options
    useEffect(() => {
        const fetch = async () => {
            const res = await getCs();
            const rawData = res?.data;
            const formattedListPlatform = rawData.platform.map((item: itemType) => ({
                value: item.id,
                label: item.name,
                classname: item.classname,
            }));
            setPlatforms(formattedListPlatform);
        };
        fetch();
    }, []);

    // 3. Handle Save (Update Logic)
    const handleSave = async (
        id: string,
        field: string,
        value: string | number
    ) => {
        if (!id) return;

        // Update Local State (Optimistic UI)
        setRows((prev) =>
            prev.map((row) =>
                // Compare IDs (ensure types match)
                String(row.id) === id
                    ? { ...row, [field]: value }
                    : row
            )
        );

        // Update Database
        // Make sure to create this function in your API functions folder
        // await updateSocialGrowth({ id, field, value }); 
        console.log(`Saving ${field}: ${value} for ID: ${id}`); // Placeholder log
    };

    if (!rows || rows.length === 0) {
        return (
            <tr>
                <td colSpan={7} className="text-center py-4 text-gray-400">
                    No data available.
                </td>
            </tr>
        );
    }

    return (
        <>
            {rows.map((item, index) => {
                // Ensure ID is a string for the Editable components
                const safeId = String(item.id || "");

                return (
                    <tr
                        key={safeId || index}
                        className="hover:bg-gray-50 transition-colors group border-b last:border-b-0"
                    >
                        {/* 1. Date - Sticky */}
                        <td className="px-2 py-2 border-r whitespace-nowrap sticky left-0 bg-white z-10 group-hover:bg-gray-50">
                            <EditableDate
                                value={item.created_at || ""}
                                rowId={safeId}
                                field="created_at"
                                onSave={handleSave}
                            />
                        </td>

                        {/* 2. Platform */}
                        <td className="px-2 py-2 border-r whitespace-nowrap">
                            <EditableSelect<string>
                                value={item.platform_id ?? undefined}
                                rowId={safeId}
                                field="platform_id"
                                options={platforms.map((c) => ({
                                    label: c.label,
                                    value: String(c.value),
                                    className: c.classname, // This preserves your colors (text-pink-600, etc.)
                                }))}
                                onSave={handleSave}
                            />
                        </td>

                        {/* 3. Followers */}
                        <td className="px-2 py-2 border-r whitespace-nowrap text-right">
                            <div className="px-1">
                                <EditableInput<number>
                                    value={item.followers}
                                    rowId={safeId}
                                    field="followers"
                                    isNumeric={true}
                                    onSave={handleSave}
                                />
                            </div>
                        </td>

                        {/* 4. Reach */}
                        <td className="px-2 py-2 border-r whitespace-nowrap text-right">
                            <div className="px-1">
                                <EditableInput<number>
                                    value={item.reach}
                                    rowId={safeId}
                                    field="reach"
                                    isNumeric={true}
                                    onSave={handleSave}
                                />
                            </div>
                        </td>

                        {/* 5. Engagement */}
                        <td className="px-2 py-2 border-r whitespace-nowrap text-right">
                            <div className="px-1">
                                <EditableInput<number>
                                    value={item.engagement}
                                    rowId={safeId}
                                    field="engagement"
                                    isNumeric={true}
                                    onSave={handleSave}
                                />
                            </div>
                        </td>

                        {/* 6. Notes */}
                        <td className="px-2 py-2 border-r whitespace-nowrap">
                            <div className="px-1">
                                <EditableInput<string>
                                    value={item.notes || ""}
                                    rowId={safeId}
                                    field="notes"
                                    onSave={handleSave}
                                />
                            </div>
                        </td>

                        {/* 7. Action */}
                        <td className="px-2 py-2 border-b text-center align-middle">
                            <button className="text-gray-400 hover:text-red-500 text-sm">
                                Delete
                            </button>
                        </td>
                    </tr>
                );
            })}
        </>
    );
}