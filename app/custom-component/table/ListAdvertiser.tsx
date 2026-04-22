"use client";

import { useState } from "react";
import { AdvertiserData, SelectItemData } from "@/app/types/types";
import EditableDate from "../table/EditableDate";
import EditableInput from "../table/EditableInput";
import { updateAdvertiser } from "@/app/function/fetch/update/update-lead/fetch";
import { deleteAdvertiserData } from "@/app/function/fetch/delete/fetch";
import EditableSelect from "./EditableDropdown";
import { Trash2 } from "lucide-react";

// 1. Update Interface to accept platforms and branches from parent
interface Props {
    data: AdvertiserData[];
    platforms: SelectItemData[];
    branches: SelectItemData[];
    onDelete?: (id: string | number) => void;
}

export default function ListAdvertiser({ data, platforms, branches, onDelete }: Props) {
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
                    String(row.id) === id // Ensure consistent ID comparison
                        ? { ...row, spend: newSpend, total_budget: newTotalBudget }
                        : row
                )
            );

            // 3. Update Database
            await updateAdvertiser({ id, field: "spend", value: newSpend });
            await updateAdvertiser({ id, field: "total_budget", value: newTotalBudget });
        } else {
            setRows((prev) =>
                prev.map((row) =>
                    String(row.id) === id ? { ...row, [field]: value } : row
                )
            );
            await updateAdvertiser({ id, field, value });
        }
    };

    const handleDeleteClick = async (id: string | number) => {
        const confirmDelete = window.confirm("Are you sure you want to delete this data?");
        if (confirmDelete) {
            // Delete via API
            await deleteAdvertiserData(id);
            // Delete locally
            if (onDelete) {
                onDelete(id);
            }
        }
    };

    if (rows.length === 0) {
        return (
            <tr>
                <td colSpan={13} className="text-center p-4 text-sm text-gray-500">
                    Belum ada data
                </td>
            </tr>
        );
    }

    return (
        <>
            {rows.map((row, index) => {
                const ppn = row.total_budget - row.spend;
                const costPerLead = (row.actual_leads ?? 0) > 0 
                    ? row.spend / (row.actual_leads ?? 0) 
                    : (row.leads > 0 ? row.spend / row.leads : 0);
                const platformName = row.platform?.name || row.platform_id;
                const isGoogle = platformName?.toLowerCase() === 'google';
                const safeConversiGoogle = row.conversi_google || 0;
                const costPerKonversi = safeConversiGoogle > 0 ? row.spend / safeConversiGoogle : 0;
                const safeId = String(row.id || "");

                return (
                    <tr key={safeId || index} className="hover:bg-gray-50 border-b last:border-b-0">

                        {/* Date */}
                        <td className="px-2 py-2 border-r whitespace-nowrap sticky left-0 bg-white z-10 min-w-[130px] w-[130px] max-w-[130px]">
                            <EditableDate
                                value={row.created_at}
                                rowId={safeId}
                                field="created_at"
                                onSave={handleSave}
                            />
                        </td>

                        {/* Branch */}
                        <td className="px-2 py-2 border-r whitespace-nowrap sticky left-[130px] bg-white z-10 min-w-[150px] w-[150px] max-w-[150px]">
                            <EditableSelect<string>
                                value={row.cabang_id ?? undefined}
                                rowId={safeId}
                                field="cabang_id"
                                // USE PROP: branches
                                options={branches.map((c) => ({
                                    label: c.label,
                                    value: String(c.value),
                                    className: c.classname,
                                }))}
                                onSave={handleSave}
                            />
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
                            <EditableSelect<string>
                                value={row.platform_id ?? undefined}
                                rowId={safeId}
                                field="platform_id"
                                // USE PROP: platforms
                                options={platforms.map((c) => ({
                                    label: c.label,
                                    value: String(c.value),
                                    className: c.classname,
                                }))}
                                onSave={handleSave}
                            />
                        </td>

                        {/* Leads (Target) */}
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

                        {/* Actual Leads */}
                        <td className="px-2 py-2 border-r whitespace-nowrap text-right">
                            <div className="px-1">
                                <EditableInput<number>
                                    value={row.actual_leads ?? 0}
                                    rowId={safeId}
                                    field="actual_leads"
                                    isNumeric={true}
                                    onSave={handleSave}
                                />
                            </div>
                        </td>

                        {/* Target Omset */}
                        <td className="px-2 py-2 border-r whitespace-nowrap text-right">
                            <div className="px-1">
                                <EditableInput<number>
                                    value={row.omset_target}
                                    rowId={safeId}
                                    field="omset_target"
                                    isNumeric={true}
                                    isCurrency={true}
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
                                        value={safeConversiGoogle}
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
                                    value={row.keterangan || ""}
                                    rowId={safeId}
                                    field="keterangan"
                                    onSave={handleSave}
                                />
                            </div>
                        </td>

                        {/* Action - Delete Button */}
                        <td className="px-2 py-2 border-r whitespace-nowrap text-center">
                            <button
                                onClick={() => handleDeleteClick(safeId)}
                                className="text-red-500 hover:text-red-700 transition"
                            >
                                <Trash2 size={16} />
                            </button>
                        </td>
                    </tr >
                );
            })}
        </>
    );
}