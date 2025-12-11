"use client"

import { useEffect, useState } from "react";
import { getLeads, getPlatforms } from "../function/fetch/get/fetch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import H1 from "../custom-component/H1";
import { DropDown } from "../custom-component/DropDown";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { addLead } from "../function/fetch/add/fetch";
import LeadTable from "../custom-component/card/LeadTable";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

export default function Cs() {
    const [formData, setFormData] = useState<leadsType>({
        platform_id: "",
        status: "",
        nominal: "",
        reason: "",
        name: "",
        user_id: "",
    });

    const [platforms, setPlatforms] = useState<SelectItemData[]>([]);
    const router = useRouter();
    const [user, setUser] = useState("")

    const status = [
        { label: "Cosed", value: "closed" },
        { label: "Followup", value: "followup" },
        { label: "Los", value: "los" }
    ]
    const [leads, setLeads] = useState<leadsTypeError[]>([]);

    useEffect(() => {
        const fetchLeads = async () => {
            const { data } = await supabaseBrowser.auth.getUser();
            if (!data?.user) {
                router.push("/login");
                return;
            }
            const res = await getLeads(data?.user?.id); // <-- Create if not exist
            setLeads(res?.data.data || []);
        };
        fetchLeads();
    }, [router]);

    useEffect(() => {
        const fetchPlatforms = async () => {
            const res = await getPlatforms();
            const rawData = res?.data.data || [];

            // Fixed: Use TypeType (or any) here, not BranchType
            const formattedList = rawData.map((item: itemType) => ({
                value: String(item.id),
                label: item.name
            }));

            setPlatforms(formattedList);
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
        const finalData = {
            ...formData,
            user_id: user,   // 👈 Add logged-in user's ID
        };
        const res = await addLead(finalData)
        console.log(res)
        setLeads(res?.data.allLeads)
    }

    useEffect(() => {
        async function loadUser() {
            const { data } = await supabaseBrowser.auth.getUser();

            if (!data?.user) {
                router.push("/login");
                return;
            }

            setUser(data.user.id);
        }

        loadUser();
    }, [router]);

    return (
        <div className="space-y-7">
            <div className="border rounded-[5px] h-full py-10 px-9 bg-[#FEFEFE] grid grid-cols-1 gap-8">
                <H1>Leads Management</H1>
                <div className="space-y-2">
                    <Label className="font-normal">Nama Costumer</Label>
                    <Input name="name" value={formData.name} onChange={handleChange} />
                </div>
                <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-2">
                        <DropDown
                            label="Platform"
                            items={platforms}
                            // The Dropdown returns a string value
                            onValueChange={(value: string) =>
                                setFormData((prev) => ({ ...prev, platform_id: value }))
                            }
                        />
                    </div>
                    <div className="space-y-2">
                        <DropDown
                            label="Status"
                            items={status}
                            // The Dropdown returns a string value
                            onValueChange={(value: string) =>
                                setFormData((prev) => ({ ...prev, status: value }))
                            }
                        />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label className="font-normal">Nominal</Label>
                    <Input name="nominal" value={formData.nominal} onChange={handleChange} type="number" />
                </div>
                <div className="space-y-2">
                    <Label className="font-normal">Alasan Closing / Tidak Closing</Label>
                    <Textarea name="reason" value={formData.reason} onChange={handleChange} />
                </div>
                <Button onClick={addLeads}>Kirim</Button>
            </div>
            <LeadTable data={leads} />
        </div>
    )
}