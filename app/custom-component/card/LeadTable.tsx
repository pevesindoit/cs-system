"use client"
import { getLeads } from "@/app/function/fetch/get/fetch";
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { useEffect, useState } from "react";
import ColoredTemplate from "../accessories/ColoredTemplate";

export default function LeadTable({ data }: { data: any }) {

    console.log(data, "ini didalam komponent");

    const safeData = Array.isArray(data) ? data : [];

    return (
        <div className="border rounded-[5px] h-full py-10 px-9 bg-[#FEFEFE] grid grid-cols-1 gap-8">
            <Table>
                <TableCaption>Leads terbaru kamu.</TableCaption>

                <TableHeader>
                    <TableRow>
                        <TableHead>Nama</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Platform</TableHead>
                        <TableHead className="text-center">Nominal</TableHead>
                        <TableHead>Kenapa Closing / Tidak</TableHead>
                    </TableRow>
                </TableHeader>

                <TableBody>
                    {safeData.map((item: any, index: number) => (
                        <TableRow key={index}>
                            <TableCell className="font-medium">{item.name}</TableCell>
                            <TableCell><ColoredTemplate>{item.status}</ColoredTemplate></TableCell>
                            <TableCell>{item.platform?.name}</TableCell>
                            <TableCell className="text-center">
                                Rp {Number(item.nominal).toLocaleString("id-ID")}
                            </TableCell>
                            <TableCell>{item.reason}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
