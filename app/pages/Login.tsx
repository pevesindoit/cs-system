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
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
// adjust your path

interface TypeRow {
    name: string;
}

interface UserTypeRecord {
    type_id: number;
    type: TypeRow | TypeRow[] | null;
}

export default function Login() {
    const [formData, setFormData] = useState<loginType>({
        email: "",
        password: "",
    });

    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const router = useRouter()

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleLogin = async () => {
        setLoading(true);
        setErrorMsg("");

        const res = await login(formData);

        if (res?.status !== 200) {
            setErrorMsg(res?.data.error || "Login failed");
            setLoading(false);
            return;
        }

        const session = res.data.session;

        await supabaseBrowser.auth.setSession({
            access_token: session.access_token,
            refresh_token: session.refresh_token,
        });

        const { data, error } = await supabaseBrowser
            .from("users")
            .select("type_id, type(name)")
            .eq("id", session.user.id)
            .single<UserTypeRecord>();

        if (error || !data) {
            setErrorMsg("Gagal mengambil tipe user");
            setLoading(false);
            return;
        }

        const typeField = data.type;

        const userType = Array.isArray(typeField)
            ? typeField[0]?.name
            : typeField?.name;

        await supabaseBrowser.auth.updateUser({
            data: { type: userType },
        });

        if (userType === "cs") router.push("/cs");
        else if (userType === "manager") router.push("/manager");
        else router.push("/");

        setLoading(false);
    };

    // const handleLogout = async () => {
    //     const { error } = await supabaseBrowser.auth.signOut();
    //     if (!error) router.push("/login");
    // };

    return (
        <Card className="w-full max-w-sm">
            <CardContent className="space-y-4">
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

                {/* <Button
                    onClick={handleLogout}
                    variant="outline"
                    className="w-full"
                >
                    Logout
                </Button> */}
            </CardContent >
        </Card >
    );
}
