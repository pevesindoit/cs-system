"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { login } from "../function/fetch/auth/fetch";
import {
    Card,
    CardAction,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
// adjust your path

export default function Login() {
    const [formData, setFormData] = useState<loginType>({
        email: "",
        password: "",
    });

    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleLogin = async () => {
        setLoading(true);
        setErrorMsg("");

        const res = await login(formData); // <-- SAME as your AddNewUser pattern

        console.log(res)

        setLoading(false);
    };

    return (
        <Card className="w-full max-w-sm">
            <CardContent>
                <div className="space-y-1">
                    <Label>Email</Label>
                    <Input
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                    />
                </div>

                <div className="space-y-1">
                    <Label>Password</Label>
                    <Input
                        name="password"
                        type="password"
                        value={formData.password}
                        onChange={handleChange}
                    />
                </div>

                {errorMsg && (
                    <p className="text-red-600 text-sm">{errorMsg}</p>
                )}

                <Button onClick={handleLogin} disabled={loading}>
                    {loading ? "Logging in..." : "Login"}
                </Button>
            </CardContent >
        </Card >
    );
}
