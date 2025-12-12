"use client";

import { useAuth } from "./global/AuthProfider";
import { ReactNode } from "react";
import { CircleDollarSign, LayoutDashboard, Users } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { useRouter, usePathname } from "next/navigation";

type MenuGroup = {
    group: string;
    items: {
        icon: ReactNode;
        link: string;
        text: string;
    }[];
};

export default function SideBar() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    const menuList: MenuGroup[] = [
        {
            group: "Admin",
            items: [
                { link: "/dashboard", icon: <LayoutDashboard size={16} />, text: "Dashboard" },
                { link: "/cs", icon: <Users size={16} />, text: "CS" },
                { link: "/manager", icon: <CircleDollarSign size={16} />, text: "Manager" }
            ],
        },
    ];

    const handleLogout = async () => {
        const { error } = await supabaseBrowser.auth.signOut();
        if (!error) router.push("/login");
    };

    if (loading) return null;
    if (!user) return null;

    return (
        <div className="w-[20%] px-3 py-3">
            <div className="border rounded-[5px] h-full py-4 px-5 bg-[#FEFEFE] flex flex-col justify-between">

                {/* TOP MENU */}
                <nav className="space-y-4">
                    {menuList.map((group, index) => (
                        <div key={index}>
                            <p className="text-xs text-gray-500 mb-2">{group.group}</p>

                            <div className="space-y-1">
                                {group.items.map((item, idx) => {
                                    const isActive = pathname === item.link;

                                    return (
                                        <Link
                                            key={idx}
                                            href={item.link}
                                            className={`
                        flex items-center gap-3 px-3 py-2 rounded-md
                        transition-all
                        ${isActive ? "bg-gray-100" : "hover:bg-gray-100"}
                      `}
                                        >
                                            {item.icon}
                                            {item.text}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </nav>

                {/* BOTTOM USER INFO */}
                <div className="pt-4">
                    <Button onClick={handleLogout}>Logout</Button>

                    <p className="mt-3 text-sm">
                        <span className="font-medium">{user.email}</span>
                    </p>
                </div>

            </div>
        </div>
    );
}
