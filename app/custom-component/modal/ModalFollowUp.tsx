import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createPortal } from "react-dom";
import { dataType } from "@/app/types/types";
import { addFollowups } from "@/app/function/fetch/add/fetch";

interface TextModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (message: string, newItem: any) => void;
    title?: string;
    placeholder?: string;
    data: dataType;
}

export function ModalFollowUp({
    isOpen,
    onClose,
    onSubmit,
    title = "Send Message",
    placeholder = "Type your message here...",
    data
}: TextModalProps) {
    const [text, setText] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async () => {
        if (!text.trim()) return;
        setIsSubmitting(true);

        try {
            const payload = {
                id: data.id,
                noted: text
            }

            // 1. Call API
            const res = await addFollowups(payload);

            // 2. OPTIMIZATION: Get ONLY 'newLead' from response
            if (!res) return
            const rawNewItem = res.data.newLead;

            // 3. Prepare the item for the UI
            // We manually add 'created_at' because 'newLead' usually doesn't have it immediately,
            // or we want to show "Just now" time.
            const uiItem = {
                ...rawNewItem,
                created_at: new Date().toISOString(), // Use current time
                note: text // Ensure note is there
            };

            // 4. Send ONLY the single new item to the parent
            onSubmit(text, uiItem);

            setText("");
        } catch (error) {
            console.error("Error submitting followup:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return createPortal(
        <div className="inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 sticky left-0">
            <div className="w-full max-w-md bg-white rounded-lg shadow-xl border overflow-hidden animate-in fade-in zoom-in-95 duration-200">

                <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
                    <h3 className="font-semibold text-sm text-gray-800">{title}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full p-1 transition-colors">
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="p-4">
                    <textarea
                        autoFocus
                        className="w-full min-h-[120px] p-3 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                        placeholder={placeholder}
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                    />
                </div>

                <div className="px-4 py-3 bg-gray-50 flex justify-end gap-2 border-t">
                    <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button size="sm" onClick={handleSubmit} disabled={!text.trim() || isSubmitting}>
                        {isSubmitting ? "Saving..." : "Send WhatsApp"}
                    </Button>
                </div>
            </div>
        </div>,
        document.body
    );
}