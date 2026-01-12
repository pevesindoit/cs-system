"use client";

import React, { Fragment, useState } from "react";
import EditableInput from "../table/EditableInput";
import EditableSelect from "../table/EditableDropdown";
import EditableDate from "../table/EditableDate";
import { ModalFollowUp } from "../modal/ModalFollowUp";
import FormatDate from "../formater/DateFormater";

// API & Types
import { updateLead } from "@/app/function/fetch/update/update-lead/fetch";
import { getFollowups } from "@/app/function/fetch/get/fetch";
import { deleteLead } from "@/app/function/fetch/delete/fetch";
import {
    dataType,
    followUpsType,
    leadsTypeError,
    SelectItemData,
    SelectItemDataInt
} from "@/app/types/types";

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
    // FIX 1: Initialize state directly from props. 
    // Use (data || []) to prevent crashes if data is initially undefined.
    const [rows, setRows] = useState<leadsTypeError[]>(data || []);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [dataFollowUp, setDataFollowUp] = useState<dataType>();
    const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
    const [followUpsData, setFollowUpsData] = useState<followUpsType[]>([]);

    // FIX 2: Re-enable the useEffect to sync props to state.
    // This is necessary because data is fetched asynchronously in the parent.
    // Without this, the table only knows the initial empty [] value.
    React.useEffect(() => {
        if (data) {
            setRows(data);
        }
    }, [data]);

    // --- HANDLERS ---

    const handleSave = async (
        id: string,
        field: string,
        value: string | number
    ) => {
        // Optimistic update
        setRows((prev) =>
            prev.map((row) =>
                row.id === id ? { ...row, [field]: value } : row
            )
        );
        await updateLead({ id, field, value });
    };

    const toggleExpand = async (id: string) => {
        if (expandedRowId === id) {
            setExpandedRowId(null);
            setFollowUpsData([]);
            return;
        }

        setExpandedRowId(id);
        setFollowUpsData([]);
        try {
            const res = await getFollowups(id);
            setFollowUpsData(Array.isArray(res?.data?.data) ? res.data.data : []);
        } catch (error) {
            console.error("Error fetching followups:", error);
            setFollowUpsData([]);
        }
    };

    const formatPhoneNumber = (phone: string) => {
        let cleaned = phone.replace(/\D/g, "");
        if (cleaned.startsWith("62")) {
            cleaned = "0" + cleaned.slice(2);
        } else if (cleaned.startsWith("8")) {
            cleaned = "0" + cleaned;
        }
        return cleaned;
    };

    const addFollowup = (id: string, nomor_hp: string) => {
        const formattedNumber = formatPhoneNumber(nomor_hp);
        const payload = {
            id,
            noted: formattedNumber
        };
        setDataFollowUp(payload);
        setIsModalOpen(true);
    };

    const handleSendText = (messageFromModal: string, newFollowUpItem: followUpsType) => {
        const localNumber = dataFollowUp?.noted;

        if (localNumber) {
            const cleanNumber = localNumber.replace(/\D/g, '');
            const waNumber = "62" + cleanNumber.slice(1);
            const encodedMessage = encodeURIComponent(messageFromModal);
            const whatsappUrl = `https://web.whatsapp.com/send?phone=${waNumber}&text=${encodedMessage}`; // Added & before text

            window.open(whatsappUrl, "WAChat");
        }

        if (newFollowUpItem) {
            setFollowUpsData((prev) => [newFollowUpItem, ...prev]);
        }

        setIsModalOpen(false);
    };

    const deleteLeads = async (id: string) => {
        if (!confirm("Are you sure you want to delete this lead?")) return;
        try {
            await deleteLead(id);
            setRows((prev) => prev.filter((row) => row.id !== id));
        } catch (error) {
            console.error("Error deleting lead:", error);
        }
    };

    return (
        <>
            {isModalOpen && dataFollowUp && (
                <ModalFollowUp
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSubmit={handleSendText}
                    data={dataFollowUp}
                    title="Add Note & Send WhatsApp"
                    placeholder="Type message to customer..."
                />
            )}

            <tbody className="bg-white">
                {rows.map((item) => (
                    <Fragment key={item.id}>
                        <tr className="hover:bg-gray-100 transition-colors border-b group">

                            {/* Updated At */}
                            <td className="p-0 sticky left-0 z-10 align-middle bg-white group-hover:bg-gray-50 border-r w-[100px]">
                                <div className="px-1 py-1">
                                    <EditableDate
                                        value={item.updated_at}
                                        rowId={item.id}
                                        field="updated_at"
                                        onSave={handleSave}
                                    />
                                </div>
                            </td>

                            {/* Name */}
                            <td className="p-0 sticky left-[100px] z-10 align-middle bg-white group-hover:bg-gray-50 border-r w-[150px]">
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
                            <td className="p-0 sticky left-[250px] z-10 align-middle bg-white group-hover:bg-gray-50 border-r w-[120px]">
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
                                        parseValue={(v) => {
                                            if (typeof v === 'string') {
                                                const cleanValue = v.replace(/[^0-9]/g, '');
                                                return cleanValue ? Number(cleanValue) : 0;
                                            }
                                            return Number(v);
                                        }}
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

                            {/* Action Buttons */}
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
                                        Hapus
                                    </button>
                                </div>
                            </td>
                        </tr>

                        {/* Expanded Detail Row */}
                        {expandedRowId === item.id && (
                            <tr className="bg-gray-50 border-b">
                                <td colSpan={13} className="p-0">
                                    <div className="w-full border-t border-dashed border-gray-300">

                                        {/* Expand Header / Toolbar */}
                                        <div className="p-4 flex gap-2">
                                            <button
                                                onClick={() => addFollowup(item.id, item.nomor_hp)}
                                                className="text-[10px] px-3 py-1 rounded border transition-all bg-white hover:bg-gray-100 font-medium text-gray-700 shadow-sm"
                                            >
                                                + Followup
                                            </button>
                                        </div>

                                        {/* Inner Grid for FollowUps */}
                                        <div className="grid grid-cols-13 text-[10px] bg-gray-100 border-t border-b border-gray-200">
                                            <div className="px-2 py-2 font-semibold col-span-3 border-r">Tgl Followup</div>
                                            <div className="px-2 py-2 font-semibold col-span-10">Keterangan</div>
                                        </div>

                                        {/* Followup Items */}
                                        {followUpsData.length === 0 ? (
                                            <div className="p-4 text-center text-gray-400 text-xs italic">
                                                belum di followup
                                            </div>
                                        ) : (
                                            followUpsData.map((fItem, index) => (
                                                <div
                                                    className="grid grid-cols-13 text-[10px] border-b last:border-b-0 bg-white"
                                                    key={index}
                                                >
                                                    <div className="px-2 py-2 col-span-3 border-r text-gray-500">
                                                        <FormatDate value={fItem.created_at} />
                                                    </div>
                                                    <div className="px-2 py-2 col-span-10 text-gray-700">
                                                        {fItem.note}
                                                    </div>
                                                </div>
                                            ))
                                        )}
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