import { AdvertiserData } from "@/app/types/types";

export default function ListAdvertiser({ data }: { data: AdvertiserData[] }) {
    if (data.length === 0) {
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
            {data.map((row, index) => (
                <tr key={index} className="hover:bg-gray-50 border-b last:border-b-0">
                    {/* Ensure classes match InputAdvertiser exactly for alignment */}
                    <td className="px-2 py-2 border-r whitespace-nowrap sticky left-0 bg-white z-10">{row.date}</td>
                    <td className="px-2 py-2 border-r whitespace-nowrap">
                        {row.cabang_id}
                    </td>
                    <td className="px-2 py-2 border-r whitespace-nowrap text-right">{Number(row.spend).toLocaleString("id-ID")}</td>
                    <td className="px-2 py-2 border-r whitespace-nowrap text-right">{Number(row.ppn).toLocaleString("id-ID")}</td>
                    <td className="px-2 py-2 border-r whitespace-nowrap text-right font-semibold">{row.total_budget.toLocaleString("id-ID")}</td>
                    <td className="px-2 py-2 border-r whitespace-nowrap uppercase">{row.platform_id}</td>
                    <td className="px-2 py-2 border-r whitespace-nowrap text-right">{row.leads}</td>
                    <td className="px-2 py-2 border-r whitespace-nowrap text-right">{row.cost_per_lead.toLocaleString("id-ID")}</td>
                    <td className="px-2 py-2 border-r whitespace-nowrap text-right">{row.platform_id === 'google' ? row.konversi_google : '-'}</td>
                    <td className="px-2 py-2 border-r whitespace-nowrap text-right">{row.platform_id === 'google' ? row.cost_per_konversi.toLocaleString("id-ID") : '-'}</td>
                    <td className="px-2 py-2 border-r whitespace-nowrap">{row.keterangan}</td>
                    {/* Empty cell for Action column to maintain grid structure */}
                    <td className="px-2 py-2 border-r whitespace-nowrap"></td>
                </tr>
            ))}
        </>
    );
}