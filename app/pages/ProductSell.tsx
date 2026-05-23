"use client";
import { useEffect, useState, useMemo } from "react";
import H1 from "../custom-component/H1";
import DateRangePicker from "../custom-component/DateRangePicker";
import { DropDownLeads } from "../custom-component/DropDownLeads";
import { getDailySales } from "../function/fetch/get/fetch";
import { Pagination } from "../custom-component/table/Pagination";

import {
    AreaChart,
    Area,
    CartesianGrid,
    XAxis,
    Tooltip,
    ResponsiveContainer,
} from "recharts";

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

// ─── Types ────────────────────────────────────────────────────────────────────
interface TopProduct {
    product_name: string;
    total_price: number;
    quantity: number;
    transaction_count: number;
}

interface TableRow {
    date: string;
    product_name: string;
    branch_name: string;
    total_price: number;
    quantity: number;
    transaction_count: number;
}

interface ChartPoint {
    date: string;
    total: number;
}

interface BranchOption {
    id: string;
    name: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatRupiah = (n: number) =>
    new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(n);

const getDefaultRange = () => {
    const today = new Date();
    const end = today.toISOString().split("T")[0];
    const start = new Date();
    start.setDate(start.getDate() - 30);
    return { start_date: start.toISOString().split("T")[0], end_date: end };
};

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Sales Area Chart */
function SalesChart({ data }: { data: ChartPoint[] }) {
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (!active || !payload?.length) return null;
        return (
            <div className="bg-white border rounded-lg shadow-lg p-3 text-xs">
                <p className="font-semibold text-gray-700 mb-1">
                    {new Date(label).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                </p>
                <p className="text-blue-600 font-bold">{formatRupiah(payload[0].value)}</p>
            </div>
        );
    };

    return (
        <Card className="pt-0 h-full">
            <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
                <div className="grid flex-1 gap-1">
                    <CardTitle>Penjualan Harian</CardTitle>
                    <CardDescription>Total omset penjualan produk per hari</CardDescription>
                </div>
            </CardHeader>
            <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
                <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="fillSales" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="#2563eb" stopOpacity={0.05} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid vertical={false} stroke="#f0f0f0" />
                        <XAxis
                            dataKey="date"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            minTickGap={32}
                            tick={{ fontSize: 11 }}
                            tickFormatter={(v) =>
                                new Date(v).toLocaleDateString("id-ID", { month: "short", day: "numeric" })
                            }
                        />
                        <Tooltip content={<CustomTooltip />} cursor={false} />
                        <Area
                            dataKey="total"
                            type="monotone"
                            fill="url(#fillSales)"
                            stroke="#2563eb"
                            strokeWidth={2}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}

/** Top Products card (mirrors CsPerformanceCard style) */
function TopProductsCard({ data }: { data: TopProduct[] }) {
    const maxValue = data.length > 0 ? data[0].total_price : 0;

    return (
        <div className="bg-white rounded-[10px] p-6 border h-full">
            <h2 className="text-lg font-bold mb-6 text-gray-800">Top Produk Terlaris</h2>
            <div className="space-y-5 overflow-y-auto max-h-[300px] pr-2">
                {data.map((item, index) => {
                    const pct = maxValue > 0 ? (item.total_price / maxValue) * 100 : 0;
                    return (
                        <div key={item.product_name} className="group">
                            <div className="flex justify-between text-xs mb-1">
                                <span className="font-semibold text-gray-700">
                                    {index + 1}. {item.product_name}
                                </span>
                                <span className="text-gray-500 font-medium">
                                    {item.transaction_count} Transaksi
                                </span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2.5 mb-1 relative overflow-hidden">
                                <div
                                    className={`h-2.5 rounded-full transition-all duration-500 ease-out ${index === 0 ? "bg-green-500" : "bg-blue-400 group-hover:bg-blue-500"}`}
                                    style={{ width: `${pct}%` }}
                                />
                            </div>
                            <div className="text-right">
                                <span className="text-xs font-bold text-gray-800">
                                    {formatRupiah(item.total_price)}
                                </span>
                            </div>
                        </div>
                    );
                })}
                {data.length === 0 && (
                    <p className="text-center text-gray-400 text-sm py-4">
                        Tidak ada data penjualan pada periode ini.
                    </p>
                )}
            </div>
        </div>
    );
}

/** Products Sales Table */
function ProductSalesTable({ data }: { data: TableRow[] }) {
    const LIMIT = 15;
    const [search, setSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);

    const filtered = useMemo(() => {
        const result = data.filter((row) =>
            row.product_name.toLowerCase().includes(search.toLowerCase()) ||
            row.branch_name.toLowerCase().includes(search.toLowerCase())
        );
        return result;
    }, [data, search]);

    // Reset to page 1 when search or data changes
    useEffect(() => {
        setCurrentPage(1);
    }, [search, data]);

    const totalPages = Math.ceil(filtered.length / LIMIT);
    const paginated = filtered.slice((currentPage - 1) * LIMIT, currentPage * LIMIT);

    return (
        <div className="bg-white rounded-[10px] border overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b">
                <h2 className="text-sm font-bold text-gray-800">Detail Penjualan Produk</h2>
                <input
                    type="text"
                    placeholder="Cari produk / cabang..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="border rounded-md px-3 py-1.5 text-xs w-56 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-xs">
                    <thead>
                        <tr className="bg-gray-50 text-gray-500 uppercase tracking-wide text-[10px]">
                            <th className="text-left px-6 py-3">Tanggal</th>
                            <th className="text-left px-6 py-3">Produk</th>
                            <th className="text-left px-6 py-3">Cabang</th>
                            <th className="text-right px-6 py-3">Qty</th>
                            <th className="text-right px-6 py-3">Transaksi</th>
                            <th className="text-right px-6 py-3">Total Omset</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginated.map((row, i) => (
                            <tr
                                key={i}
                                className="border-t hover:bg-gray-50 transition-colors"
                            >
                                <td className="px-6 py-3 text-gray-600">
                                    {new Date(row.date).toLocaleDateString("id-ID", {
                                        day: "numeric",
                                        month: "short",
                                        year: "numeric",
                                    })}
                                </td>
                                <td className="px-6 py-3 font-medium text-gray-800">{row.product_name}</td>
                                <td className="px-6 py-3 text-gray-600">{row.branch_name}</td>
                                <td className="px-6 py-3 text-right text-gray-600">{row.quantity ?? 0}</td>
                                <td className="px-6 py-3 text-right text-gray-600">{row.transaction_count}</td>
                                <td className="px-6 py-3 text-right font-semibold text-gray-800">
                                    {formatRupiah(row.total_price)}
                                </td>
                            </tr>
                        ))}
                        {paginated.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                                    Tidak ada data yang ditemukan.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="px-6 border-t">
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={filtered.length}
                    onPageChange={setCurrentPage}
                />
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ProductSell() {
    const [range, setRange] = useState(getDefaultRange());
    const [branch, setBranch] = useState<string>("");
    const [branchOptions, setBranchOptions] = useState<{ value: string | number; label: string; className: string }[]>([]);

    // Data states
    const [chartData, setChartData] = useState<ChartPoint[]>([]);
    const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
    const [tableData, setTableData] = useState<TableRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [syncMsg, setSyncMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const syncFromAccurate = async () => {
        setSyncing(true);
        setSyncMsg(null);
        try {
            const res = await fetch("/api/get/get-product-data");
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || "Gagal sync data");
            setSyncMsg({ type: "success", text: `Sync berhasil! ${json.salesRecordsInserted ?? 0} record ditambahkan untuk tanggal ${json.dateProcessed}.` });
            // Re-fetch display data after sync
            setRange((prev) => ({ ...prev }));
        } catch (err: any) {
            setSyncMsg({ type: "error", text: err.message || "Terjadi kesalahan saat sync." });
        } finally {
            setSyncing(false);
        }
    };

    // Summary cards: total omset + total transactions
    const totalOmset = useMemo(() => topProducts.reduce((s, p) => s + p.total_price, 0), [topProducts]);
    const totalTransactions = useMemo(() => topProducts.reduce((s, p) => s + p.transaction_count, 0), [topProducts]);

    // Fetch data on filter change
    useEffect(() => {
        const fetch = async () => {
            setLoading(true);
            const res = await getDailySales({
                start_date: range.start_date,
                end_date: range.end_date,
                branch: branch || undefined,
            });
            if (res?.data) {
                setChartData(res.data.chartData || []);
                setTopProducts(res.data.topProducts || []);
                setTableData(res.data.tableData || []);

                // Populate branch dropdown from first fetch
                if (branchOptions.length === 0 && res.data.branches?.length > 0) {
                    setBranchOptions(
                        res.data.branches.map((b: BranchOption) => ({
                            value: b.id,
                            label: b.name,
                            className: "",
                        }))
                    );
                }
            }
            setLoading(false);
        };
        fetch();
    }, [range, branch]);

    return (
        <div className="space-y-7 pb-10">
            <div className="h-full">
                <div className="flex items-center justify-between mb-1">
                    <H1>Penjualan Produk</H1>
                    <button
                        onClick={syncFromAccurate}
                        disabled={syncing}
                        className="flex items-center gap-1.5 bg-black text-white text-xs px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {syncing ? (
                            <>
                                <svg className="animate-spin h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                </svg>
                                Syncing...
                            </>
                        ) : (
                            <>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                Sync dari Accurate
                            </>
                        )}
                    </button>
                </div>

                {syncMsg && (
                    <div className={`text-xs px-4 py-2 rounded-lg mb-1 ${
                        syncMsg.type === "success"
                            ? "bg-green-50 text-green-700 border border-green-200"
                            : "bg-red-50 text-red-700 border border-red-200"
                    }`}>
                        {syncMsg.text}
                    </div>
                )}

                <div className="space-y-4">

                    {/* ── Filters ─────────────────────────────────────────── */}
                    <div className="md:flex md:space-x-3 items-center">
                        <DateRangePicker value={range} onChange={setRange} />
                        <div className="grid md:grid-cols-2 w-full gap-3 mt-2 md:mt-0">
                            <DropDownLeads
                                items={[{ value: "all", label: "Semua Cabang", className: "" }, ...branchOptions]}
                                value={(branch || "all") as any}
                                onValueChange={(val) => setBranch(val === "all" ? "" : val)}
                                placeholder="Select Branch..."
                            />
                        </div>
                    </div>

                    {/* ── Summary Cards ────────────────────────────────────── */}
                    <div className="bg-white rounded-[10px] py-7 px-8 border overflow-hidden text-[.7rem]">
                        <div className="grid md:grid-cols-3 grid-cols-1 gap-2">
                            <div className="flex justify-between border rounded-[10px] py-10 px-5 bg-white">
                                <p className="capitalize font-bold text-gray-700">Total Omset</p>
                                <p className="font-semibold text-gray-900">{formatRupiah(totalOmset)}</p>
                            </div>
                            <div className="flex justify-between border rounded-[10px] py-10 px-5 bg-white">
                                <p className="capitalize font-bold text-gray-700">Total Transaksi</p>
                                <p className="font-semibold text-gray-900">{totalTransactions}</p>
                            </div>
                            <div className="flex justify-between border rounded-[10px] py-10 px-5 bg-white">
                                <p className="capitalize font-bold text-gray-700">Jenis Produk</p>
                                <p className="font-semibold text-gray-900">{topProducts.length}</p>
                            </div>
                        </div>
                    </div>

                    {/* ── Chart + Top Products ──────────────────────────────── */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        <div className="lg:col-span-2">
                            {loading ? (
                                <div className="bg-white rounded-[10px] border h-[320px] flex items-center justify-center text-gray-400 text-sm">
                                    Memuat data...
                                </div>
                            ) : (
                                <SalesChart data={chartData} />
                            )}
                        </div>
                        <div className="lg:col-span-1">
                            <TopProductsCard data={topProducts} />
                        </div>
                    </div>

                    {/* ── Products Table ────────────────────────────────────── */}
                    {loading ? (
                        <div className="bg-white rounded-[10px] border h-40 flex items-center justify-center text-gray-400 text-sm">
                            Memuat data...
                        </div>
                    ) : (
                        <ProductSalesTable data={tableData} />
                    )}

                </div>
            </div>
        </div>
    );
}