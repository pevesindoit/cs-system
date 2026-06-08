"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

export default function ChangePassword() {
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleUpdate = async () => {
        if (!password) {
            setError("Password cannot be empty");
            return;
        }

        setLoading(true);
        setMessage("");
        setError("");
        
        const { data, error } = await supabaseBrowser.auth.updateUser({
            password: password
        });

        setLoading(false);

        if (error) {
            setError(error.message);
        } else {
            setMessage("Password updated successfully!");
            setPassword("");
        }
    };

    return (
        <div className="grid grid-cols-1 gap-5 bg-white p-10 border rounded-[5px]">
            <h1 className="text-xl font-bold">Change Password</h1>
            <p className="text-sm text-gray-500 mb-4">
                Update your account password here. You can change your password without email verification since you are already logged in.
            </p>
            <div className="space-y-1">
                <Label>New Password</Label>
                <Input 
                    type="password" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    placeholder="Enter new password"
                />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            {message && <p className="text-green-500 text-sm">{message}</p>}
            <Button onClick={handleUpdate} disabled={loading} className="w-max">
                {loading ? "Updating..." : "Update Password"}
            </Button>
        </div>
    );
}
