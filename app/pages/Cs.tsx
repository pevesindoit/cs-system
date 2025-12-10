"use client"

import { useEffect, useState } from "react";
import { getPlatforms } from "../function/fetch/get/fetch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import H1 from "../custom-component/H1";
import { DropDown } from "../custom-component/DropDown";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { addLead } from "../function/fetch/add/fetch";

export default function Cs() {
    const [formData, setFormData] = useState<leadsType>({
        platform_id: "",
        status: "",
        nominal: "",
        reason: "",
        name: "",
        user_id: "1a23549a-31ec-4adf-a548-0ba44f8674a7",
    });

    const [platforms, setPlatforms] = useState<SelectItemData[]>([]);

    const status = [
        { label: "Cosed", value: "closed" },
        { label: "Followup", value: "followup" },
        { label: "Los", value: "los" }
    ]

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
        const res = await addLead(formData)
        console.log(res)
    }

    return (
        <div>
            <H1>Leads Management</H1>
            <div className="border rounded-[5px] h-full py-5 px-6 bg-[#FEFEFE] grid grid-cols-1 gap-4">
                <div className="space-y-2">
                    <Label>Nama Costumer</Label>
                    <Input name="name" value={formData.name} onChange={handleChange} />
                </div>
                <div className="grid grid-cols-2 gap-4">
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
                    <Label>Nominal</Label>
                    <Input name="nominal" value={formData.nominal} onChange={handleChange} type="number" />
                </div>
                <div className="space-y-2">
                    <Label>Alasan Closing / Tidak Closing</Label>
                    <Textarea name="reason" value={formData.reason} onChange={handleChange} />
                </div>
                <Button onClick={addLeads}>Kirim</Button>
            </div>
        </div>
    )
}