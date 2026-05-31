"use client";
import React, { useEffect, useState, useMemo, useRef } from "react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import H1 from "../custom-component/H1";
import { Pagination } from "../custom-component/table/Pagination";
import { DropDownLeads } from "../custom-component/DropDownLeads";
import { getFilterer } from "../function/fetch/get/fetch";

// ─── Types ────────────────────────────────────────────────────────────────────
interface StockItem {
    sku: string;
    name: string;
    quantityInBranch: number;
}

interface SearchApiResponse {
    success: boolean;
    query: string;
    totalFound: number;
    totalProcessed?: number;
    branches: string[];
    data: Record<string, StockItem[]>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function Badge({
    children,
    active,
    onClick,
}: {
    children: React.ReactNode;
    active: boolean;
    onClick: () => void;
}) {
    return (
        <button
            onClick={onClick}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 border whitespace-nowrap
                ${active
                    ? "bg-gray-900 text-white border-gray-900"
                    : "bg-white text-gray-600 border-gray-200 hover:border-gray-400 hover:text-gray-900"
                }`}
        >
            {children}
        </button>
    );
}

function SkeletonRow() {
    return (
        <tr className="border-t animate-pulse">
            {[1, 2, 3, 4].map((i) => (
                <td key={i} className="px-5 py-3">
                    <div className="h-3 bg-gray-100 rounded w-3/4" />
                </td>
            ))}
        </tr>
    );
}

// ─── Stock Table ──────────────────────────────────────────────────────────────
function StockTable({
    items,
    branchLabel,
    loading,
}: {
    items: StockItem[];
    branchLabel: string;
    loading: boolean;
}) {
    const LIMIT = 20;
    const [currentPage, setCurrentPage] = useState(1);
    const [localFilter, setLocalFilter] = useState("");


    // Reset page when items or local filter changes
    useEffect(() => { setCurrentPage(1); }, [items, localFilter]);

    // Client-side filter: only show items whose name OR sku STARTS WITH the keyword
    const filteredItems = useMemo(() => {
        const kw = localFilter.trim().toLowerCase();
        if (!kw) return items;
        return items.filter(
            (item) =>
                item.name.toLowerCase().startsWith(kw) ||
                item.sku.toLowerCase().startsWith(kw)
        );
    }, [items, localFilter]);

    const totalPages = Math.max(1, Math.ceil(filteredItems.length / LIMIT));
    const paginated = filteredItems.slice((currentPage - 1) * LIMIT, currentPage * LIMIT);

    return (
        <div className="bg-white rounded-[10px] border overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between px-5 py-4 border-b gap-2">
                <div>
                    <h2 className="text-sm font-bold text-gray-800">
                        {branchLabel || "Semua Cabang"}
                    </h2>
                    <p className="text-xs text-gray-400 mt-0.5">
                        {localFilter
                            ? `${filteredItems.length} dari ${items.length} item`
                            : `${items.length} item ditemukan`}
                    </p>
                </div>
                {/* Local filter inside the table */}
                <div className="relative">
                    <div className="absolute inset-y-0 left-2.5 flex items-center pointer-events-none">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                        </svg>
                    </div>
                    <input
                        type="text"
                        placeholder="Filter nama / SKU..."
                        value={localFilter}
                        onChange={(e) => setLocalFilter(e.target.value)}
                        className="border rounded-md pl-7 pr-7 py-1.5 text-xs w-48 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    />
                    {localFilter && (
                        <button
                            onClick={() => setLocalFilter("")}
                            className="absolute inset-y-0 right-2 flex items-center text-gray-400 hover:text-gray-700"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-xs">
                    <thead>
                        <tr className="bg-gray-50 text-gray-500 uppercase tracking-wide text-[10px]">
                            <th className="text-left px-5 py-3">#</th>
                            <th className="text-left px-5 py-3">SKU</th>
                            <th className="text-left px-5 py-3">Nama Produk</th>
                            <th className="text-right px-5 py-3">Stok</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading
                            ? Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
                            : paginated.map((item, i) => (
                                <tr key={`${item.sku}_${i}`} className="border-t hover:bg-gray-50 transition-colors">
                                    <td className="px-5 py-3 text-gray-400 tabular-nums">
                                        {(currentPage - 1) * LIMIT + i + 1}
                                    </td>
                                    <td className="px-5 py-3 font-mono text-gray-500">{item.sku}</td>
                                    <td className="px-5 py-3 font-medium text-gray-800">{item.name}</td>
                                    <td className="px-5 py-3 text-right">
                                        <span className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full font-semibold tabular-nums
                                            ${item.quantityInBranch > 0 ? "bg-green-50 text-green-700" : "bg-red-50 text-red-500"}`}>
                                            {item.quantityInBranch}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        {!loading && paginated.length === 0 && (
                            <tr>
                                <td colSpan={4} className="px-5 py-10 text-center text-gray-400">
                                    Tidak ada data yang ditemukan.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className="px-5 border-t">
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={filteredItems.length}
                    onPageChange={setCurrentPage}
                />
            </div>
        </div>
    );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
function EmptyState() {
    return (
        <div className="bg-white rounded-[10px] border flex flex-col items-center justify-center py-20 text-center px-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-200 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
            <p className="text-sm font-semibold text-gray-400">Cari produk untuk melihat stok</p>
            <p className="text-xs text-gray-300 mt-1">Ketik nama produk, kode SKU, atau barcode di kolom pencarian di atas.</p>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ProductStock() {
    // Search state
    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedQuery, setDebouncedQuery] = useState("");
    const [stockMap, setStockMap] = useState<Record<string, StockItem[]>>({});
    const [branches, setBranches] = useState<string[]>([]);
    const [searchMeta, setSearchMeta] = useState<{ totalFound: number; totalProcessed: number } | null>(null);
    const [selectedBranch, setSelectedBranch] = useState<string>("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [filteringOptions, setFilteringOptions] = useState<{ id: string; name: string; code: string }[]>([]);
    const [filterer, setFilterer] = useState<{ value: string; label: string; className: string }[]>([]);
    const [selectedFilter, setSelectedFilter] = useState<string>("");

    const hasSearched = debouncedQuery.trim().length >= 2;

    // Fetch filtering stock on mount
    useEffect(() => {
        const fetchFiltering = async () => {
            try {
                const { data, error } = await supabaseBrowser
                    .from("filtering-stock")
                    .select("id, name, code");
                if (data && !error) {
                    setFilteringOptions(data);
                }
            } catch (e) {
                console.error(e);
            }
        };
        fetchFiltering();
    }, []);

    // ── Debounce (600ms) ─────────────────────────────────────────────────────
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => setDebouncedQuery(searchQuery), 600);
        return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    }, [searchQuery]);

    // ── Search fetch ─────────────────────────────────────────────────────────
    useEffect(() => {
        if (!hasSearched) {
            setStockMap({});
            setBranches([]);
            setSearchMeta(null);
            setSelectedBranch("");
            return;
        }

        const controller = new AbortController();

        const doSearch = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await fetch(
                    `/api/get/search-stock?q=${encodeURIComponent(debouncedQuery)}`,
                    { signal: controller.signal }
                );
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const json: SearchApiResponse = await res.json();
                if (!json.success) throw new Error("API returned success=false");

                setStockMap(json.data || {});
                setBranches(json.branches || []);
                setSearchMeta({
                    totalFound: json.totalFound,
                    totalProcessed: json.totalProcessed ?? json.totalFound,
                });
                setSelectedBranch("");
            } catch (err: any) {
                if (err.name === "AbortError") return;
                setError(err.message || "Gagal mencari data.");
            } finally {
                setLoading(false);
            }
        };

        doSearch();
        return () => controller.abort();
    }, [debouncedQuery, hasSearched]);

