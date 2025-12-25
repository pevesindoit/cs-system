"use client"

import { useEffect, useState } from "react";
import { getAds, getCs, getPlatforms } from "../function/fetch/get/fetch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import H1 from "../custom-component/H1";
import { DropDown } from "../custom-component/DropDown";
import { Button } from "@/components/ui/button";
import { addAdss } from "../function/fetch/add/fetch";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import AdsTable from "../custom-component/card/AdsTable";
import { adsType, adsTypeError, itemType } from "../types/types";

export default function Manager() {
    const [formData, setFormData] = useState<adsType>({
        platform_id: "",
        daily_spend: "",
        branch_id: "",
        ads_manager_id: "",
        name: ""
    });

    const [user, setUser] = useState("")
    const [ads, setAds] = useState<adsTypeError[]>([]);
    const [branchs, setBranchs] = useState([]);
    const [platforms, setPlatforms] = useState([]);
    const router = useRouter();

    useEffect(() => {
        const fetchAds = async () => {
            const { data } = await supabaseBrowser.auth.getUser();
            if (!data?.user) {
                router.push("/login");
                return;
            }
            const res = await getAds(data?.user?.id); // <-- Create if not exist
            setAds(res?.data.data || []);
        };
        fetchAds();
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


    const addAds = async () => {
        const finalData = {
            ...formData,
            ads_manager_id: user,   // 👈 Add logged-in user's ID
        };
        const res = await addAdss(finalData)
        console.log(res)
        setAds(res?.data.allLeads)
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

    useEffect(() => {
        const fetch = async () => {
            const res = await getCs()
            const rawData = res?.data
            const formattedListPlatform = rawData.platform.map((item: itemType) => ({
                value: item.id,
                label: item.name,
                classname: item.classname
            }));
            const formattedListBranch = rawData.branch.map((item: itemType) => ({
                value: item.id,
                label: item.name,
                classname: item.classname
            }));
            setPlatforms(formattedListPlatform)
            setBranchs(formattedListBranch)
        }
        fetch()
    }, [])

    return (
        <div className="space-y-7">
            <div className="border rounded-[5px] h-full py-10 px-9 bg-[#FEFEFE] grid grid-cols-1 gap-8">
                <H1>Ads Management</H1>
                <div className="space-y-2">
                    <Label className="font-normal">Ads Name</Label>
                    <Input name="name" value={formData.name} onChange={handleChange} />
                </div>

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
                    <Label className="font-normal">Cabang</Label>
                    <DropDown
                        items={branchs}
                        onValueChange={(value: string) => {
                            setFormData((prev) => ({ ...prev, branch_id: value }))
                        }}
                        placeholder="Select status..." />
                </div>
                <div className="space-y-2">
                    <Label className="font-normal">Daily Spend (RP)</Label>
                    <Input name="daily_spend" value={formData.daily_spend} onChange={handleChange} type="number" />
                </div>
                <Button onClick={addAds}>Kirim</Button>
            </div>
            <AdsTable data={ads} />
        </div >
    )
}