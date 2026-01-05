"use client";

import React from "react";
import { updateLead } from "@/app/function/fetch/update/update-lead/fetch";
import EditableInput from "../table/EditableInput";
import { useEffect, useState, Fragment } from "react";
import EditableSelect from "../table/EditableDropdown";
import EditableDate from "../table/EditableDate";
import { ModalFollowUp } from "../modal/ModalFollowUp";
import { getFollowups } from "@/app/function/fetch/get/fetch";
import FormatDate from "../formater/DateFormater";
import { dataType, followUpsType, leadsTypeError, SelectItemData, SelectItemDataInt } from "@/app/types/types";
import { deleteLead } from "@/app/function/fetch/delete/fetch";


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
    const [dataFollowUp, setDataFollowUp] = useState<dataType>()
    const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
    const [followUpsData, setFollowUpsData] = useState<followUpsType[]>([])

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
    const toggleExpand = async (id: string) => {
        setExpandedRowId((prev) => (prev === id ? null : id));
        const res = await getFollowups(id)
        setFollowUpsData(res?.data.data)
    };

    const addFollowup = async (id: string, nomor_hp: string) => {
        const payload = {
            id,
            noted: nomor_hp
        }
        setDataFollowUp(payload)
        setIsModalOpen(true)
    }

    const handleSendText = async (data: followUpsType[]) => {
        // Close modal after success
        setIsModalOpen(false);
        setFollowUpsData(data)

    };

    const deleteLeads = async (id: string) => {
        try {
            const res = await deleteLead(id)
            console.log(res)
        } catch {
            console.log("error")
        }
    }

    return (
        <>
            {isModalOpen && dataFollowUp && (
                <ModalFollowUp
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSubmit={handleSendText}
                    title="Add Note"
                    placeholder="Write a note about this lead..."
                    data={dataFollowUp}
                />
            )}

            <tbody className="bg-white ">
                {rows.map((item) => (
                    <Fragment key={item.id}>
                        {/* 1. Main Data Row */}
                        <tr className="hover:bg-gray-100 transition-colors border-b group ">

                            {/* Date (Sticky Column) */}
                            <td className="p-0 sticky left-0 z-10 align-middle group-hover:bg-gray-50">
                                <div className="px-1 py-1 border-r bg-white">
                                    <EditableDate
                                        value={item.updated_at}
                                        rowId={item.id}
                                        field="updated_at"
                                        onSave={handleSave}
                                    />
                                </div>
                            </td>

                            {/* Name */}
                            <td className="p-0 border-r align-middle">
                                <div className="px-1">
                                    <EditableInput<string>
                                        value={item.name}
                                        rowId={item.id}
                                        field="name"
                                        onSave={handleSave}
                                    />
                                </div>
                            </td>

                            {/* No HP */}
                            <td className="p-0 border-r align-middle">
                                <div className="px-1">
                                    <EditableInput<string>
                                        value={item.nomor_hp}
                                        rowId={item.id}
                                        field="nomor_hp"
                                        isNumeric={true}
                                        onSave={handleSave}
                                    />
                                </div>
                            </td>

                            {/* Address */}
                            <td className="p-0 border-r align-middle">
                                <div className="px-1">
                                    <EditableInput
                                        value={item.address}
                                        rowId={item.id}
                                        field="address"
                                        onSave={handleSave}
                                    />
                                </div>
                            </td>

                            {/* Channel */}
                            <td className="p-0 border-r align-middle">
                                <div className="px-1">
                                    <EditableSelect<number>
                                        value={item.channel_id ?? undefined}
                                        rowId={item.id}
                                        field="channel_id"
                                        options={channels.map((c) => ({
                                            label: c.label,
                                            value: c.value,
                                            className: c.classname,
                                        }))}
                                        onSave={handleSave}
                                    />
                                </div>
                            </td>

                            {/* Platform */}
                            <td className="p-0 border-r align-middle">
                                <div className="px-1">
                                    <EditableSelect<string>
                                        value={item.platform_id ?? undefined}
                                        rowId={item.id}
                                        field="platform_id"
                                        options={platforms.map((c) => ({
                                            label: c.label,
                                            value: c.value,
                                            className: c.classname,
                                        }))}
                                        onSave={handleSave}
                                    />
                                </div>
                            </td>

                            {/* Keterangan Leads */}
                            <td className="p-0 border-r align-middle">
                                <div className="px-1">
                                    <EditableSelect<number>
                                        value={item.keterangan_leads_id ?? undefined}
                                        rowId={item.id}
                                        field="keterangan_leads_id"
                                        options={keteranganLeads.map((c) => ({
                                            label: c.label,
                                            value: c.value,
                                            className: c.classname,
                                        }))}
                                        onSave={handleSave}
                                    />
                                </div>
                            </td>

                            {/* Status */}
                            <td className="p-0 border-r align-middle">
                                <div className="px-1">
                                    <EditableSelect<string>
                                        value={item.status ?? undefined}
                                        rowId={item.id}
                                        field="status"
                                        options={status.map((c) => ({
                                            label: c.label,
                                            value: c.value,
                                            className: c.classname,
                                        }))}
                                        onSave={handleSave}
                                    />
                                </div>
                            </td>

                            {/* Nominal */}
                            <td className="p-0 border-r align-middle">
                                <div className="px-1">
                                    <EditableInput<number>
                                        value={item.nominal}
                                        rowId={item.id}
                                        field="nominal"
                                        parseValue={(v) => Number(v)}
                                        onSave={handleSave}
                                        isNumeric={true}
                                        isCurrency={true}
                                    />
                                </div>
                            </td>

                            {/* PIC */}
                            <td className="p-0 border-r align-middle">
                                <div className="px-1">
                                    <EditableSelect<number>
                                        value={item.pic_id ?? undefined}
                                        rowId={item.id}
                                        field="pic_id"
                                        options={pics.map((c) => ({
                                            label: c.label,
                                            value: c.value,
                                            className: c.classname,
                                        }))}
                                        onSave={handleSave}
                                    />
                                </div>
                            </td>

                            {/* Branch */}
                            <td className="p-0 border-r align-middle">
                                <div className="px-1">
                                    <EditableSelect<string>
                                        value={item.branch_id ?? undefined}
                                        rowId={item.id}
                                        field="branch_id"
                                        options={branches.map((c) => ({
                                            label: c.label,
                                            value: c.value,
                                            className: c.classname,
                                        }))}
                                        onSave={handleSave}
                                    />
                                </div>
                            </td>

                            {/* Reason */}
                            <td className="p-0 border-r align-middle">
                                <div className="px-1">
                                    <EditableInput
                                        value={item.reason}
                                        rowId={item.id}
                                        field="reason"
                                        onSave={handleSave}
                                    />
                                </div>
                            </td>

                            {/* Action Button */}
                            <td className="p-0 text-center align-middle">
                                <div className="flex justify-center items-center px-1 space-x-2">
                                    <button
                                        onClick={() => toggleExpand(item.id)}
                                        className={`text-[10px] px-3 py-1 rounded border transition-all ${expandedRowId === item.id
                                            ? "bg-red-50 text-red-500 border-red-200"
                                            : "bg-white text-blue-500 border-blue-200 hover:bg-blue-50"
                                            }`}
                                    >
                                        {expandedRowId === item.id ? "Tutup" : "Lihat"}
                                    </button>

                                    <button
                                        onClick={() => deleteLeads(item.id)}
                                        className="text-[10px] w-full h-full px-2 bg-red-50 text-red-500 border-red-200 py-1 rounded border"
                                    >
                                        hapus
                                    </button>
                                </div>
                            </td>
                        </tr>

                        {/* 2. Expanded Detail Row */}
                        {expandedRowId === item.id && (
                            <tr className="bg-gray-50 border-b">
                                <td colSpan={13} className="p-0">
                                    <div className="w-full border-t border-dashed border-gray-300">
                                        <div className="p-4">
                                            <button
                                                onClick={() => addFollowup(item.id, item.nomor_hp)}
                                                className="text-[10px] px-3 py-1 rounded border transition-all bg-white hover:bg-gray-100"
                                            >
                                                Followup
                                            </button>
                                        </div>

                                        {/* Inner Grid for FollowUps */}
                                        <div className="grid grid-cols-13 text-[10px] bg-gray-100 border-t border-b border-gray-200">
                                            <div className="px-2 py-2 font-semibold col-span-3 border-r">Tgl Followup</div>
                                            <div className="px-2 py-2 font-semibold col-span-10">Keterangan</div>
                                        </div>

                                        {followUpsData.map((fItem: followUpsType, index: number) => (
                                            <div
                                                className="grid grid-cols-13 text-[10px] border-b last:border-b-0"
                                                key={index}
                                            >
                                                <div className="px-2 py-2 col-span-3 border-r">
                                                    <FormatDate value={fItem.created_at} />
                                                </div>
                                                <div className="px-2 py-2 col-span-10">
                                                    {fItem.note}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </td>
                            </tr>
                        )}
                    </Fragment>
                ))}
            </tbody>
        </>
    );
}