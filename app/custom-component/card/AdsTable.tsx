"use client"
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import FormatDate from "../formater/DateFormater";

export default function AdsTable({ data }: { data: adsTypeError[] }) {

    const safeData = Array.isArray(data) ? data : [];

    return (
        <div className="border rounded-[5px] h-full py-10 px-9 bg-[#FEFEFE] grid grid-cols-1 gap-8 text-[.7rem]">
            <Table>
                <TableCaption>Leads terbaru kamu.</TableCaption>

                <TableHeader>
                    <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Campaign</TableHead>
                        <TableHead>Platform</TableHead>
                        <TableHead>Cost</TableHead>
                    </TableRow>
                </TableHeader>

                <TableBody>
                    {safeData.map((item: adsTypeError, index: number) => (
                        <TableRow key={index}>
                            <TableCell className="font-medium"><FormatDate value={item.created_at} /></TableCell>
                            <TableCell>{item.name}</TableCell>
                            <TableCell>{item.platform?.name}</TableCell>
                            <TableCell>
                                Rp {Number(item.daily_spend).toLocaleString("id-ID")}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
