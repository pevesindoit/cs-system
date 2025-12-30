"use client";

import { useState, ReactNode } from "react";
import { useAuth } from "./global/AuthProfider";
import {
    CircleDollarSign,
    LayoutDashboard,
    Users,
    ChevronLeft,
    ChevronRight,
    Menu,
    X,
    List,
    ClipboardPlus
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

    // 1. Get User Type safely (1 = CS, 2 = Manager)
    const userType = user?.identities?.[0]?.identity_data?.type_id;

    // 2. Define the full menu list
    const menuList: MenuGroup[] = [
        {
            group: "Admin",
            items: [
                { link: "/advertiser", icon: <CircleDollarSign size={16} />, text: "Advertiser" },
                { link: "/report", icon: <ClipboardPlus size={16} />, text: "Report" },
                { link: "/cs", icon: <Users size={16} />, text: "CS" },
                { link: "/dashboard", icon: <LayoutDashboard size={16} />, text: "Dashboard" },
                { link: "/get-leads", icon: <List size={16} />, text: "Leads" },
            ],
        },
    ];

    // 3. Filter Logic based on User Type
    const filteredMenu = menuList.map((group) => {
        const filteredItems = group.items.filter((item) => {
            // IF Manager (type_id 2): Show everything
            if (userType === 2) return true;

            // IF CS (type_id 1): Show ONLY the "/cs" page
            if (userType === 1) {
                return item.link === "/cs";
            }

            // Fallback (e.g., pending or unknown role): Show nothing or safe pages
            return false;
        });

        return { ...group, items: filteredItems };
    });

    const handleLogout = async () => {
        const { error } = await supabaseBrowser.auth.signOut();
        // Clear cookies & storage
        document.cookie = "user-type=; path=/; max-age=0";
        document.cookie = "sb-access-token=; path=/; max-age=0";
        document.cookie = "sb-refresh-token=; path=/; max-age=0";
        localStorage.removeItem("user_type"); // Clear local storage too just in case
        router.push("/");
    };

    if (pathname === "/") return null;
    if (loading || !user) return null;

    // Helper to render links (Using filteredMenu instead of menuList)
    const renderLinks = (isMobile = false) => (
        <div className="space-y-4">
            {filteredMenu.map((group, index) => (
                // Only render group if it has visible items
                group.items.length > 0 && (
                    <div key={index}>
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
                                        onClick={() => isMobile && setMobileMenuOpen(false)}
                                        className={`
                                            flex items-center gap-3 px-3 py-2 rounded-md
                                            transition-all
                                            ${isActive ? "bg-gray-100" : "hover:bg-gray-100"}
                                            ${collapsed && !isMobile ? "justify-center" : ""}
                                        `}
                                    >
                                        {item.icon}
                                        {(isMobile || !collapsed) && <span>{item.text}</span>}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                )
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
                <div className="mt-3 text-sm truncate">
                    <p className="font-medium">{user.email}</p>
                    <p className="text-xs text-gray-400">
                        {userType === 2 ? "Manager" : userType === 1 ? "CS" : "User"}
                    </p>
                </div>
            )}
        </div>
    );

    return (
        <>
            {/* ================= MOBILE VIEW ================= */}
            <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b px-4 py-3 flex items-center justify-between">
                <div className="font-bold text-lg">Pevesindo</div>
                <button onClick={() => setMobileMenuOpen(true)} className="p-2 hover:bg-gray-100 rounded-md">
                    <Menu size={24} />
                </button>
            </div>

            {mobileMenuOpen && (
                <div className="md:hidden fixed inset-0 z-60 flex">
                    <div
                        className="absolute inset-0 bg-black/50"
                        onClick={() => setMobileMenuOpen(false)}
                    />
                    <div className="relative w-[80%] max-w-[300px] bg-white h-full p-4 flex flex-col shadow-xl animate-in slide-in-from-left duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <span className="font-bold text-lg">Menu</span>
                            <button onClick={() => setMobileMenuOpen(false)} className="p-1 hover:bg-gray-100 rounded">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            {renderLinks(true)}
                        </div>
                        {renderUserAndLogout(true)}
                    </div>
                </div>
            )}

            {/* ================= DESKTOP VIEW ================= */}
            <div
                className={`
                    hidden md:block
                    ${collapsed ? "w-[72px]" : "w-[20%]"} 
                    px-3 py-3 transition-all duration-300 relative
                `}
            >
                <div className={`${collapsed ? "p-1" : "p-2"} border rounded-[5px] h-full bg-[#FEFEFE] flex flex-col justify-between sticky top-3`}>
                    <div>
                        <div className={`${collapsed ? "justify-center" : "justify-end"} flex mb-3`} >
                            <button
                                onClick={() => setCollapsed(!collapsed)}
                                className="p-1 rounded hover:bg-gray-100"
                            >
                                {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                            </button>
                        </div>
                        {renderLinks(false)}
                    </div>
                    {renderUserAndLogout(false)}
                </div>
            </div>
            <div className="md:hidden h-16 w-full shrink-0" />
        </>
    );
}