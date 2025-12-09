"use client"
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DropDown } from "../custom-component/DropDown";
import { useState } from "react"

export default function Dashboard() {
    const [source, setSource] = useState("")

    const leadSources = [
        { value: "facebook", label: "Facebook" },
        { value: "tiktok", label: "TikTok" },
        { value: "instagram", label: "Instagram" },
        { value: "google", label: "Google Ads" },
        { value: "referral", label: "Friend Referral" },
    ]

    return (
        <div>
            <div className="grid w-full max-w-sm items-center gap-3">
                <Label htmlFor="email">Email</Label>
                <Input type="email" id="email" placeholder="Email" />
                <DropDown items={leadSources}
                    placeholder="Select a fruit"
                    label="Fruits"
                    onValueChange={(val) => setSource(val)} />
            </div>
        </div>
    );
}
