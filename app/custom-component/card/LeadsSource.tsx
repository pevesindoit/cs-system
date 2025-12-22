import { Progress } from "@/components/ui/progress";
import CardSpace from "./CardSpace";

interface LeadSourceDetail {
    count: number;
    percentage: number;
}

interface LeadsSourceProps {
    data: Record<string, LeadSourceDetail>;
}

export default function LeadsSource({ data }: LeadsSourceProps) {
    console.log("ini yang didininya", data)
    return (
        <CardSpace>
            <div className="space-y-3 text-[.7rem]">
                <h4 className="scroll-m-20 text-[.8rem] text-gray-600 tracking-tight">
                    Sumber Leads
                </h4>

                {Object.entries(data).map(([platform, info]) => (
                    <div
                        key={platform}
                        className="items-center w-full grid grid-cols-[30%_50%_20%]"
                    >
                        <p className="capitalize">{platform}</p>

                        {/* percentage value for progress bar */}
                        <Progress value={info.percentage} className="w-full" />

                        {/* actual count */}
                        <p className="justify-end flex">{info.count}</p>
                    </div>
                ))}

            </div>
        </CardSpace>
    );
}
