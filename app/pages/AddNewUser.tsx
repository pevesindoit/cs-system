"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { DropDown } from "../custom-component/DropDown";
import { getBranch, getType } from "../function/fetch/get/fetch";

// Define the shape your DropDown expects
interface SelectItemData {
    value: string;
    label: string;
}

export default function AddNewUser() {
    const [formData, setFormData] = useState({
        email: "",
        password: "",
        cabang: "", // Stores Branch ID
        type: "",   // Stores Type ID
        nama: "",
    });

    // Fix 1: State matches Dropdown requirements
    const [typeList, setTypeList] = useState<SelectItemData[]>([]);
    const [branchList, setBranchList] = useState<SelectItemData[]>([]);

    useEffect(() => {
        const fetchTypes = async () => {
            const res = await getType();
            const rawData = res?.data.data || [];

            // Map DB data to Dropdown format
            const formattedList = rawData.map((item: BranchType) => ({
                value: String(item.id), // Ensure ID is string
                label: item.name
            }));

            // Fix 2: Set the correct state (was setBranchList)
            setTypeList(formattedList);
        };

        fetchTypes();
    }, []);

    useEffect(() => {
        const fetchBranch = async () => {
            const res = await getBranch();
            const rawData = res?.data.data || [];

            const formattedList = rawData.map((item: TypeType) => ({
                value: String(item.id),
                label: item.name
            }));

            // Fix 3: Set the correct state (was setTypeList)
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
        // Call your API here
    };

    return (
        <div className="p-4 grid grid-cols-1 gap-5">
            {/* ... Nama, Email, Password inputs (unchanged) ... */}
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

            <div className="space-y-1">
                <DropDown
                    label="Select Cabang"
                    items={branchList} // Now matches Type
                    onValueChange={(value) =>
                        // Fix 4: Update 'cabang', not 'type'
                        setFormData((prev) => ({ ...prev, cabang: value }))
                    }
                />
            </div>

            <div className="space-y-1">
                <DropDown
                    label="Select Type"
                    items={typeList}
                    onValueChange={(value) =>
                        setFormData((prev) => ({ ...prev, type: value }))
                    }
                />
            </div>

            <Button onClick={handleSignup}>Create User</Button>
        </div>
    );
}