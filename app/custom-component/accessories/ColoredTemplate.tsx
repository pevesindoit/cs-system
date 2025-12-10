interface coloredTemplateType {
    children?: string,
    className?: string,
}

export default function ColoredTemplate({ children, className }: coloredTemplateType) {
    const bgColor = {
        closed: "bg-[#75F3CF] text-[#00A143]",
        "followup": "bg-[#FFF3C7] text-[#C54C20]",
        los: "bg-[#FFE3E5] text-[#D30051]",
    }[children as string] || "bg-red-300"; // default color

    return (
        <div className={`rounded-full py-2 px-3 text-center ${className} ${bgColor}`}>
            {children}
        </div>
    )
}