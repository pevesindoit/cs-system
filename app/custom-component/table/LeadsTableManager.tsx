import { leadsType } from "@/app/types/types";

type leadDataType = {
    data: leadsType[];
};

const statusColors: Record<string, string> = {
    hold: "#A6C1EE",
    warm: "#FAFCDE",
    followup: "#FDEBC3",
    los: "#F7DDD5",
    closed: "#A6EEB9",
    hot: "#FFD3E2",
};

export function LeadsTableManager({ data }: leadDataType) {
    return (
        <div className="text-[.7rem]">
            {/* 1. Adjusted outer container: Removed 'overflow-hidden' so scrollbars can appear */}
            <div className="bg-white rounded-[10px] py-7 px-4 md:px-8 border">

                {/* 2. Added Scroll Wrapper: This div handles the horizontal scrolling */}
                <div className="overflow-x-auto">

                    <table className="w-full">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                {[
                                    "Tanggal",
                                    "Nama",
                                    "Status",
                                    "PIC",
                                    "Cabang",
                                    "Keterangan",
                                ].map((h, i) => (
                                    <th
                                        key={i}
                                        scope="col"
                                        className="px-2 py-2 font-medium text-left border-r last:border-r-0 whitespace-nowrap"
                                    >
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {data.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={6}
                                        className="px-2 py-4 text-center text-gray-500"
                                    >
                                        Data tidak tersedia
                                    </td>
                                </tr>
                            ) : (
                                data.map((item, index) => (
                                    <tr key={index} className="border-b hover:bg-gray-50">
                                        <td className="px-2 py-2 whitespace-nowrap">
                                            {new Date(item.created_at).toLocaleDateString("id-ID")}
                                        </td>

                                        <td className="px-2 py-2 whitespace-nowrap">
                                            {item.name}
                                        </td>

                                        <td className="px-2 py-2 whitespace-nowrap">
                                            <span
                                                className="px-3 py-1 rounded-full text-xs font-semibold capitalize text-gray-700 inline-block"
                                                style={{
                                                    backgroundColor:
                                                        statusColors[item.status?.toLowerCase()] || "#e5e7eb",
                                                }}
                                            >
                                                {item.status}
                                            </span>
                                        </td>

                                        <td className="px-2 py-2 whitespace-nowrap">
                                            {item.pic_name?.name || "-"}
                                        </td>

                                        <td className="px-2 py-2 whitespace-nowrap">
                                            {item.branch_name?.name}
                                        </td>

                                        {/* Note: Keterangan often has long text. 
                        If you want this to force a scroll instead of wrapping, keep 'whitespace-nowrap'.
                        If you want it to wrap, remove 'whitespace-nowrap' from this specific cell. */}
                                        <td className="px-2 py-2 whitespace-nowrap">
                                            {item.reason || "-"}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>

                </div>
            </div>
        </div>
    );
}