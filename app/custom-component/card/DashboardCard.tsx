"use client"

import { ReactNode } from "react";

interface StatCardProps {
    label: string;
    value: string;
    subLabel?: string;
    icon?: ReactNode;
}

export default function DashboardCard({ label, value, subLabel, icon }: StatCardProps) {
    return (
        <div className="bg-white rounded-[10px] py-7 px-8 border grid grid-cols-[77%_23%]">
            <div className="space-y-5 w-full">
                <h4 className="scroll-m-20 text-[.8rem] text-gray-600 tracking-tight">
                    {label}
                </h4>

                <h3 className="font-bold text-2xl w-full">
                    {value}
                </h3>

                {subLabel && (
                    <p className="text-[.6rem] text-gray-500">
                        {subLabel}
                    </p>
                )}
            </div>

            <div className="flex justify-end">
                <div className="bg-black w-[80%] h-[45%] rounded-[5px] text-white flex justify-around items-center">
                    {icon}
                </div>
            </div>
        </div>
    );
}