    // ── Derived items ─────────────────────────────────────────────────────────
    const displayItems = useMemo<StockItem[]>(() => {
        if (selectedBranch) return stockMap[selectedBranch] || [];
        // Merge all branches, summing qty for same SKU
        const merged: Record<string, StockItem> = {};
        Object.values(stockMap).forEach((items) => {
            items.forEach((item) => {
                if (merged[item.sku]) {
                    merged[item.sku] = {
                        ...merged[item.sku],
                        quantityInBranch: merged[item.sku].quantityInBranch + item.quantityInBranch,
                    };
                } else {
                    merged[item.sku] = { ...item };
                }
            });
        });
        return Object.values(merged).sort((a, b) => a.name.localeCompare(b.name));
    }, [stockMap, selectedBranch]);

    const totalStock = useMemo(() => displayItems.reduce((s, i) => s + i.quantityInBranch, 0), [displayItems]);
    const branchLabel = selectedBranch ? `Stok Cabang: ${selectedBranch}` : "";
    useEffect(() => {
        const fetchFilterer = async () => {
            const res = await getFilterer();
            if (res?.data?.data) {
                const mappedOptions = res.data.data.map((item: any) => ({
                    value: item.code, // Use code instead of id
                    label: item.name,
                    className: ""
                }));
                setFilterer(mappedOptions);
            }
        };
        fetchFilterer();
    }, []);

