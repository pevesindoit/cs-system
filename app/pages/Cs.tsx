"use client"

import { useEffect, useState } from "react";
import { getLeads, getPlatforms } from "../function/fetch/get/fetch";
import { addLead } from "../function/fetch/add/fetch";
import LeadTable from "../custom-component/card/LeadTable";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { DropDownGrid } from "../custom-component/DropdownGrid";
import { DropDownGridInt } from "../custom-component/DropDownGridInt";

export default function Cs() {
    const [formData, setFormData] = useState<leadsType>({
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
        created_at: "",
        nomor_hp: ""
    });
    const [platforms, setPlatforms] = useState<SelectItemData[]>([]);
    const [channel, setChannel] = useState<SelectItemDataInt[]>([]);
    const [keteranganLeads, setKeteranganLeads] = useState<SelectItemDataInt[]>([]);
    const [pic, setPic] = useState<SelectItemDataInt[]>([]);
    const [branch, setBranch] = useState<SelectItemData[]>([]);
    const router = useRouter();
    const [user, setUser] = useState("")

    const status = [
        { label: "Cosed", value: "closed" },
        { label: "Followup", value: "followup" },
        { label: "Los", value: "los" }
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
        const fetchLeads = async () => {
            try {
                const { data } = await supabaseBrowser.auth.getUser();
                if (!data?.user) {
                    router.push("/login");
                    return;
                }
                const res = await getLeads(data?.user?.id); // <-- Create if not exist
                setLeads(res?.data.data || []);
            } catch (error) {
                console.log(error)
            }

        };
        fetchLeads();
    }, [router]);

    useEffect(() => {
        const fetchPlatforms = async () => {
            try {
                const res = await getPlatforms();
                const rawData = res?.data || [];

                // Fixed: Use TypeType (or any) here, not BranchType
                const formattedListPlatform = rawData.platform.map((item: itemType) => ({
                    value: item.id,
                    label: item.name
                }));

                const formattedListChannel = rawData.channel.map((item: itemType) => ({
                    value: item.id,
                    label: item.name
                }));

                const formattedListketeranganLeads = rawData.keteranganLeads.map((item: itemType) => ({
                    value: item.id,
                    label: item.name
                }));

                const formattedListPic = rawData.pic.map((item: itemType) => ({
                    value: item.id,
                    label: item.name
                }));

                const formattedListBranch = rawData.branch.map((item: itemType) => ({
                    value: String(item.id),
                    label: item.name
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


    return (
        <div className="space-y-0 py-3 pr-3">
            <div className="border rounded-md bg-white text-[10px] overflow-x-auto ">
                <div className="">

                    {/* HEADER */}
                    <div className="grid grid-cols-13 bg-gray-50 border-b">
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
                            <div
                                key={i}
                                className="px-2 py-2 font-medium border-r last:border-r-0"
                            >
                                {h}
                            </div>
                        ))}
                    </div>

                    {/* INPUT ROW */}
                    <div className="grid grid-cols-13 border-b">
                        {/* Nama */}
                        {/* Date */}
                        <div className="border-r px-1 flex ">
                            <input
                                type="date"
                                value={formData.created_at}
                                onChange={(e) => {
                                    const value = e.target.value;

                                    setFormData((prev) => ({
                                        ...prev,
                                        created_at: value,
                                    }));

                                    // remember last date
                                    localStorage.setItem("last_lead_date", value);
                                }}
                                className="w-full px-1 bg-transparent outline-none focus:bg-gray-50"
                            />
                        </div>

                        <div className="border-r px-1">
                            <input
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className="w-full h-6! px-1 bg-transparent outline-none focus:bg-gray-50"
                            />
                        </div>

                        <div className="border-r px-1">
                            <input
                                name="nomor_hp"
                                value={formData.nomor_hp}
                                onChange={handleChange}
                                className="w-full h-6! px-1 bg-transparent outline-none focus:bg-gray-50"
                            />
                        </div>

                        {/* Address */}
                        <div className="border-r px-1">
                            <input
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                className="w-full h-6! px-1 bg-transparent outline-none focus:bg-gray-50"
                            />
                        </div>

                        {/* Channel */}
                        <div className="border-r px-1">
                            <DropDownGridInt
                                items={channel}
                                onValueChange={(value) =>
                                    setFormData((prev) => ({ ...prev, channel_id: value }))
                                }
                            />
                        </div>

                        {/* Platform */}
                        <div className="border-r px-1">
                            <DropDownGrid
                                items={platforms}
                                onValueChange={(value) =>
                                    setFormData((prev) => ({ ...prev, platform_id: value }))
                                }
                            />
                        </div>

                        {/* Keterangan Leads */}
                        <div className="border-r px-1">
                            <DropDownGridInt
                                items={keteranganLeads}
                                onValueChange={(value) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        keterangan_leads_id: value, // ✅ number → number
                                    }))
                                }
                            />
                        </div>
                        {/* Status */}
                        <div className="border-r px-1">
                            <DropDownGrid
                                items={status}
                                onValueChange={(value) =>
                                    setFormData((prev) => ({ ...prev, status: value }))
                                }
                            />
                        </div>

                        {/* Nominal */}
                        <div className="border-r px-1">
                            <input
                                type="number"
                                name="nominal"
                                value={formData.nominal ?? ""}
                                onChange={handleChange}
                                className="w-full h-6! min-h-6 px-1 bg-transparent outline-none focus:bg-gray-50"
                            />
                        </div>
                        {/* pic */}
                        <div className="border-r px-1">
                            <DropDownGridInt
                                items={pic}
                                onValueChange={(value) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        pic_id: value, // ✅ number → number
                                    }))
                                }
                            />
                        </div>
                        {/* branch */}
                        <div className="border-r px-1">
                            <DropDownGrid
                                items={branch}
                                onValueChange={(value) =>
                                    setFormData((prev) => ({ ...prev, branch_id: value }))
                                }
                            />
                        </div>

                        {/* Reason */}
                        <div className="border-r px-1">
                            <input
                                name="reason"
                                value={formData.reason}
                                onChange={handleChange}
                                className="w-full h-6! min-h-6 px-1 bg-transparent outline-none focus:bg-gray-50"
                            />
                        </div>

                        {/* Action */}
                        <div className="flex justify-center items-center px-1 hover:bg-gray-100">
                            <button
                                onClick={addLeads}
                                className="text-[10px]"
                            >
                                tambah
                            </button>
                        </div>
                    </div>

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

                </div>
            </div>
        </div>

    )
}