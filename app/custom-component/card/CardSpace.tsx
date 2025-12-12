import { Progress } from "@/components/ui/progress";
import { ReactNode } from "react";

interface CardSpaceType {
    children: ReactNode
}

export default function CardSpace({ children }: CardSpaceType) {
    return (
        <div className="bg-white rounded-[10px] py-7 px-8 border">
            {children}
        </div>
    )
}