    return (
        <div className="space-y-5 pb-10">

            {/* ── Header ── */}
            <H1>Stok Produk</H1>
            {/* ── Search Bar & Filter ── */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none">
                        {loading ? (
                            <svg className="animate-spin h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                            </svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                            </svg>
                        )}
                    </div>
                    <input
                        type="text"
                        placeholder="Cari nama produk atau kode SKU… (min. 2 karakter, pencarian parsial didukung)"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full border rounded-[10px] pl-10 pr-10 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 bg-white shadow-sm"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => { setSearchQuery(""); setDebouncedQuery(""); setSelectedFilter(""); }}
                            className="absolute inset-y-0 right-3.5 flex items-center text-gray-400 hover:text-gray-700 transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>
            <DropDownLeads
                items={filterer}
                value={selectedFilter as any}
                onValueChange={(val) => {
                    setSelectedFilter(val);
                    setSearchQuery(val);
                }}
                placeholder="Pilih Produk..." />

            {/* ── Error ── */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-4 py-3 rounded-lg">
                    ⚠️ {error}
                </div>
            )}

            {/* ── No results yet → show empty state ── */}
            {!hasSearched && <EmptyState />}

            {/* ── Results ── */}
            {hasSearched && (
                <>
                    {/* Search result info */}
                    {searchMeta && !loading && (
                        <div className="bg-blue-50 border border-blue-100 text-blue-700 text-xs px-4 py-3 rounded-lg flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 110 20A10 10 0 0112 2z" />
                            </svg>
                            Menampilkan{" "}
                            <strong>{searchMeta.totalProcessed}</strong> dari{" "}
                            <strong>{searchMeta.totalFound}</strong> hasil untuk{" "}
                            <strong>&ldquo;{debouncedQuery}&rdquo;</strong>
                            {searchMeta.totalFound > (searchMeta.totalProcessed ?? 0) && (
                                <span className="text-blue-500 ml-1">(Perbanyak kata kunci untuk hasil lebih spesifik.)</span>
                            )}
                        </div>
                    )}

                    {/* Summary cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {[
                            { label: "Total SKU", value: displayItems.length.toLocaleString("id-ID") },
                            { label: "Total Stok (unit)", value: totalStock.toLocaleString("id-ID") },
                            { label: "Cabang", value: Object.keys(stockMap).length.toLocaleString("id-ID") },
                        ].map((c) => (
                            <div key={c.label} className="bg-white border rounded-[10px] px-6 py-5 flex justify-between items-center">
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">{c.label}</p>
                                {loading
                                    ? <div className="h-5 w-16 bg-gray-100 rounded animate-pulse" />
                                    : <p className="text-sm font-bold text-gray-900">{c.value}</p>
                                }
                            </div>
                        ))}
                    </div>

                    {/* Branch filter pills */}
                    {branches.length > 0 && (
                        <div className="bg-white border rounded-[10px] px-5 py-4">
                            <p className="text-[10px] uppercase tracking-widest font-semibold text-gray-400 mb-3">
                                Filter Cabang
                            </p>
                            <div className="flex flex-wrap gap-2">
                                <Badge active={selectedBranch === ""} onClick={() => setSelectedBranch("")}>
                                    Semua Cabang
                                </Badge>
                                {branches.map((b) => (
                                    <Badge key={b} active={selectedBranch === b} onClick={() => setSelectedBranch(b)}>
                                        {b}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Stock table */}
                    <StockTable items={displayItems} branchLabel={branchLabel} loading={loading} />
                </>
            )}
        </div>
    );
}