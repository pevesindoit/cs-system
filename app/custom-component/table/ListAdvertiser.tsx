"use client";

import { useState } from "react";
import { AdvertiserData } from "@/app/types/types";
import EditableDate from "../table/EditableDate";
import EditableInput from "../table/EditableInput";
import { updateAdvertiser } from "@/app/function/fetch/update/update-lead/fetch";

export default function ListAdvertiser({ data }: { data: AdvertiserData[] }) {
    const [rows, setRows] = useState<AdvertiserData[]>(data);
    const [prevData, setPrevData] = useState<AdvertiserData[]>(data);

    // Sync State
    if (data !== prevData) {
        setRows(data);
        setPrevData(data);
    }

    const handleSave = async (
        id: string,
        field: string,
        value: string | number
    ) => {
        if (!id) return;

        // --- SPECIAL LOGIC FOR SPEND ---
        if (field === "spend") {
            const newSpend = Number(value);
            // 1. Calculate the new derived values
            const newPPN = Math.round(newSpend * 0.11); // 11% PPN
            const newTotalBudget = newSpend + newPPN;

            // 2. Update UI (Optimistic) - Update BOTH Spend and Total Budget
            setRows((prev) =>
                prev.map((row) =>
                    row.id === id
                        ? { ...row, spend: newSpend, total_budget: newTotalBudget }
                        : row
                )
            );

            // 3. Update Database - VITAL: Update BOTH fields
            // You must call the API twice, or update your API to accept multiple fields.
            // Calling it twice is the easiest fix for now:
            await updateAdvertiser({ id, field: "spend", value: newSpend });
            await updateAdvertiser({ id, field: "total_budget", value: newTotalBudget });
        }

        // --- NORMAL LOGIC FOR OTHER FIELDS ---
        else {
            setRows((prev) =>
                prev.map((row) =>
                    row.id === id ? { ...row, [field]: value } : row
                )
            );
            await updateAdvertiser({ id, field, value });
        }
    };

    if (rows.length === 0) {
        return (
            <tr>
                <td colSpan={12} className="text-center p-4 text-sm text-gray-500">
                    Belum ada data
                </td>
            </tr>
        );
    }

    return (
        <>
            {rows.map((row, index) => {
                const ppn = row.total_budget - row.spend;
                const costPerLead = row.leads > 0 ? row.spend / row.leads : 0;
                const platformName = row.platform?.name || row.platform_id;
                const isGoogle = platformName?.toLowerCase() === 'google';
                // Handle null/undefined conversi_google safely
                const safeConversiGoogle = row.conversi_google || 0;
                const costPerKonversi = safeConversiGoogle > 0 ? row.spend / safeConversiGoogle : 0;

                // ✅ FIX: Force ID to be a string. 
                // This satisfies TypeScript if 'id' is defined as 'string | number' in your types.
                const safeId = String(row.id || "");

                return (
                    <tr key={safeId || index} className="hover:bg-gray-50 border-b last:border-b-0">

                        {/* Date */}
                        <td className="px-2 py-2 border-r whitespace-nowrap sticky left-0 bg-white z-10">
                            <EditableDate
                                value={row.created_at}
                                rowId={safeId} // No longer complains about number vs string
                                field="created_at"
                                onSave={handleSave}
                            />
                        </td>

                        {/* Branch */}
                        <td className="px-2 py-2 border-r whitespace-nowrap">
                            <div className="px-1 py-1">
                                {row.branch?.name}
                            </div>
                        </td>

                        {/* Spend */}
                        <td className="px-2 py-2 border-r whitespace-nowrap text-right">
                            <div className="px-1">
                                <EditableInput<number>
                                    value={row.spend}
                                    rowId={safeId}
                                    field="spend"
                                    isNumeric={true}
                                    isCurrency={true}
                                    onSave={handleSave}
                                />
                            </div>
                        </td>

                        {/* PPN */}
                        <td className="px-2 py-2 border-r whitespace-nowrap text-right">
                            {Number(ppn).toLocaleString("id-ID")}
                        </td>

                        {/* Total Budget */}
                        <td className="px-2 py-2 border-r whitespace-nowrap text-right font-semibold">
                            {Number(row.total_budget).toLocaleString("id-ID")}
                        </td>

                        {/* Platform Name */}
                        <td className="px-2 py-2 border-r whitespace-nowrap uppercase">
                            {platformName}
                        </td>

                        {/* Leads */}
                        <td className="px-2 py-2 border-r whitespace-nowrap text-right">
                            <div className="px-1">
                                <EditableInput<number>
                                    value={row.leads}
                                    rowId={safeId}
                                    field="leads"
                                    isNumeric={true}
                                    onSave={handleSave}
                                />
                            </div>
                        </td>

                        {/* Cost Per Lead */}
                        <td className="px-2 py-2 border-r whitespace-nowrap text-right">
                            {costPerLead.toLocaleString("id-ID")}
                        </td>

                        {/* Google Conversions */}
                        <td className="px-2 py-2 border-r whitespace-nowrap text-right">
                            {isGoogle ? (
                                <div className="px-1">
                                    <EditableInput<number>
                                        value={safeConversiGoogle} // Use safe variable (handles null)
                                        rowId={safeId}
                                        field="conversi_google"
                                        isNumeric={true}
                                        onSave={handleSave}
                                    />
                                </div>
                            ) : '-'}
                        </td>

                        {/* Cost Per Konversi */}
                        <td className="px-2 py-2 border-r whitespace-nowrap text-right">
                            {isGoogle ? costPerKonversi.toLocaleString("id-ID") : '-'}
                        </td>

                        {/* Keterangan */}
                        <td className="px-2 py-2 border-r whitespace-nowrap">
                            <div className="px-1">
                                <EditableInput<string>
                                    value={row.keterangan || ""} // Handle potential null
                                    rowId={safeId}
                                    field="keterangan"
                                    onSave={handleSave}
                                />
                            </div>
                        </td>

                        <td className="px-2 py-2 border-r whitespace-nowrap"></td>
                    </tr>
                );
            })}
        </>
    );
}