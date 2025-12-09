"use client"
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DropDown } from "../custom-component/DropDown";
import { TextArea } from "../custom-component/TextArea";
import { Button } from "@/components/ui/button"
import { useState } from "react"

export default function Dashboard() {
    const [source, setSource] = useState("")
    const [notes, setNotes] = useState("")

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
                <TextArea
                    label="Lead Notes"
                    placeholder="Enter details about this lead..."
                    value={notes}
                    onValueChange={(val) => setNotes(val)}
                />
                <Button variant="outline" className="bg-[#1C1C1C] text-[#ECECEB] hover:bg-[#616161] hover:text-[#ECECEB]">Button</Button>
            </div>
        </div>
    );
}
