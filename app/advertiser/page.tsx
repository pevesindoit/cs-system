"use client";

import { useEffect, useState } from "react";
import AddDailyOmset from "../custom-component/card/AddDailyOmset";
import AddRealOmset from "../custom-component/card/AddRealOmset";
import CollapsibleCard from "../custom-component/reusable-component/CollapsibleCard";
import Adverticer from "../pages/Adverticer";
import { getCs } from "@/app/function/fetch/get/fetch";
import { itemType, SelectItemData } from "@/app/types/types";

type SyncStatus = "idle" | "loading" | "success" | "error";

export default function Page() {
    const [platformsAds, setPlatformsAds] = useState<SelectItemData[]>([]);
    const [branches, setBranches] = useState<SelectItemData[]>([]);
    const [platforms, setPlatforms] = useState<SelectItemData[]>([]);

    // Meta Sync state
    const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");
    const [syncMessage, setSyncMessage] = useState<string>("");

    useEffect(() => {
        const fetchGlobalData = async () => {
            const res = await getCs();
            const rawData = res?.data;

            if (rawData) {
                const formattedPlatforms = rawData.ads_platform?.map((item: itemType) => ({
                    value: item.id,
                    label: item.name,
                    classname: item.classname
                })) || [];

                const formattedPlatformsNotAds = rawData.platform?.map((item: itemType) => ({
                    value: item.id,
                    label: item.name,
                    classname: item.classname
                })) || [];

                const formattedBranches = rawData.branch?.map((item: itemType) => ({
                    value: item.id,
                    label: item.name,
                    classname: item.classname
                })) || [];

                setPlatformsAds(formattedPlatforms);
                setPlatforms(formattedPlatformsNotAds);
                setBranches(formattedBranches);
            }
        };
        fetchGlobalData();
    }, []);

    const handleMetaSync = async () => {
        setSyncStatus("loading");
        setSyncMessage("");
        try {
            const res = await fetch("/api/post/sync-meta-data", { method: "POST" });
            const data = await res.json();

            if (!res.ok || data.error) {
                setSyncStatus("error");
                setSyncMessage(data.error ?? "Unknown error");
            } else {
                const inserted: number = data.inserted ?? 0;
                const skipped: string[] = data.skipped ?? [];
                let msg = `${inserted} campaign${inserted !== 1 ? "s" : ""} inserted`;
                if (skipped.length > 0) {
                    msg += ` · ${skipped.length} skipped (no matching branch: ${skipped.join(", ")})`;
                }
                setSyncStatus("success");
                setSyncMessage(msg);
            }
        } catch {
            setSyncStatus("error");
            setSyncMessage("Failed to reach sync endpoint");
        }

        // Reset to idle after 6 seconds
        setTimeout(() => {
            setSyncStatus("idle");
            setSyncMessage("");
        }, 6000);
    };

    return (
        <div className="p-4 max-w-7xl mx-auto space-y-4">
            <div className="w-full flex justify-end items-center gap-3 text-[.8rem]">
                {syncMessage && (
                    <span className={`text-xs font-medium ${
                        syncStatus === "error" ? "text-red-500" : "text-green-600"
                    }`}>
                        {syncMessage}
                    </span>
                )}
                <button
                    onClick={handleMetaSync}
                    disabled={syncStatus === "loading"}
                    className="bg-black px-3 py-1 rounded-lg text-white hover:bg-gray-800 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                    {syncStatus === "loading" && (
                        <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                        </svg>
                    )}
                    {syncStatus === "loading" ? "Syncing..." : "Sync Meta"}
                </button>
            </div>

            {/* 1. Advertiser Section */}
            <CollapsibleCard title="Advertiser Dashboard" defaultOpen={true}>
                <Adverticer
                    platforms={platformsAds}
                    branches={branches}
                />
            </CollapsibleCard>

            {/* 2. Real Omset Section */}
            <CollapsibleCard title="Input Real Omset" defaultOpen={false}>
                <AddRealOmset platforms={platformsAds}
                    branches={branches} />
            </CollapsibleCard>

            {/* 3. Social Growth Section */}
            <CollapsibleCard title="Input Social Media Growth" defaultOpen={false}>
                <AddDailyOmset platforms={platforms}
                    branches={branches} />
            </CollapsibleCard>

        </div>
    );
}