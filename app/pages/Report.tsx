"use client";

import { useEffect, useState } from "react";
import H1 from "../custom-component/H1";
import { getCs, getReport } from "../function/fetch/get/fetch";
import DateRangePicker from "../custom-component/DateRangePicker";
import { itemType, ReportItem } from "../types/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button"; // Assuming you have a Button component
import { DropDown } from "../custom-component/DropDown";

// 1. Define Types for cleaner code
type FormDataType = {
    start_date: string;
    end_date: string;
    platform_id: string;
    target_lead: number; // Allow string for input handling
    target_omset: number;
    branch_id: string;
};

const GetDefaultDate = () => {
    const today = new Date();
    const end = today.toISOString().split("T")[0];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    const start = startDate.toISOString().split("T")[0];

    return {
        start_date: start,
        end_date: end,
    };
};

export default function Report() {
    // --- STATE ---
    const [range, setRange] = useState(GetDefaultDate());

    // Initial State
    const [formData, setFormData] = useState<FormDataType>({
        start_date: range.start_date,
        end_date: range.end_date,
        platform_id: "",
        target_lead: 0, // Use empty string for inputs instead of null
        target_omset: 0,
        branch_id: ""
    });

    const [reportData, setReportData] = useState([]);
    const [reportSummary, setReportSummary] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [branchs, setBranchs] = useState([]);
    const [platforms, setPlatforms] = useState([]);

    // --- EFFECTS ---

    // 1. Sync DateRangePicker with FormData
    // When 'range' changes, update 'formData' automatically
    useEffect(() => {
        setFormData((prev) => ({
            ...prev,
            start_date: range.start_date,
            end_date: range.end_date,
        }));
    }, [range]);

    // 2. Fetch Existing Report Data
    useEffect(() => {
        const fetchData = async () => {
            if (!range.start_date || !range.end_date) return;

            try {
                setLoading(true);
                const payload: ReportItem = {
                    start_date: range.start_date,
                    end_date: range.end_date,
                };

                const res = await getReport(payload);
                setReportSummary(res?.data?.data?.summary);

                if (res?.data) {
                    setReportData(res.data.data);
                }
            } catch (error) {
                console.error("Error fetching report:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [range]);

    // --- HANDLERS ---

    // 3. Generic Input Change Handler
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type } = e.target; // Get 'type' as well

        // If the input type is number, parse it. Otherwise use the string value.
        // Alternatively, you can check by field name: if (name === 'target_lead') ...
        const finalValue = type === 'number' ? (value === "" ? 0 : Number(value)) : value;

        setFormData((prev) => ({
            ...prev,
            [name]: finalValue,
        }));
    };

    // 4. Submit Handler
    const handleSave = async () => {
        setIsSaving(true);

        try {
            const res = await getReport(formData);
            console.log(res, "ini hasilnya")
            await new Promise(resolve => setTimeout(resolve, 1000));
            alert("Data saved successfully!");

        } catch (error) {
            console.error("Failed to save:", error);
            alert("Failed to save data");
        } finally {
            setIsSaving(false);
        }
    };

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

    if (loading) return <div>Loading Report...</div>;

    return (
        <div className="space-y-6">
            <H1>Performance Report</H1>

            <div className="flex flex-col gap-4">
                {/* Date Picker (Updates Range & FormData) */}
                <DateRangePicker onChange={setRange} />

                {/* --- FORM INPUTS --- */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-6 border rounded-md">

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
                            label="Cabang"
                            items={branchs}
                            // The Dropdown returns a string value
                            onValueChange={(value: string) =>
                                setFormData((prev) => ({ ...prev, branch_id: value }))
                            }
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Target Lead</label>
                        <Input
                            name="target_lead"
                            type="number"
                            placeholder="Ex: 100"
                            value={formData.target_lead}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Target Omset</label>
                        <Input
                            name="target_omset"
                            type="number"
                            placeholder="Ex: 5000000"
                            value={formData.target_omset}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="md:col-span-3 flex justify-end">
                        <Button onClick={handleSave} disabled={isSaving}>
                            {isSaving ? "Saving..." : "Save Target"}
                        </Button>
                    </div>
                </div>
            </div>

            {/* --- REPORT DISPLAY --- */}
            <div className="border rounded-[5px] h-full py-10 px-9 bg-[#FEFEFE] gap-8">
                {/* Your report visualization goes here */}
                <pre>{JSON.stringify(reportSummary, null, 2)}</pre>
            </div>
        </div>
    );
}