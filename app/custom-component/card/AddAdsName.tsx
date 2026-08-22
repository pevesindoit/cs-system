"use client";

import { useEffect, useState } from "react";
import H1 from "../H1";
import { AdsNameData } from "@/app/types/types";
import axios from "axios";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

export default function AddAdsName() {
    const [adsName, setAdsName] = useState("");
    const [adsList, setAdsList] = useState<AdsNameData[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch initial ads_name list
    const fetchAdsNames = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await axios.get("/api/get/get-ads-names");
            if (res.status === 200 && res.data?.data) {
                setAdsList(res.data.data);
            }
        } catch (err: any) {
            console.error("Error fetching ads names:", err);
            setError(err.response?.data?.error || "Gagal memuat data iklan");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAdsNames();
    }, []);

    // Handle adding a new ads_name
    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!adsName.trim()) return;

        setLoading(true);
        setError(null);
        try {
            const { data: { session } } = await supabaseBrowser.auth.getSession();
            const token = session?.access_token;
            
            const res = await axios.post("/api/add/add-ads-name", {
                ads_name: adsName.trim(),
            }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            if (res.status === 200 && res.data?.allAdsNames) {
                setAdsList(res.data.allAdsNames);
                setAdsName("");
            }
        } catch (err: any) {
            console.error("Error adding ads name:", err);
            setError(err.response?.data?.error || "Gagal menambah data iklan");
        } finally {
            setLoading(false);
        }
    };

    // Handle deleting an ads_name
    const handleDelete = async (id: string) => {
        if (!window.confirm("Apakah Anda yakin ingin menghapus nama iklan ini?")) {
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const { data: { session } } = await supabaseBrowser.auth.getSession();
            const token = session?.access_token;

            const res = await axios.post("/api/delete/delete-ads-name", { id }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            if (res.status === 200 && res.data?.allAdsNames) {
                setAdsList(res.data.allAdsNames);
            }
        } catch (err: any) {
            console.error("Error deleting ads name:", err);
            setError(err.response?.data?.error || "Gagal menghapus data iklan");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full py-4 px-4 bg-white rounded-lg shadow-sm border border-gray-100 flex flex-col gap-6">
            <div>
                <H1>Daftar Nama Iklan</H1>
                <p className="text-gray-500 text-xs mt-1">
                    Kelola data kampanye iklan yang akan tampil di dropdown CS leads.
                </p>
            </div>

            {/* Input Form */}
            <form onSubmit={handleAdd} className="flex gap-2 items-end max-w-md w-full">
                <div className="flex-1 flex flex-col gap-1.5">
                    <label htmlFor="adsNameInput" className="text-xs font-semibold text-gray-700">
                        Nama Iklan Baru
                    </label>
                    <input
                        id="adsNameInput"
                        type="text"
                        placeholder="Masukkan nama iklan..."
                        value={adsName}
                        onChange={(e) => setAdsName(e.target.value)}
                        disabled={loading}
                        className="border border-gray-300 rounded px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 transition-all"
                    />
                </div>
                <button
                    type="submit"
                    disabled={loading || !adsName.trim()}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-4 py-2 rounded h-fit disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                >
                    {loading ? "Menyimpan..." : "Tambah"}
                </button>
            </form>

            {/* Alert Messages */}
            {error && (
                <div className="bg-red-50 text-red-600 text-xs px-3 py-2 rounded border border-red-100">
                    {error}
                </div>
            )}

            {/* Data Table */}
            <div className="overflow-x-auto border border-gray-200 rounded-md">
                <table className="w-full text-left text-[11px] border-collapse bg-white">
                    <thead className="bg-gray-50 border-b border-gray-200 text-gray-700 font-semibold uppercase tracking-wider text-[10px]">
                        <tr>
                            <th className="px-4 py-3 border-r border-gray-200">ID</th>
                            <th className="px-4 py-3 border-r border-gray-200">Nama Iklan</th>
                            <th className="px-4 py-3 border-r border-gray-200">Dibuat Pada</th>
                            <th className="px-4 py-3 text-center">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 text-gray-600">
                        {loading && adsList.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="text-center py-6 text-gray-400">
                                    Memuat data...
                                </td>
                            </tr>
                        ) : adsList.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="text-center py-6 text-gray-400">
                                    Tidak ada data nama iklan. Silakan tambahkan baru.
                                </td>
                            </tr>
                        ) : (
                            adsList.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-4 py-3 border-r border-gray-200 font-mono text-[10px] text-gray-400">
                                        {item.id}
                                    </td>
                                    <td className="px-4 py-3 border-r border-gray-200 font-medium text-gray-800">
                                        {item.ads_name}
                                    </td>
                                    <td className="px-4 py-3 border-r border-gray-200 text-gray-500">
                                        {new Date(item.created_at).toLocaleString("id-ID", {
                                            dateStyle: "medium",
                                            timeStyle: "short",
                                        })}
                                    </td>
                                    <td className="px-4 py-2 text-center">
                                        <button
                                            type="button"
                                            onClick={() => handleDelete(item.id)}
                                            disabled={loading}
                                            className="bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 border border-red-200 px-3 py-1 rounded transition-all text-[10px]"
                                        >
                                            Hapus
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}