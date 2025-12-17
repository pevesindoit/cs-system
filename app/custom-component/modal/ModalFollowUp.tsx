"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button"; // Using your existing Button component

interface TextModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (text: string) => void;
    title?: string;
    placeholder?: string;
    isLoading?: boolean;
}

export function ModalFollowUp({
    isOpen,
    onClose,
    onSubmit,
    title = "Send Message",
    placeholder = "Type your message here...",
    isLoading = false,
}: TextModalProps) {
    const [text, setText] = useState("");

    if (!isOpen) return null;

    const handleSubmit = () => {
        if (!text.trim()) return;
        onSubmit(text);
        setText(""); // Optional: clear text after submit
    };

    return (
        // 1. Overlay (Backdrop)
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">

            {/* 2. Modal Container */}
            <div className="w-full max-w-md bg-white rounded-lg shadow-xl border overflow-hidden animate-in fade-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
                    <h3 className="font-semibold text-sm text-gray-800">{title}</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full p-1 transition-colors"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-4">
                    <textarea
                        autoFocus
                        className="w-full min-h-[120px] p-3 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                        placeholder={placeholder}
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                    />
                </div>

                {/* Footer */}
                <div className="px-4 py-3 bg-gray-50 flex justify-end gap-2 border-t">
                    <Button variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button
                        size="sm"
                        onClick={handleSubmit}
                        disabled={!text.trim() || isLoading}
                    >
                        {isLoading ? "Sending..." : "Submit"}
                    </Button>
                </div>

            </div>
        </div>
    );
}