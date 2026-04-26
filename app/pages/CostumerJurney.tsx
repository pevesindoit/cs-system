"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import H1 from "../custom-component/H1";
import { Pagination } from "../custom-component/table/Pagination";
import { useAuth } from "../custom-component/global/AuthProfider";
import { getCustomerJourney } from "../function/fetch/get/fetch";

// ─── Types ───────────────────────────────────────────────────────────────────

interface LeadItem {
    id: string;
    name: string;
    nomor_hp: string;
    status: string;
    updated_at: string;
    created_at: string;
    nominal: number | null;
    reason: string;
    address: string;
    platform: { name: string; id?: string } | null;
    channel: { name: string; id?: number } | null;
    keterangan_leads: { name: string; id?: number } | null;
    branch: { name: string; id?: string } | null;
    pic: { name: string; id?: number } | null;
}

interface CustomerItem {
    id: string;
    name: string;
    number?: number | string; // phone number stored as `number` in costumers table
    address?: string;
    costumers_type?: number;
    created_at: string;
    leads: LeadItem[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const statusColors: Record<string, { bg: string; text: string; dot: string }> = {
    closing: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
    followup: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-400" },
    survey: { bg: "bg-pink-50", text: "text-pink-700", dot: "bg-pink-400" },
    hot: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-400" },
    warm: { bg: "bg-yellow-50", text: "text-yellow-700", dot: "bg-yellow-400" },
    hold: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-400" },
    los: { bg: "bg-gray-50", text: "text-gray-500", dot: "bg-gray-400" },
};

const getStatusStyle = (status: string) => {
    return statusColors[status?.toLowerCase()] ?? { bg: "bg-gray-50", text: "text-gray-600", dot: "bg-gray-300" };
};

const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
};

const formatRupiah = (value: number | null) => {
    if (!value) return "-";
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(value);
};

// ─── Customer Journey Timeline / Lead Table ───────────────────────────────────

function CustomerLeadTable({ leads }: { leads: LeadItem[] }) {
    const [leadsPage, setLeadsPage] = useState(1);
    const LEADS_PER_PAGE = 5;

    const totalLeadsPages = Math.ceil(leads.length / LEADS_PER_PAGE);
    const paginatedLeads = leads.slice(
        (leadsPage - 1) * LEADS_PER_PAGE,
        leadsPage * LEADS_PER_PAGE
    );

    if (leads.length === 0) {
        return (
            <div className="py-8 text-center text-xs text-gray-400 italic">
                Belum ada leads untuk customer ini.
            </div>
        );
    }

    return (
        <div className="mt-3">
            {/* Table */}
            <div className="overflow-x-auto rounded-lg border border-gray-100">
                <table className="w-full text-xs">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                            <th className="px-3 py-2 text-left font-semibold text-gray-500 whitespace-nowrap">Tanggal</th>
                            <th className="px-3 py-2 text-left font-semibold text-gray-500 whitespace-nowrap">Status</th>
                            <th className="px-3 py-2 text-left font-semibold text-gray-500 whitespace-nowrap">Platform</th>
                            <th className="px-3 py-2 text-left font-semibold text-gray-500 whitespace-nowrap">Channel</th>
                            <th className="px-3 py-2 text-left font-semibold text-gray-500 whitespace-nowrap">Keterangan</th>
                            <th className="px-3 py-2 text-left font-semibold text-gray-500 whitespace-nowrap">PIC</th>
                            <th className="px-3 py-2 text-left font-semibold text-gray-500 whitespace-nowrap">Cabang</th>
                            <th className="px-3 py-2 text-left font-semibold text-gray-500 whitespace-nowrap">Nominal</th>
                            <th className="px-3 py-2 text-left font-semibold text-gray-500 whitespace-nowrap">Catatan</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {paginatedLeads.map((lead) => {
                            const st = getStatusStyle(lead.status);
                            return (
                                <tr key={lead.id} className="bg-white hover:bg-gray-50/60 transition-colors">
                                    <td className="px-3 py-2 whitespace-nowrap text-gray-500">
                                        {formatDate(lead.updated_at)}
                                    </td>
                                    <td className="px-3 py-2 whitespace-nowrap">
                                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${st.bg} ${st.text}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`}></span>
                                            {lead.status || "-"}
                                        </span>
                                    </td>
                                    <td className="px-3 py-2 whitespace-nowrap text-gray-600">
                                        {lead.platform?.name || "-"}
                                    </td>
                                    <td className="px-3 py-2 whitespace-nowrap text-gray-600">
                                        {lead.channel?.name || "-"}
                                    </td>
                                    <td className="px-3 py-2 whitespace-nowrap text-gray-600">
                                        {lead.keterangan_leads?.name || "-"}
                                    </td>
                                    <td className="px-3 py-2 whitespace-nowrap text-gray-600">
                                        {lead.pic?.name || "-"}
                                    </td>
                                    <td className="px-3 py-2 whitespace-nowrap text-gray-600">
                                        {lead.branch?.name || "-"}
                                    </td>
                                    <td className="px-3 py-2 whitespace-nowrap font-medium text-emerald-600">
                                        {formatRupiah(lead.nominal)}
                                    </td>
                                    <td className="px-3 py-2 text-gray-500 max-w-[160px] truncate">
                                        {lead.reason || "-"}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Leads pagination */}
            {leads.length > LEADS_PER_PAGE && (
                <div className="mt-2">
                    <Pagination
                        currentPage={leadsPage}
                        totalPages={totalLeadsPages}
                        totalItems={leads.length}
                        onPageChange={setLeadsPage}
                    />
                </div>
            )}
        </div>
    );
}

// ─── Customer Journey Card ────────────────────────────────────────────────────

function CustomerJourneyCard({ customer }: { customer: CustomerItem }) {
    const [expanded, setExpanded] = useState(false);

    // Summary stats from leads
    const totalLeads = customer.leads.length;
    const closingLeads = customer.leads.filter((l) => l.status?.toLowerCase() === "closing");
    const totalNominal = closingLeads.reduce((sum, l) => sum + (l.nominal || 0), 0);
    const lastLead = customer.leads[0];
    const lastStatus = lastLead?.status || null;
    const lastSt = lastStatus ? getStatusStyle(lastStatus) : null;

    // Journey stage pills
    const uniqueStatuses = [...new Set(customer.leads.map((l) => l.status?.toLowerCase()).filter(Boolean))];

    return (
        <div className="bg-white rounded-[10px] border border-gray-100 shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md">
            {/* Card Header */}
            <div
                className="px-6 py-4 flex items-start justify-between cursor-pointer select-none"
                onClick={() => setExpanded((prev) => !prev)}
            >
                {/* Left: Customer info */}
                <div className="flex items-center gap-4 min-w-0">
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex-shrink-0 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                        {customer.name?.charAt(0)?.toUpperCase() || "?"}
                    </div>

                    {/* Name + meta */}
                    <div className="min-w-0">
                        <p className="font-semibold text-gray-800 text-sm leading-tight truncate">
                            {customer.name}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                            {customer.number && (
                                <span className="text-[10px] text-gray-400 font-medium">
                                    📞 0{customer.number}
                                </span>
                            )}
                            {customer.address && (
                                <span className="text-[10px] text-gray-400 truncate max-w-[180px]">
                                    📍 {customer.address}
                                </span>
                            )}
                            <span className="text-[10px] text-gray-300">
                                Bergabung {formatDate(customer.created_at)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Right: Stats + collapse toggle */}
                <div className="flex items-center gap-5 flex-shrink-0 ml-4">
                    {/* Stats */}
                    <div className="hidden md:flex items-center gap-5">
                        <div className="text-center">
                            <p className="text-lg font-bold text-gray-800 leading-none">{totalLeads}</p>
                            <p className="text-[10px] text-gray-400 mt-0.5">Total Leads</p>
                        </div>
                        <div className="text-center">
                            <p className="text-lg font-bold text-emerald-600 leading-none">{closingLeads.length}</p>
                            <p className="text-[10px] text-gray-400 mt-0.5">Closing</p>
                        </div>
                        <div className="text-center">
                            <p className="text-sm font-bold text-indigo-600 leading-none">{formatRupiah(totalNominal)}</p>
                            <p className="text-[10px] text-gray-400 mt-0.5">Total Omset</p>
                        </div>
                        {lastSt && lastStatus && (
                            <div className="text-center">
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${lastSt.bg} ${lastSt.text}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${lastSt.dot}`}></span>
                                    {lastStatus}
                                </span>
                                <p className="text-[10px] text-gray-400 mt-0.5">Status Terakhir</p>
                            </div>
                        )}
                    </div>

                    {/* Toggle chevron */}
                    <div className={`w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center transition-transform duration-300 ${expanded ? "rotate-180 bg-gray-50" : "bg-white"}`}>
                        <svg className="w-3.5 h-3.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>
                </div>
            </div>

            {/* Journey stage mini-pills (always visible) */}
            {uniqueStatuses.length > 0 && (
                <div className="px-6 pb-3 flex flex-wrap gap-1.5">
                    {uniqueStatuses.map((s) => {
                        const st = getStatusStyle(s);
                        const count = customer.leads.filter((l) => l.status?.toLowerCase() === s).length;
                        return (
                            <span key={s} className={`text-[9px] font-semibold px-2 py-0.5 rounded-full capitalize ${st.bg} ${st.text}`}>
                                {s} ({count})
                            </span>
                        );
                    })}
                </div>
            )}

            {/* Collapsible body */}
            {expanded && (
                <div className="px-6 pb-5 border-t border-gray-50">
                    <div className="pt-4">
                        <p className="text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">
                            Riwayat Leads ({totalLeads})
                        </p>
                        <CustomerLeadTable leads={customer.leads} />
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Skeleton Loader ──────────────────────────────────────────────────────────

function SkeletonCard() {
    return (
        <div className="bg-white rounded-[10px] border border-gray-100 px-6 py-4 animate-pulse">
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-gray-200" />
                <div className="flex-1 space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-1/3" />
                    <div className="h-2 bg-gray-100 rounded w-1/2" />
                </div>
                <div className="hidden md:flex gap-5">
                    <div className="w-10 h-8 bg-gray-100 rounded" />
                    <div className="w-10 h-8 bg-gray-100 rounded" />
                    <div className="w-20 h-8 bg-gray-100 rounded" />
                </div>
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CustomerJourney() {
    const [customers, setCustomers] = useState<CustomerItem[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [totalItems, setTotalItems] = useState(0);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [searchInput, setSearchInput] = useState("");
    const LIMIT = 5;

    const router = useRouter();
    const { user, loading: authLoading } = useAuth();

    // Get User Type safely (1 = CS, 2 = Manager)
    const userType = user?.identities?.[0]?.identity_data?.type_id;

    // Auth check — managers only
    useEffect(() => {
        if (!authLoading) {
            if (!user || userType !== 2) {
                router.push("/");
            }
        }
    }, [user, userType, authLoading, router]);

    // Fetch data
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getCustomerJourney({ page: currentPage, limit: LIMIT, search });
            if (res?.data) {
                setCustomers(res.data.data || []);
                setTotalPages(res.data.pagination?.totalPages || 0);
                setTotalItems(res.data.pagination?.totalItems || 0);
            }
        } catch (err) {
            console.error("Error fetching customer journey:", err);
        } finally {
            setLoading(false);
        }
    }, [currentPage, search]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Reset to page 1 when search changes
    useEffect(() => {
        setCurrentPage(1);
    }, [search]);

    // Show spinner while auth is resolving
    if (authLoading || (loading && customers.length === 0 && !search)) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
            </div>
        );
    }

    // Block render for non-managers
    if (!user || userType !== 2) {
        return null;
    }

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSearch(searchInput);
    };

    return (
        <div className="space-y-6 pb-10">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                    <H1>Customer Journey</H1>
                    <p className="text-xs text-gray-400 mt-0.5">
                        Pantau perjalanan setiap customer dari pertama masuk hingga closing.
                    </p>
                </div>

                {/* Search */}
                <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                            </svg>
                        </span>
                        <input
                            type="text"
                            placeholder="Cari nama customer..."
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            className="pl-8 pr-4 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 bg-white w-56 transition"
                        />
                    </div>
                    <button
                        type="submit"
                        className="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium rounded-lg transition-colors"
                    >
                        Cari
                    </button>
                    {search && (
                        <button
                            type="button"
                            onClick={() => { setSearch(""); setSearchInput(""); }}
                            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-medium rounded-lg transition-colors"
                        >
                            Reset
                        </button>
                    )}
                </form>
            </div>

            {/* Summary Bar */}
            <div className="bg-white rounded-[10px] border border-gray-100 py-4 px-6">
                <div className="flex flex-wrap gap-6 items-center">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                            <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-xs text-gray-400">Total Customer</p>
                            <p className="text-sm font-bold text-gray-800">{totalItems}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                            <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-xs text-gray-400">Ditampilkan</p>
                            <p className="text-sm font-bold text-gray-800">{customers.length} / halaman</p>
                        </div>
                    </div>
                    {search && (
                        <div className="flex items-center gap-1.5 text-xs text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
                            </svg>
                            Filter: <span className="font-semibold">"{search}"</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Customer Cards List */}
            <div className="space-y-3">
                {loading ? (
                    Array.from({ length: LIMIT }).map((_, i) => <SkeletonCard key={i} />)
                ) : customers.length === 0 ? (
                    <div className="bg-white rounded-[10px] border border-gray-100 py-16 text-center">
                        <div className="text-4xl mb-3">🔍</div>
                        <p className="text-sm font-medium text-gray-500">Customer tidak ditemukan</p>
                        <p className="text-xs text-gray-400 mt-1">Coba ubah kata kunci pencarian Anda.</p>
                    </div>
                ) : (
                    customers.map((customer) => (
                        <CustomerJourneyCard key={customer.id} customer={customer} />
                    ))
                )}
            </div>

            {/* Pagination */}
            {!loading && totalItems > 0 && (
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={totalItems}
                    onPageChange={(page) => {
                        setCurrentPage(page);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                />
            )}
        </div>
    );
}