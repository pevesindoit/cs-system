"use client"

import { useEffect, useState } from "react";
import { getFilterSearch, getLeads, getPlatforms } from "../function/fetch/get/fetch";
import { addLead } from "../function/fetch/add/fetch";
import LeadTable from "../custom-component/card/LeadTable";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { DropDownGrid } from "../custom-component/DropdownGrid";
import { DropDownGridInt } from "../custom-component/DropDownGridInt";
import { SearchPopup } from "../custom-component/SearchPopup";
import { GetToday } from "../function/template/GetToday";

export default function Cs() {
    const [user, setUser] = useState("")
    const router = useRouter();
    useEffect(() => {
        async function loadUser() {
            try {
                const { data } = await supabaseBrowser.auth.getUser();

                if (!data?.user) {
                    router.push("/login");
                    return;
                }
                setUser(data.user.id);
            } catch (error) {
                console.log(error)
            }
        }
        loadUser();
    }, [router]);

    const [formData, setFormData] = useState<leadsType>({
        name: "",
        address: "",
        channel_id: 5,
        platform_id: "33d30171-5646-4231-af2d-1650ca595e39",
        keterangan_leads_id: 1,
        status: "hold",
        nominal: null,
        pic_id: 1,
        branch_id: "d1382b33-9052-4469-a394-8dd99457d1be",
        reason: "",
        user_id: user,
        created_at: GetToday(),
        nomor_hp: ""
    });
    const [platforms, setPlatforms] = useState<SelectItemData[]>([]);
    const [channel, setChannel] = useState<SelectItemDataInt[]>([]);
    const [keteranganLeads, setKeteranganLeads] = useState<SelectItemDataInt[]>([]);
    const [pic, setPic] = useState<SelectItemDataInt[]>([]);
    const [branch, setBranch] = useState<SelectItemData[]>([]);
    const [searchQuery, setSearchQuery] = useState<number>()


    const status = [
        { label: "Cosed", value: "closed", classname: "bg-[#D7FFD3] text-[#372E2E]" },
        { label: "Followup", value: "followup", classname: "bg-[#FDEBC3] text-[#372E2E]" },
        { label: "Los", value: "los", classname: "bg-[#A6EEB9] text-[#372E2E]" },
        { label: "Hold", value: "hold", classname: "bg-[#E1C3FD] text-[#372E2E]" },
        { label: "Warm", value: "warm", classname: "bg-[#FAFCDE] text-[#372E2E]" },
        { label: "Hot", value: "hot", classname: "bg-[#FDCBF1] text-[#372E2E]" }
    ]
    const [leads, setLeads] = useState<leadsTypeError[]>([]);

    const resetFormExceptDate = (date: string) => ({
        name: "",
        address: "",
        channel_id: null,
        platform_id: "",
        keterangan_leads_id: null,
        status: "",
        nominal: null,
        pic_id: null,
        branch_id: "",
        reason: "",
        user_id: "",
        nomor_hp: "",
        created_at: date, // 👈 KEEP DATE
    });


    useEffect(() => {
        // Bungkus logika fetch dalam fungsi
        const fetchLeads = async () => {
            try {
                const { data } = await supabaseBrowser.auth.getUser();
                if (!data?.user) {
                    router.push("/login");
                    return;
                }

                if (searchQuery) {
                    const payload = {
                        user_id: data?.user?.id,
                        number: searchQuery
                    };

                    // PERBAIKAN: Payload dikirim langsung tanpa bungkus { data: payload }
                    // Lihat poin no 2 di bawah kenapa ini diubah
                    const res = await getFilterSearch(payload);
                    setLeads(res?.data.data || []);
                } else {
                    const res = await getLeads(data?.user?.id);
                    setLeads(res?.data.data || []);
                }
            } catch (error) {
                console.log(error);
            }
        };

        // --- LOGIKA DEBOUNCE ---
        // Tunggu 500ms sebelum menjalankan fetchLeads
        const timer = setTimeout(() => {
            fetchLeads();
        }, 500);

        // Jika searchQuery berubah sebelum 500ms, batalkan timer sebelumnya
        return () => clearTimeout(timer);

    }, [router, searchQuery]);

    useEffect(() => {
        const fetchPlatforms = async () => {
            try {
                const res = await getPlatforms();
                const rawData = res?.data || [];
                // Fixed: Use TypeType (or any) here, not BranchType
                const formattedListPlatform = rawData.platform.map((item: itemType) => ({
                    value: item.id,
                    label: item.name,
                    classname: item.classname
                }));

                const formattedListChannel = rawData.channel.map((item: itemType) => ({
                    value: item.id,
                    label: item.name,
                    classname: item.classname
                }));

                const formattedListketeranganLeads = rawData.keteranganLeads.map((item: itemType) => ({
                    value: item.id,
                    label: item.name,
                    classname: item.classname

                }));

                const formattedListPic = rawData.pic.map((item: itemType) => ({
                    value: item.id,
                    label: item.name,
                    classname: item.classname
                }));

                const formattedListBranch = rawData.branch.map((item: itemType) => ({
                    value: String(item.id),
                    label: item.name,
                    classname: item.classname
                }));

                setPlatforms(formattedListPlatform);
                setChannel(formattedListChannel);
                setKeteranganLeads(formattedListketeranganLeads);
                setPic(formattedListPic);
                setBranch(formattedListBranch);
            } catch (error) {
                console.log(error)
            }
        };
        fetchPlatforms();
    }, []);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]:
                name === "nominal"
                    ? Number(value)
                    : value,
        }));
    };


    const addLeads = async () => {
        try {
            const finalData = {
                ...formData,
                user_id: user,
            };

            const res = await addLead(finalData);

            setLeads(res?.data.allLeads);

            // ✅ remember date
            localStorage.setItem("last_lead_date", formData.created_at);

            // ✅ reset form but keep date
            setFormData(resetFormExceptDate(formData.created_at));
        } catch (error) {
            console.log(error)
        }

    };

    return (
        <div className="flex w-full py-3 pr-3 pl-3 md:pl-0 relative gap-3 overflow-x-auto md:overflow-x-visible no-scrollbar min-w-max">
            <SearchPopup
                value={searchQuery}
                onChange={setSearchQuery}
            />
            <table className="border rounded-md text-[10px] min-w-max bg-yellow-200">

                {/* HEADER */}
                <thead className="bg-gray-50 border-b">
                    <tr>
                        {[
                            "Tanggal",
                            "Nama",
                            "No HP",
                            "Alamat",
                            "Channel",
                            "Platform",
                            "Keterangan Leads",
                            "Status",
                            "Nominal",
                            "PIC",
                            "Cabang",
                            "Keterangan",
                            "Action",
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

                {/* INPUT ROW */}
                <tbody className="bg-white">
                    <tr className="border-b ">
                        {/* Date (Sticky Column) */}
                        <td className="p-0 bg-white z-10 align-middle sticky left-0">
                            <div className="px-1 py-1 border-r">
                                <input
                                    type="date"
                                    value={formData.created_at}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        setFormData((prev) => ({
                                            ...prev,
                                            created_at: value,
                                        }));
                                        localStorage.setItem("last_lead_date", value);
                                    }}
                                    className="w-full bg-transparent outline-none focus:bg-gray-50 pl-1"
                                />
                            </div>
                        </td>

                        {/* Nama */}
                        <td className="p-0 border-r align-middle">
                            <div className="px-1">
                                <input
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="w-full h-8 px-1 bg-transparent outline-none focus:bg-gray-50"
                                />
                            </div>
                        </td>

                        {/* No HP */}
                        <td className="p-0 border-r align-middle">
                            <div className="px-1">
                                <input
                                    name="nomor_hp"
                                    type="number"
                                    value={formData.nomor_hp ?? ""}
                                    onChange={handleChange}
                                    className="w-full h-8 px-1 bg-transparent outline-none focus:bg-gray-50"
                                />
                            </div>
                        </td>

                        {/* Address */}
                        <td className="p-0 border-r align-middle">
                            <div className="px-1">
                                <input
                                    name="address"
                                    value={formData.address}
                                    onChange={handleChange}
                                    className="w-full h-8 px-1 bg-transparent outline-none focus:bg-gray-50"
                                />
                            </div>
                        </td>

                        {/* Channel */}
                        <td className="p-0 border-r align-middle">
                            <div className="px-1">
                                <DropDownGridInt
                                    items={channel}
                                    onValueChange={(value) =>
                                        setFormData((prev) => ({ ...prev, channel_id: value }))
                                    }
                                />
                            </div>
                        </td>

                        {/* Platform */}
                        <td className="p-0 border-r align-middle">
                            <div className="px-1">
                                <DropDownGrid
                                    items={platforms}
                                    onValueChange={(value) =>
                                        setFormData((prev) => ({ ...prev, platform_id: value }))
                                    }
                                />
                            </div>
                        </td>

                        {/* Keterangan Leads */}
                        <td className="p-0 border-r align-middle">
                            <div className="px-1">
                                <DropDownGridInt
                                    items={keteranganLeads}
                                    onValueChange={(value) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            keterangan_leads_id: value,
                                        }))
                                    }
                                />
                            </div>
                        </td>

                        {/* Status */}
                        <td className="p-0 border-r align-middle">
                            <div className="px-1">
                                <DropDownGrid
                                    items={status}
                                    onValueChange={(value) =>
                                        setFormData((prev) => ({ ...prev, status: value }))
                                    }
                                />
                            </div>
                        </td>

                        {/* Nominal */}
                        <td className="p-0 border-r align-middle">
                            <div className="px-1">
                                <input
                                    type="number"
                                    name="nominal"
                                    value={formData.nominal ?? ""}
                                    onChange={handleChange}
                                    className="w-full h-8 px-1 bg-transparent outline-none focus:bg-gray-50"
                                />
                            </div>
                        </td>

                        {/* PIC */}
                        <td className="p-0 border-r align-middle">
                            <div className="px-1">
                                <DropDownGridInt
                                    items={pic}
                                    onValueChange={(value) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            pic_id: value,
                                        }))
                                    }
                                />
                            </div>
                        </td>

                        {/* Branch */}
                        <td className="p-0 border-r align-middle">
                            <div className="px-1">
                                <DropDownGrid
                                    items={branch}
                                    onValueChange={(value) =>
                                        setFormData((prev) => ({ ...prev, branch_id: value }))
                                    }
                                />
                            </div>
                        </td>

                        {/* Reason */}
                        <td className="p-0 border-r align-middle">
                            <div className="px-1">
                                <input
                                    name="reason"
                                    value={formData.reason}
                                    onChange={handleChange}
                                    className="w-full h-8 px-1 bg-transparent outline-none focus:bg-gray-50"
                                />
                            </div>
                        </td>

                        {/* Action */}
                        <td className="p-0 text-center align-middle">
                            <div className="flex justify-center items-center h-full hover:bg-gray-100">
                                <button
                                    onClick={addLeads}
                                    className="text-[10px] w-full h-full py-2"
                                >
                                    tambah
                                </button>
                            </div>
                        </td>
                    </tr>
                </tbody>

                {/* DATA ROWS */}
                <LeadTable
                    data={leads}
                    channels={channel}
                    platforms={platforms}
                    pics={pic}
                    branches={branch}
                    keteranganLeads={keteranganLeads}
                    status={status}
                />
            </table >
        </div >

    )
}