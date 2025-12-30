"use client";

import { useEffect, useState } from "react";
import AddDailyOmset from "../custom-component/card/AddDailyOmset";
import AddRealOmset from "../custom-component/card/AddRealOmset";
import CollapsibleCard from "../custom-component/reusable-component/CollapsibleCard";
import Adverticer from "../pages/Adverticer";
import { getCs } from "@/app/function/fetch/get/fetch"; // Import getCs here
import { itemType, SelectItemData, SelectItemDataInt } from "@/app/types/types";

export default function Page() {
    // 1. Lift State Up
    const [platforms, setPlatforms] = useState<SelectItemData[]>([]);
    const [branches, setBranches] = useState<SelectItemData[]>([]);

    // 2. Fetch Once on Mount
    useEffect(() => {
        const fetchGlobalData = async () => {
            const res = await getCs();
            const rawData = res?.data;

            if (rawData) {
                // Format Platforms
                const formattedPlatforms = rawData.ads_platform?.map((item: itemType) => ({
                    value: item.id,
                    label: item.name,
                    classname: item.classname
                })) || [];

                // Format Branches
                const formattedBranches = rawData.branch?.map((item: itemType) => ({
                    value: item.id,
                    label: item.name,
                    classname: item.classname
                })) || [];

                setPlatforms(formattedPlatforms);
                setBranches(formattedBranches);
            }
        };
        fetchGlobalData();
    }, []);

    return (
        <div className="p-4 max-w-7xl mx-auto space-y-4">

            {/* 1. Advertiser Section (Needs BOTH Platforms & Branches) */}
            <CollapsibleCard title="Advertiser Dashboard" defaultOpen={true}>
                <Adverticer
                    platforms={platforms}
                    branches={branches}
                />
            </CollapsibleCard>

            {/* 2. Real Omset Section (Needs Branches only) */}
            <CollapsibleCard title="Input Real Omset" defaultOpen={false}>
                <AddRealOmset platforms={platforms}
                    branches={branches} />
            </CollapsibleCard>

            {/* 3. Social Growth Section (Needs Platforms only) */}
            <CollapsibleCard title="Input Social Media Growth" defaultOpen={false}>
                <AddDailyOmset platforms={platforms}
                    branches={branches} />
            </CollapsibleCard>

        </div>
    );
}