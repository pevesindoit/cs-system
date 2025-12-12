"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { DropDown } from "../custom-component/DropDown";
import { getBranch, getType } from "../function/fetch/get/fetch";
import { addUser } from "../function/fetch/auth/fetch";

// Define the shape your DropDown expects
export default function AddNewUser() {
    const [formData, setFormData] = useState<formType>({
        email: "",
        password: "",
        cabang: "",
        type: 0,
        nama: "",
    });

    const [typeList, setTypeList] = useState<SelectItemData[]>([]);
    const [branchList, setBranchList] = useState<SelectItemData[]>([]);

    useEffect(() => {
        const fetchTypes = async () => {
            const res = await getType();
            const rawData = res?.data.data || [];

            // Fixed: Use TypeType (or any) here, not BranchType
            const formattedList = rawData.map((item: itemType) => ({
                value: String(item.id),
                label: item.name
            }));

            setTypeList(formattedList);
        };

        fetchTypes();
    }, []);

    useEffect(() => {
        const fetchBranch = async () => {
            const res = await getBranch();
            const rawData = res?.data.data || [];

            // Fixed: Use BranchType (or any) here, not TypeType
            const formattedList = rawData.map((item: itemType) => ({
                value: String(item.id),
                label: item.name
            }));

            setBranchList(formattedList);
        };

        fetchBranch();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSignup = async () => {
        console.log("Submitting:", formData);
        const res = addUser(formData)
        console.log(res)
    };

    return (
        <div className="grid grid-cols-1 gap-5 bg-white p-10">
            <div className="space-y-1">
                <Label>Nama</Label>
                <Input name="nama" value={formData.nama} onChange={handleChange} />
            </div>
            <div className="space-y-1">
                <Label>Email</Label>
                <Input name="email" value={formData.email} onChange={handleChange} />
            </div>
            <div className="space-y-1">
                <Label>Password</Label>
                <Input type="password" name="password" value={formData.password} onChange={handleChange} />
            </div>

            {/* BRANCH (CABANG) DROPDOWN */}
            <div className="space-y-1">
                <DropDown
                    label="Select Cabang"
                    items={branchList}
                    // The Dropdown returns a string value
                    onValueChange={(value: string) =>
                        setFormData((prev) => ({ ...prev, cabang: value }))
                    }
                />
            </div>

            {/* TYPE DROPDOWN */}
            <div className="space-y-1">
                <DropDown
                    label="Select Type"
                    items={typeList}
                    // ✅ FIXED: accept string, convert to Number
                    onValueChange={(value: string) =>
                        setFormData((prev) => ({ ...prev, type: Number(value) }))
                    }
                />
            </div>

            <Button onClick={handleSignup}>Create User</Button>
        </div>
    );
}