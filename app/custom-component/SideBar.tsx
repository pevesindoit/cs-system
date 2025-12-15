"use client";

import { useState, ReactNode } from "react";
import { useAuth } from "./global/AuthProfider";
import {
    CircleDollarSign,
    LayoutDashboard,
    Users,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
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
    const [collapsed, setCollapsed] = useState(false);

    const menuList: MenuGroup[] = [
        {
            group: "Admin",
            items: [
                { link: "/dashboard", icon: <LayoutDashboard size={16} />, text: "Dashboard" },
                { link: "/cs", icon: <Users size={16} />, text: "CS" },
                { link: "/manager", icon: <CircleDollarSign size={16} />, text: "Manager" },
            ],
        },
    ];

    const handleLogout = async () => {
        const { error } = await supabaseBrowser.auth.signOut();

        document.cookie = "user-type=; path=/; max-age=0";
        document.cookie = "sb-access-token=; path=/; max-age=0";
        document.cookie = "sb-refresh-token=; path=/; max-age=0";

        router.push("/");
    };

    if (loading || !user) return null;

    return (
        <div
            className={`${collapsed ? "w-[72px]" : "w-[20%]"
                } px-3 py-3 transition-all duration-300`}
        >
            <div className={`${collapsed ? "p-1" : "p-2"} border rounded-[5px] h-full  bg-[#FEFEFE] flex flex-col justify-between`}>

                <div>
                    {/* TOGGLE BUTTON */}
                    <div className={`${collapsed ? "justify-center" : "justify-end"} flex mb-3`} >
                        <button
                            onClick={() => setCollapsed(!collapsed)}
                            className="p-1 rounded hover:bg-gray-100"
                        >
                            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                        </button>
                    </div>

                    {/* MENU */}
                    <nav className="space-y-4">
                        {menuList.map((group, index) => (
                            <div key={index}>
                                {!collapsed && (
                                    <p className="text-xs text-gray-500 mb-2">{group.group}</p>
                                )}

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
                        ${collapsed ? "justify-center" : ""}
                      `}
                                            >
                                                {item.icon}
                                                {!collapsed && <span>{item.text}</span>}
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </nav>
                </div>

                {/* USER / LOGOUT */}
                <div className="pt-4">
                    <Button
                        onClick={handleLogout}
                        variant="outline"
                        className="w-full"
                    >
                        {collapsed ? "⎋" : "Logout"}
                    </Button>

                    {!collapsed && (
                        <p className="mt-3 text-sm truncate">
                            <span className="font-medium">{user.email}</span>
                        </p>
                    )}
                </div>
            </div>
        </div >
    );
}
