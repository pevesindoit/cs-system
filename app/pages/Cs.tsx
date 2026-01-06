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
import { itemType, leadsType, leadsTypeError, SelectItemData, SelectItemDataInt } from "../types/types";

export default function Cs() {
    const [user, setUser] = useState("")
    const [loading, setLoading] = useState(false)
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
        updated_at: GetToday(),
        nomor_hp: ""
    });
    const [platforms, setPlatforms] = useState<SelectItemData[]>([]);
    const [channel, setChannel] = useState<SelectItemDataInt[]>([]);
    const [keteranganLeads, setKeteranganLeads] = useState<SelectItemDataInt[]>([]);
    const [pic, setPic] = useState<SelectItemDataInt[]>([]);
    const [branch, setBranch] = useState<SelectItemData[]>([]);
    const [searchQuery, setSearchQuery] = useState<number>()


    const status = [
        { label: "Closing", value: "closing", classname: "bg-[#D7FFD3] text-[#372E2E]" },
        { label: "Followup", value: "followup", classname: "bg-[#FDEBC3] text-[#372E2E]" },
        { label: "Los", value: "los", classname: "bg-[#A6EEB9] text-[#372E2E]" },
        { label: "Hold", value: "hold", classname: "bg-[#E1C3FD] text-[#372E2E]" },
        { label: "Warm", value: "warm", classname: "bg-[#FAFCDE] text-[#372E2E]" },
        { label: "Hot", value: "hot", classname: "bg-[#FDCBF1] text-[#372E2E]" }
    ]
    const [leads, setLeads] = useState<leadsTypeError[]>([]);

    const resetFormKeepSettings = (lastData: leadsType) => ({
        // 1. Fields to RESET (Clear these)
        name: "",
        address: "",
        nomor_hp: "",
        nominal: null,
        reason: "",
        status: lastData.status, // Reset to default status (usually 'hold' for new entry)

        // 2. Fields to KEEP (Copy from previous input)
        channel_id: lastData.channel_id,
        platform_id: lastData.platform_id,
        keterangan_leads_id: lastData.keterangan_leads_id,
        pic_id: lastData.pic_id,
        branch_id: lastData.branch_id,
        updated_at: lastData.updated_at,
        user_id: lastData.user_id,
    });


    useEffect(() => {
        if (!user) return;

        const fetchLeads = async () => {
            try {
                let fetchedData: leadsTypeError[] = []; // Explicitly type the array

                if (searchQuery) {
                    const payload = {
                        user_id: user,
                        number: searchQuery
                    };
                    const res = await getFilterSearch(payload);
                    fetchedData = res?.data.data || [];
                } else {
                    const res = await getLeads(user);
                    fetchedData = res?.data.data || [];
                }

                // ✅ FIX: Use 'leadsTypeError' instead of 'any'
                // Inside your useEffect
                // Inside your useEffect...

                // ✅ FIX: Match the Double Sort logic (Updated At -> Created At)
                const sortedData = fetchedData.sort((a: leadsTypeError, b: leadsTypeError) => {
                    // 1. Primary Sort: updated_at (The date the user selected)
                    const dateA = new Date(a.updated_at).getTime();
                    const dateB = new Date(b.updated_at).getTime();

                    // If dates are different, sort by date
                    if (dateB !== dateA) {
                        return dateB - dateA;
                    }

                    // 2. Secondary Sort: created_at (Tie-breaker for same day)
                    const createdA = new Date(a.created_at).getTime();
                    const createdB = new Date(b.created_at).getTime();
                    return createdB - createdA;
                });

                setLeads(sortedData);
            } catch (error) {
                console.log(error);
            }
        };

        const timer = setTimeout(() => {
            fetchLeads();
        }, 500);

        return () => clearTimeout(timer);

    }, [user, searchQuery]);

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
            [name]: name === "nominal"
                ? (value === "" ? null : value) // If empty, set null. If not, keep string.
                : value,
        }));
    };


    const addLeads = async () => {
        setLoading(true)
        try {
            // 1. Prepare Data
            const cleanedNomorHp = formData.nomor_hp?.trim() === "" ? null : formData.nomor_hp;

            // --- TAMBAHAN PENTING ---
            // Bersihkan nominal dari karakter non-angka (jika ada) lalu convert ke Number
            // Jika null/kosong, jadikan 0 (atau null, tergantung DB Anda boleh null atau tidak)
            let cleanedNominal = 0;
            if (formData.nominal) {
                // Hapus titik/koma jika user copas "10.000", lalu convert
                // Jika input type="number" biasanya browser sudah handle ini, tapi aman jaga2
                const stringNominal = String(formData.nominal).replace(/[^0-9.]/g, '');
                cleanedNominal = Number(stringNominal);
            }


            const finalData = {
                ...formData,
                nomor_hp: cleanedNomorHp,
                user_id: user,

                updated_at: formData.updated_at,
                nominal: cleanedNominal,
                created_at: undefined,
            };

            // 2. Call API
            const res = await addLead(finalData);

            const newLead = res?.data?.newLead;

            if (newLead) {
                // ✅ FIX: Sort immediately on the frontend
                setLeads((prevLeads) => {
                    const updatedList = [newLead, ...prevLeads];

                    return updatedList.sort((a, b) => {
                        // 1. Primary Sort: updated_at (User selected date)
                        const dateA = new Date(a.updated_at).getTime();
                        const dateB = new Date(b.updated_at).getTime();

                        if (dateB !== dateA) {
                            return dateB - dateA;
                        }

                        // 2. Secondary Sort: created_at (System timestamp)
                        const createdA = new Date(a.created_at).getTime();
                        const createdB = new Date(b.created_at).getTime();
                        return createdB - createdA;
                    });
                });
            }

            // Keep the user's selected date in local storage
            localStorage.setItem("last_lead_date", formData.updated_at);
            setFormData(resetFormKeepSettings(formData));

        } catch (error) {
            console.log(error)
        } finally {
            setLoading(false)
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
                        ].map((h, i) => {
                            // LOGIC FOR STICKY HEADERS
                            let stickyClass = "";

                            // Column 1 (Tanggal): Width 100px
                            if (i === 0) stickyClass = "sticky left-0 z-20 bg-gray-50 w-[100px]";

                            // Column 2 (Nama): Width 150px (Starts at 100px)
                            else if (i === 1) stickyClass = "sticky left-[100px] z-20 bg-gray-50 w-[150px]";

                            // Column 3 (No HP): Width 120px (Starts at 100px + 150px = 250px)
                            else if (i === 2) stickyClass = "sticky left-[250px] z-20 bg-gray-50 w-[120px]";

                            return (
                                <th
                                    key={i}
                                    scope="col"
                                    className={`px-2 py-2 font-medium text-left border-r last:border-r-0 whitespace-nowrap ${stickyClass}`}
                                >
                                    {h}
                                </th>
                            );
                        })}
                    </tr>
                </thead>

                {/* INPUT ROW */}
                <tbody className="bg-white">
                    <tr className="border-b">

                        {/* 1. Date (Sticky left-0) */}
                        <td className="p-0 bg-white z-10 align-middle sticky left-0 border-r w-[100px]">
                            <div className="px-1 py-1">
                                <input
                                    type="date"
                                    value={formData.updated_at}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        setFormData((prev) => ({
                                            ...prev,
                                            updated_at: value,
                                        }));
                                        localStorage.setItem("last_lead_date", value);
                                    }}
                                    className="w-full bg-transparent outline-none focus:bg-gray-50 pl-1"
                                />
                            </div>
                        </td>

                        {/* 2. Nama (Sticky left-[100px]) */}
                        <td className="p-0 bg-white z-10 align-middle sticky left-[100px] border-r w-[150px]">
                            <div className="px-1">
                                <input
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="w-full h-8 px-1 bg-transparent outline-none focus:bg-gray-50"
                                />
                            </div>
                        </td>

                        {/* 3. No HP (Sticky left-[250px]) */}
                        <td className="p-0 bg-white z-10 align-middle sticky left-[250px] border-r w-[120px]">
                            <div className="px-1">
                                <input
                                    name="nomor_hp"
                                    value={formData.nomor_hp ?? ""}
                                    onChange={handleChange}
                                    className="w-full h-8 px-1 bg-transparent outline-none focus:bg-gray-50"
                                />
                            </div>
                        </td>

                        {/* Address (Standard Scrolling) */}
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
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            // Mencegah behavior default (jika ada form wrap)
                                            e.preventDefault();
                                            addLeads();
                                        }
                                    }}
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
                                    {
                                        loading ? "loading" : "tambah"
                                    }
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