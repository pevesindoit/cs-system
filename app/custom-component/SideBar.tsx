"use client";

import { useState, ReactNode } from "react";
import { useAuth } from "./global/AuthProfider";
import {
    CircleDollarSign,
    LayoutDashboard,
    Users,
    ChevronLeft,
    ChevronRight,
    Menu, // Import Menu icon
    X,    // Import Close icon
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

    // Desktop State
    const [collapsed, setCollapsed] = useState(false);

    // Mobile State
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

    if (pathname === "/") return null;
    if (loading || !user) return null;

    // Helper to render links (reused for mobile and desktop)
    const renderLinks = (isMobile = false) => (
        <div className="space-y-4">
            {menuList.map((group, index) => (
                <div key={index}>
                    {/* Hide group label if collapsed on desktop, but always show on mobile */}
                    {(!collapsed || isMobile) && (
                        <p className="text-xs text-gray-500 mb-2">{group.group}</p>
                    )}

                    <div className="space-y-1">
                        {group.items.map((item, idx) => {
                            const isActive = pathname === item.link;
                            return (
                                <Link
                                    key={idx}
                                    href={item.link}
                                    onClick={() => isMobile && setMobileMenuOpen(false)} // Close menu on click (mobile)
                                    className={`
                                        flex items-center gap-3 px-3 py-2 rounded-md
                                        transition-all
                                        ${isActive ? "bg-gray-100" : "hover:bg-gray-100"}
                                        ${collapsed && !isMobile ? "justify-center" : ""}
                                    `}
                                >
                                    {item.icon}
                                    {/* Show text if mobile OR (desktop AND not collapsed) */}
                                    {(isMobile || !collapsed) && <span>{item.text}</span>}
                                </Link>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );

    const renderUserAndLogout = (isMobile = false) => (
        <div className="pt-4 mt-auto">
            <Button
                onClick={handleLogout}
                variant="outline"
                className="w-full"
            >
                {(collapsed && !isMobile) ? "⎋" : "Logout"}
            </Button>

            {(isMobile || !collapsed) && (
                <p className="mt-3 text-sm truncate">
                    <span className="font-medium">{user.email}</span>
                </p>
            )}
        </div>
    );

    return (
        <>
            {/* ================= MOBILE VIEW (Visible on small screens) ================= */}
            <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b px-4 py-3 flex items-center justify-between">
                <div className="font-bold text-lg">Pevesindo</div>
                <button onClick={() => setMobileMenuOpen(true)} className="p-2 hover:bg-gray-100 rounded-md">
                    <Menu size={24} />
                </button>
            </div>

            {/* Mobile Drawer/Overlay */}
            {mobileMenuOpen && (
                <div className="md:hidden fixed inset-0 z-[60] flex">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/50"
                        onClick={() => setMobileMenuOpen(false)}
                    />

                    {/* Drawer Content */}
                    <div className="relative w-[80%] max-w-[300px] bg-white h-full p-4 flex flex-col shadow-xl animate-in slide-in-from-left duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <span className="font-bold text-lg">Menu</span>
                            <button onClick={() => setMobileMenuOpen(false)} className="p-1 hover:bg-gray-100 rounded">
                                <X size={24} />
                            </button>
                        </div>

                        {/* Links */}
                        <div className="flex-1 overflow-y-auto">
                            {renderLinks(true)}
                        </div>

                        {/* Footer */}
                        {renderUserAndLogout(true)}
                    </div>
                </div>
            )}

            {/* ================= DESKTOP VIEW (Hidden on mobile) ================= */}
            <div
                className={`
                    hidden md:block
                    ${collapsed ? "w-[72px]" : "w-[20%]"} 
                    px-3 py-3 transition-all duration-300 relative
                `}
            >
                <div className={`${collapsed ? "p-1" : "p-2"} border rounded-[5px] h-full bg-[#FEFEFE] flex flex-col justify-between sticky top-3`}>
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
                        {renderLinks(false)}
                    </div>

                    {/* USER / LOGOUT */}
                    {renderUserAndLogout(false)}
                </div>
            </div>

            {/* Spacer for Mobile Topbar so content doesn't hide behind it */}
            <div className="md:hidden h-16 w-full flex-shrink-0" />
        </>
    );
}