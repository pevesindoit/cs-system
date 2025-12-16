"use client";

import { updateLead } from "@/app/function/fetch/update/update-lead/fetch";
import EditableInput from "../table/EditableInput";
import { useEffect, useState } from "react";
import EditableSelect from "../table/EditableDropdown";
import EditableDate from "../table/EditableDate";

type LeadTableGridProps = {
    data: leadsTypeError[];
    channels: SelectItemDataInt[];
    platforms: SelectItemData[];
    pics: SelectItemDataInt[];
    branches: SelectItemData[];
    keteranganLeads: SelectItemDataInt[];
    status: SelectItemData[];
};

export default function LeadTableGrid({ data,
    channels,
    platforms,
    pics,
    branches,
    keteranganLeads,
    status
}: LeadTableGridProps) {
    const [rows, setRows] = useState<leadsTypeError[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            if (Array.isArray(data)) {
                setRows(data);
            }
        }
        fetchData()
    }, [data]); // 👈 penting

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

    console.log(keteranganLeads, "ini platformya")

    return (
        <>
            {rows.map((item) => (
                <div
                    key={item.id}
                    className="grid grid-cols-13 border-b text-[10px]"
                >
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

                    <EditableInput<number>
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
                </div>
            ))}
        </>
    );
}
