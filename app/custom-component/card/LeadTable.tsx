"use client";

import { updateLead } from "@/app/function/fetch/update/update-lead/fetch";
import EditableInput from "../table/EditableInput";
import { useEffect, useState } from "react";
import EditableSelect from "../table/EditableDropdown";

type LeadTableGridProps = {
    data: leadsTypeError[];
    channels: SelectItemDataMap[];
    platforms: SelectItemData[];
    pics: SelectItemDataInt[];
    branches: SelectItemData[];
    keteranganLeads: SelectItemDataInt[];
};

export default function LeadTableGrid({ data,
    channels,
    platforms,
    pics,
    branches,
    keteranganLeads,
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

    console.log(channels, "ini isinya")

    return (
        <>
            {rows.map((item) => (
                <div
                    key={item.id}
                    className="grid grid-cols-11 border-b text-[10px]"
                >
                    <EditableInput
                        value={item.name}
                        rowId={item.id}
                        field="name"
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
                            label: c.name,
                            value: c.id,
                        }))}
                        onSave={handleSave}
                    />

                    <div className="border-r px-1 py-1">
                        {item.reason}
                    </div>

                    <div className="px-1 py-1 text-center text-gray-400">
                        —
                    </div>
                </div>
            ))}
        </>
    );
}
