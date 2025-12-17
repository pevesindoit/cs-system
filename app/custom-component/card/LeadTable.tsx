"use client";

import { updateLead } from "@/app/function/fetch/update/update-lead/fetch";
import EditableInput from "../table/EditableInput";
import { useEffect, useState } from "react";
import EditableSelect from "../table/EditableDropdown";
import EditableDate from "../table/EditableDate";
import { Button } from "@/components/ui/button";
import { ModalFollowUp } from "../modal/ModalFollowUp";

type LeadTableGridProps = {
    data: leadsTypeError[];
    channels: SelectItemDataInt[];
    platforms: SelectItemData[];
    pics: SelectItemDataInt[];
    branches: SelectItemData[];
    keteranganLeads: SelectItemDataInt[];
    status: SelectItemData[];
};

export default function LeadTableGrid({
    data,
    channels,
    platforms,
    pics,
    branches,
    keteranganLeads,
    status
}: LeadTableGridProps) {
    const [rows, setRows] = useState<leadsTypeError[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    // 1. New State to track which ID is open
    const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            if (Array.isArray(data)) {
                setRows(data);
            }
        }
        fetchData()
    }, [data]);

    const handleSave = async (
        id: string,
        field: string,
        value: string | number
    ) => {
        // optimistic update
        setRows((prev) =>
            prev.map((row) =>
                row.id === id ? { ...row, [field]: value } : row
            )
        );

        await updateLead({ id, field, value });
    };

    // 2. Handler to toggle the view
    const toggleExpand = (id: string) => {
        setExpandedRowId((prev) => (prev === id ? null : id));

    };

    const addFollowup = async (id: string, nomor_hp: string) => {
        console.log("okey", id)
        console.log("nomor hp", nomor_hp)
        setIsModalOpen(true)
    }

    const handleSendText = async (text: string) => {
        console.log("Submitting:", text);
        // Call your API here...

        // Close modal after success
        setIsModalOpen(false);
    };
    return (
        <>
            <ModalFollowUp
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleSendText}
                title="Add Note"
                placeholder="Write a note about this lead..."
            />
            {rows.map((item) => (
                // 3. Wrapper Div (moved key here, moved border-b here)
                <div key={item.id} className="flex flex-col border-b hover:bg-gray-50/50 transition-colors">

                    {/* Main Grid Row */}
                    <div className="grid grid-cols-13 text-[10px]">
                        <EditableDate
                            value={item.created_at}
                            rowId={item.id}
                            field="created_at"
                            onSave={handleSave}
                        />
                        <EditableInput<string>
                            value={item.name}
                            rowId={item.id}
                            field="name"
                            onSave={handleSave}
                        />

                        <EditableInput<string>
                            value={item.nomor_hp}
                            rowId={item.id}
                            field="nomor_hp"
                            isNumeric={true}
                            onSave={handleSave}
                        />

                        <EditableInput
                            value={item.address}
                            rowId={item.id}
                            field="address"
                            onSave={handleSave}
                        />


                        <EditableSelect<number>
                            value={item.channel_id ?? undefined}
                            rowId={item.id}
                            field="channel_id"
                            options={channels.map((c) => ({
                                label: c.label,
                                value: c.value,
                                className: c.classname
                            }))}
                            onSave={handleSave}
                        />

                        <EditableSelect<string>
                            value={item.platform_id ?? undefined}
                            rowId={item.id}
                            field="platform_id"
                            options={platforms.map((c) => ({
                                label: c.label,
                                value: c.value,
                                className: c.classname
                            }))}
                            onSave={handleSave}
                        />

                        <EditableSelect<number>
                            value={item.keterangan_leads_id ?? undefined}
                            rowId={item.id}
                            field="keterangan_leads_id"
                            options={keteranganLeads.map((c) => ({
                                label: c.label,
                                value: c.value,
                                className: c.classname
                            }))}
                            onSave={handleSave}
                        />

                        <EditableSelect<string>
                            value={item.status ?? undefined}
                            rowId={item.id}
                            field="status"
                            options={status.map((c) => ({
                                label: c.label,
                                value: c.value,
                                className: c.classname
                            }))}
                            onSave={handleSave}
                        />

                        <EditableInput<number>
                            value={item.nominal}
                            rowId={item.id}
                            field="nominal"
                            parseValue={(v) => Number(v)}
                            onSave={handleSave}
                            isNumeric={true}
                            isCurrency={true}
                        />

                        <EditableSelect<number>
                            value={item.pic_id ?? undefined}
                            rowId={item.id}
                            field="pic_id"
                            options={pics.map((c) => ({
                                label: c.label,
                                value: c.value,
                                className: c.classname
                            }))}
                            onSave={handleSave}
                        />

                        <EditableSelect<string>
                            value={item.branch_id ?? undefined}
                            rowId={item.id}
                            field="branch_id"
                            options={branches.map((c) => ({
                                label: c.label,
                                value: c.value,
                                className: c.classname
                            }))}
                            onSave={handleSave}
                        />

                        <EditableInput
                            value={item.reason}
                            rowId={item.id}
                            field="reason"
                            onSave={handleSave}
                        />

                        <div className="flex justify-center items-center px-1">
                            <button
                                onClick={() => toggleExpand(item.id)}
                                className={`text-[10px] px-3 py-1 rounded border transition-all ${expandedRowId === item.id
                                    ? "bg-red-50 text-red-500 border-red-200"
                                    : "bg-white text-blue-500 border-blue-200 hover:bg-blue-50"
                                    }`}
                            >
                                {expandedRowId === item.id ? "Tutup" : "Lihat"}
                            </button>
                        </div>
                    </div>

                    {/* 4. Collapsible List Section */}
                    {expandedRowId === item.id && (
                        <div className="w-full bg-gray-50 border-t border-dashed border-gray-300">
                            <div className="p-4">
                                <button onClick={() => addFollowup(item.id, item.nomor_hp)} className="text-[10px] px-3 py-1 rounded border transition-all">Followup</button>
                            </div>
                            <div className="grid grid-cols-13 text-[10px]">
                                {/* Takes 1 column by default */}
                                <div className="px-2 py-1">Tgl Followup</div>

                                {/* Spans the remaining 12 columns */}
                                <div className="px-2 py-1 col-span-12">Keterangan</div>
                            </div>
                            <div className="grid grid-cols-13 text-[10px]">
                                {/* Takes 1 column by default */}
                                <div className="px-2 py-1">Tgl Followup</div>

                                {/* Spans the remaining 12 columns */}
                                <div className="px-2 py-1 col-span-12">Keterangan</div>
                            </div>
                        </div>
                    )}
                </div >
            ))
            }
        </>
    );
}