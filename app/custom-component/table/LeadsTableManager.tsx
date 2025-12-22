type leadDataType = {
    data: leadsType[]
}

export function LeadsTableManager(data: leadDataType) {
    return (
        <div className="text-[.7rem]">
            <div className="bg-white rounded-[10px] py-7 px-8 border overflow-hidden">
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
                        {data.data.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-2 py-4 text-center text-gray-500">
                                    Data tidak tersedia
                                </td>
                            </tr>
                        ) : (
                            data.data.map((item, index) => (
                                <tr key={index} className="border-b hover:bg-gray-50">
                                    {/* Tanggal */}
                                    <td className="px-2 py-2 whitespace-nowrap">
                                        {new Date(item.created_at).toLocaleDateString("id-ID")}
                                    </td>

                                    {/* Nama */}
                                    <td className="px-2 py-2 whitespace-nowrap">
                                        {item.name}
                                    </td>

                                    {/* Status */}
                                    <td className="px-2 py-2 whitespace-nowrap capitalize">
                                        {item.status}
                                    </td>

                                    {/* PIC */}
                                    <td className="px-2 py-2 whitespace-nowrap">
                                        {item.pic_name?.name || "-"}
                                    </td>

                                    {/* Cabang */}
                                    <td className="px-2 py-2 whitespace-nowrap">
                                        {item.branch_name?.name}
                                    </td>

                                    {/* Keterangan */}
                                    <td className="px-2 py-2">
                                        {item.reason || "-"}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}