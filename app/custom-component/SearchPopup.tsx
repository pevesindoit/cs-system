"use client"

import * as React from "react"
import { Search, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

// 1. Update props to match your parent state (number | undefined)
interface SearchPopupProps {
    value: number | undefined
    onChange: (value: number | undefined) => void
}

export function SearchPopup({ value, onChange }: SearchPopupProps) {
    const [isOpen, setIsOpen] = React.useState(false)
    const inputRef = React.useRef<HTMLInputElement>(null)

    React.useEffect(() => {
        if (isOpen) {
            inputRef.current?.focus()
        }
    }, [isOpen])

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Escape") {
            setIsOpen(false)
        }
    }

    return (
        <div
            className={cn(
                "fixed right-5 bottom-5 z-50 flex items-center",
                isOpen ? "bg-white shadow-md border rounded-md" : "bg-transparent"
            )}
        >
            <div
                className={cn(
                    "overflow-hidden transition-all duration-300 ease-in-out",
                    isOpen ? "w-64 opacity-100 mr-2" : "w-0 opacity-0 mr-0"
                )}
            >
                <Input
                    ref={inputRef}
                    type="number"
                    placeholder="Search ID..."
                    className="border-none shadow-none focus-visible:ring-0 px-3"

                    // 2. Handle the display value (convert undefined to empty string)
                    value={value ?? ""}

                    // 3. Handle the change (convert string back to number)
                    onChange={(e) => {
                        const val = e.target.value;
                        // Jika kosong, kirim undefined atau null, jangan biarkan string kosong memicu search "0" jika tipe number
                        onChange(val === "" ? undefined : Number(val));
                    }}

                    onKeyDown={handleKeyDown}
                />
            </div>

            <Button
                variant="ghost"
                size="icon"
                className={cn(
                    "rounded-full hover:bg-gray-200 bg-white shadow-sm",
                    isOpen && "hover:bg-transparent shadow-none bg-transparent"
                )}
                onClick={() => setIsOpen(!isOpen)}
            >
                {isOpen ? (
                    <X className="h-4 w-4 text-gray-500" />
                ) : (
                    <Search className="h-4 w-4" />
                )}
            </Button>
        </div>
    )
}