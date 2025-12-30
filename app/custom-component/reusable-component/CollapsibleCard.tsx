"use client";

import { useState, ReactNode } from "react";

interface Props {
    title: string;
    children: ReactNode;
    defaultOpen?: boolean;
}

export default function CollapsibleCard({ title, children, defaultOpen = false }: Props) {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="w-full border rounded-lg bg-white shadow-sm mb-4 overflow-hidden">
            {/* HEADER */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
            >
                <span className="font-semibold text-gray-700">{title}</span>

                {/* Chevron Icon */}
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${isOpen ? "rotate-180" : "rotate-0"
                        }`}
                >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
            </button>

            {/* CONTENT */}
            {isOpen && (
                // Added 'overflow-x-auto' here to enable horizontal scrolling
                <div className="border-t border-gray-100 p-4 overflow-x-auto">
                    {/* min-w-full ensures that if the content is small, it still takes full width,
             but if it's large, it respects the child's width.
          */}
                    <div className="min-w-full">
                        {children}
                    </div>
                </div>
            )}
        </div>
    );
}