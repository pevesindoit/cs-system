"use client";

import { useState } from "react";
import { RealOmsetLogData, SelectItemData } from "@/app/types/types";

// Imports for Editable Table Components
import EditableDate from "../table/EditableDate";
import EditableInput from "../table/EditableInput";
import EditableSelect from "../table/EditableDropdown";
import { updateRealOmset, deleteRealOmset } from "@/app/function/fetch/update/update-lead/fetch";

// IMPORTANT: Import your update function here.
// You need to create this file based on your project structure

interface Props {
    data: RealOmsetLogData[];
    branches: SelectItemData[];
}

export default function ListRealOmset({ data, branches }: Props) {
    const [rows, setRows] = useState<RealOmsetLogData[]>(data);
    const [prevData, setPrevData] = useState<RealOmsetLogData[]>(data);

    // 1. Sync State with Props (Server Data)
    if (data !== prevData) {
        setRows(data);
        setPrevData(data);
    }

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
        await updateRealOmset({ id, field, value });
        console.log(`Saving ${field}: ${value} for ID: ${id}`);
    };

    const handleDelete = async (id: string) => {
        if (!id) return;

        if (confirm("Are you sure you want to delete this entry?")) {
            // Update Local State (Optimistic UI)
            setRows((prev) => prev.filter((row) => String(row.id) !== id));

            try {
                // Update Database
                await deleteRealOmset(id);
                console.log(`Deleted entry with ID: ${id}`);
            } catch (error) {
                console.error("Failed to delete entry:", error);
                // Revert state on error (optional, but good practice)
                setRows(prevData);
                alert("Failed to delete entry. Please try again.");
            }
        }
    };

    if (!rows || rows.length === 0) {
        return (
            <tr>
                <td colSpan={4} className="text-center py-4 text-gray-400">
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

                        {/* 2. Branch (Cabang) */}
                        <td className="px-2 py-2 border-r whitespace-nowrap">
                            <EditableSelect<string>
                                value={item.branch_id ?? undefined}
                                rowId={safeId}
                                field="branch_id"
                                options={branches.map((c) => ({
                                    label: c.label,
                                    value: String(c.value),
                                    className: c.classname,
                                }))}
                                onSave={handleSave}
                            />
                        </td>

                        {/* 3. Total Omset Harian (total) */}
                        <td className="px-2 py-2 border-r whitespace-nowrap text-right">
                            <div className="px-1">
                                <EditableInput<number>
                                    value={item.total}
                                    rowId={safeId}
                                    field="total"
                                    isNumeric={true}
                                    isCurrency={true}
                                    onSave={handleSave}
                                />
                            </div>
                        </td>

                        {/* 4. Action */}
                        <td className="px-2 py-2 border-b text-center align-middle">
                            <button
                                onClick={() => handleDelete(safeId)}
                                className="text-gray-400 hover:text-red-500 text-sm"
                            >
                                Delete
                            </button>
                        </td>
                    </tr>
                );
            })}
        </>
    );
}