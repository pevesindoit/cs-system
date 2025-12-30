"use client";

import { useEffect, useState } from "react";
import H1 from "../custom-component/H1";
import { getCs, getReport } from "../function/fetch/get/fetch";
import { itemType, ReportItem, ReportSummaryData } from "../types/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DropDown } from "../custom-component/DropDown";
import { ReportSummary } from "../custom-component/table/ReportSummary";
import { ReportDetail } from "../custom-component/table/ReportDetail";
import ReportBranch from "../custom-component/card/ReportBranch";
import DateMountSelector from "../custom-component/formater/DateMountSelector";


type FormDataType = {
    start_date: string;
    end_date: string;
    platform_id: string; // Now stores NAME (e.g. "Meta")
    target_lead: number;
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
    const [range, setRange] = useState(GetDefaultDate());

    const [formData, setFormData] = useState<FormDataType>({
        start_date: range.start_date,
        end_date: range.end_date,
        platform_id: "",
        target_lead: 0,
        target_omset: 0,
        branch_id: ""
    });

    const [reportData, setReportData] = useState<ReportSummaryData | null>(null);
    const [reportDetail, setReportDetail] = useState([]);
    const [reportBranch, setReportBranch] = useState([]);

    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [branchs, setBranchs] = useState([]);
    const [platforms, setPlatforms] = useState([]);

    useEffect(() => {
        setFormData((prev) => ({
            ...prev,
            start_date: range.start_date,
            end_date: range.end_date,
        }));
    }, [range]);

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

                if (res?.data?.data) {
                    setReportData(res.data.data.summary);
                    setReportDetail(res.data.data.daily_breakdown);
                    setReportBranch(res.data.data.branch_breakdown || []);
                }
            } catch (error) {
                console.error("Error fetching report:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [range]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type } = e.target;
        const finalValue = type === 'number' ? (value === "" ? 0 : Number(value)) : value;

        setFormData((prev) => ({
            ...prev,
            [name]: finalValue,
        }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const res = await getReport(formData);
            if (res?.data?.data) {
                setReportData(res.data.data.summary);
                setReportDetail(res.data.data.daily_breakdown);
                setReportBranch(res.data.data.branch_breakdown || []);
            }
        } catch (error) {
            console.error("Failed to save:", error);
        } finally {
            setIsSaving(false);
        }
    };

    useEffect(() => {
        const fetch = async () => {
            const res = await getCs()
            const rawData = res?.data

            // --- MODIFIED SECTION ---
            // Use item.name as the value so we send "Meta" instead of "UUID"
            const formattedListPlatform = rawData?.ads_platform?.map((item: itemType) => ({
                value: item.name, // <--- CHANGED TO NAME
                label: item.name,
                classname: item.classname
            })) || [];

            const formattedListBranch = rawData?.branch?.map((item: itemType) => ({
                value: item.id,
                label: item.name,
                classname: item.classname
            })) || [];

            setPlatforms(formattedListPlatform)
            setBranchs(formattedListBranch)
        }
        fetch()
    }, [])

    if (loading) return <div>Loading Report...</div>;

    return (
        <div className="space-y-6">
            <H1>Manager Report</H1>
            <div className="flex flex-col gap-4">
                <DateMountSelector onChange={setRange} />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-6 border rounded-md">
                    <div className="space-y-2">
                        <DropDown
                            label="Platform"
                            items={platforms}
                            onValueChange={(value: string) =>
                                setFormData((prev) => ({ ...prev, platform_id: value }))
                            }
                        />
                    </div>

                    <div className="space-y-2">
                        <DropDown
                            label="Cabang"
                            items={branchs}
                            onValueChange={(value: string) =>
                                setFormData((prev) => ({ ...prev, branch_id: value }))
                            }
                        />
                    </div>

                    {/* Targets Inputs (unchanged) */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Target Lead</label>
                        <Input
                            name="target_lead"
                            type="number"
                            value={formData.target_lead}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Target Omset</label>
                        <Input
                            name="target_omset"
                            type="number"
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

            <div className="border rounded-[5px] h-full py-10 px-9 bg-[#FEFEFE] gap-8 space-y-8">
                <ReportBranch data={reportBranch} />
                <ReportDetail data={reportDetail} />
                <ReportSummary data={reportData} />
            </div>
        </div>
    );
}