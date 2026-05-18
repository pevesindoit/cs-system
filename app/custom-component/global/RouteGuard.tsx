"use client";

import { useEffect, ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "./AuthProfider";

// Routes that do NOT require authentication
const PUBLIC_ROUTES = ["/", "/login"];

// Routes that require manager (type_id = 2) only
// CS users (type_id = 1) will be redirected away from these
const MANAGER_ONLY_ROUTES = [
    "/advertiser",
    "/report",
    "/dashboard",
    "/target",
    "/customers-jurney",
    "/add-user",
    "/manager",
    "/get-leads",
];

interface RouteGuardProps {
    children: ReactNode;
}

export function RouteGuard({ children }: RouteGuardProps) {
    const { user, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    const userType: number | undefined = user?.identities?.[0]?.identity_data?.type_id;

    useEffect(() => {
        if (loading) return; // Wait until auth is resolved

        const isPublic = PUBLIC_ROUTES.includes(pathname);
        if (isPublic) return; // No guard needed for public routes

        // 1. Not logged in → redirect to login
        if (!user) {
            router.replace("/login");
            return;
        }

        // 2. CS user trying to access manager-only page → redirect to /cs
        if (userType === 1 && MANAGER_ONLY_ROUTES.some((r) => pathname.startsWith(r))) {
            router.replace("/cs");
            return;
        }
    }, [loading, user, userType, pathname, router]);

    // While auth is loading on a protected route, show a spinner
    if (loading && !PUBLIC_ROUTES.includes(pathname)) {
        return (
            <div className="flex items-center justify-center w-full h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900" />
            </div>
        );
    }

    // Block render for unauthenticated users on protected routes
    if (!loading && !user && !PUBLIC_ROUTES.includes(pathname)) {
        return null;
    }

    // Block render for CS trying to view manager-only pages
    if (
        !loading &&
        user &&
        userType === 1 &&
        MANAGER_ONLY_ROUTES.some((r) => pathname.startsWith(r))
    ) {
        return null;
    }

    return <>{children}</>;
}
