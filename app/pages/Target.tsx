"use client";

import { useEffect, useState } from "react";
import H1 from "../custom-component/H1";
import { getBranch, getTarget } from "../function/fetch/get/fetch";
import { updateTarget } from "../function/fetch/update/update-lead/fetch";
import { useAuth } from "../custom-component/global/AuthProfider";
import { useRouter } from "next/navigation";

interface BranchTarget {
    id?: string;
    branch_id: string;
    branch_name: string;
    target_omset: number | "";
    ads_percent: number | "";
    google_ads: number | "";
    google_ads_cpl: number | "";
    fb_ads_cpl: number | "";
    hari_kerja: number | "";
    pic_cs: string;
}

export default function Target() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [branchTargets, setBranchTargets] = useState<BranchTarget[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Get User Type safely (1 = CS, 2 = Manager)
    const userType = user?.identities?.[0]?.identity_data?.type_id;

    useEffect(() => {
        if (!authLoading) {
            if (!user || userType !== 2) {
                router.push("/");
            }
        }
    }, [user, userType, authLoading, router]);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [branchRes, targetRes] = await Promise.all([
                    getBranch(),
                    getTarget()
                ]);

                if (branchRes?.data?.data) {
                    const branches = branchRes.data.data;
                    const targets = targetRes?.data?.data || [];

                    const formattedBranches = branches.map((branch: any) => {
                        const existingTarget = targets.find((t: any) => t.branch_id === branch.id);

                        return {
                            id: existingTarget?.id,
                            branch_id: branch.id,
                            branch_name: branch.name,
                            target_omset: existingTarget?.target ?? "",
                            ads_percent: existingTarget?.ads ?? "",
                            google_ads: existingTarget?.google_ads ?? "",
                            google_ads_cpl: existingTarget?.google_ads_cpl ?? "",
                            fb_ads_cpl: existingTarget?.fb_ads_cpl ?? "",
                            hari_kerja: existingTarget?.hari_kerja ?? getWorkDaysInMonth(),
                            pic_cs: existingTarget?.pic_cs ?? "",
                        };
                    });
                    setBranchTargets(formattedBranches);
                }
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleInputChange = (branchId: string, field: keyof BranchTarget, value: string) => {
        setBranchTargets((prev) =>
            prev.map((bt) =>
                bt.branch_id === branchId
                    ? { ...bt, [field]: (field === "pic_cs") ? value : (value === "" ? "" : Number(value)) }
                    : bt
            )
        );
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const promises = branchTargets.map(bt => {
                const metrics = calculateMetrics(bt);
                return updateTarget({
                    id: bt.id,
                    branch_id: bt.branch_id,
                    target: Number(bt.target_omset) || 0,
                    ads: Number(bt.ads_percent) || 0,
                    google_ads: Number(bt.google_ads) || 0,
                    google_ads_cpl: Number(bt.google_ads_cpl) || 0,
                    fb_ads_cpl: Number(bt.fb_ads_cpl) || 0,
                    hari_kerja: Number(bt.hari_kerja) || 24,
                    pic_cs: bt.pic_cs || "",
                    leads_target: Math.ceil(metrics.fbLeads) || 0,
                    omset_target: Number(metrics.closingValue.toFixed(0)) || 0,
                });
            });

            await Promise.all(promises);
            const targetRes = await getTarget();
            if (targetRes?.data?.data) {
                const targets = targetRes.data.data;
                setBranchTargets(prev => prev.map(bt => {
                    const latest = targets.find((t: any) => t.branch_id === bt.branch_id);
                    return {
                        ...bt,
                        id: latest?.id,
                        target_omset: latest?.target ?? "",
                        ads_percent: latest?.ads ?? "",
                        google_ads: latest?.google_ads ?? "",
                        google_ads_cpl: latest?.google_ads_cpl ?? "",
                        fb_ads_cpl: latest?.fb_ads_cpl ?? "",
                        hari_kerja: latest?.hari_kerja ?? 24,
                        pic_cs: latest?.pic_cs ?? "",
                    };
                }));
            }
            alert("✓ Konfigurasi target berhasil disimpan!");
        } catch (error) {
            console.error("Error saving targets:", error);
            alert("❌ Gagal menyimpan konfigurasi.");
        } finally {
            setSaving(false);
        }
    };

    const getWorkDaysInMonth = () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        let workDays = 0;

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            if (date.getDay() !== 0) { // Not Sunday
                workDays++;
            }
        }
        return workDays;
    };

    const calculateMetrics = (bt: BranchTarget) => {
        const target = Number(bt.target_omset) || 0;
        const adsPerc = Number(bt.ads_percent) || 0;
        const hariKerja = Number(bt.hari_kerja) || getWorkDaysInMonth();
        const googleAds = Number(bt.google_ads) || 0;
        const googleCPL = Number(bt.google_ads_cpl) || 0;
        const fbCPL = Number(bt.fb_ads_cpl) || 0;

        const budgetAds = target * (adsPerc / 100);
        const budgetHarian = budgetAds / hariKerja;
        const metaAds = Math.max(0, budgetHarian - googleAds);
        const gaLeads = googleCPL > 0 ? googleAds / googleCPL : 0;
        const fbLeads = fbCPL > 0 ? metaAds / fbCPL : 0;
        const totalLeads = gaLeads + fbLeads;
        const targetWarm = totalLeads * 0.07;
        const targetClosing = totalLeads * 0.03;
        const closingValue = budgetHarian * 14;

        return {
            budgetAds,
            budgetHarian,
            metaAds,
            gaLeads,
            fbLeads,
            targetWarm,
            targetClosing,
            closingValue
        };
    };

    if (authLoading || loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
            </div>
        );
    }

    if (!user || userType !== 2) {
        return null; 
    }

    return (
        <div className="p-8 max-w-[1400px] mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-200 pb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Konfigurasi Target Strategis</h1>
                    <p className="text-sm text-slate-500 mt-1">Kelola target KPI dan alokasi budget iklan untuk setiap cabang.</p>
                </div>
                <button 
                    onClick={handleSave}
                    disabled={saving}
                    className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold text-sm transition-all disabled:opacity-50 shadow-sm"
                >
                    {saving ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
            </div>

            {/* Main Table Card */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left text-sm">
                        <thead className="bg-slate-50 border-b border-gray-200">
                            <tr>
                                <th className="p-4 font-bold text-slate-700 min-w-[180px]">Cabang</th>
                                <th className="p-4 font-bold text-slate-700 min-w-[150px]">Target Omset (Rp)</th>
                                <th className="p-4 font-bold text-slate-700 min-w-[100px] text-center">% Ads</th>
                                <th className="p-4 font-bold text-slate-700 min-w-[150px] text-center">Budget Iklan</th>
                                <th className="p-4 font-bold text-slate-700 min-w-[130px] text-center">Google Ads (Daily)</th>
                                <th className="p-4 font-bold text-slate-700 min-w-[130px] text-center">Meta Ads (Daily)</th>
                                <th className="p-4 font-bold text-slate-700 min-w-[120px] text-center">Google CPL</th>
                                <th className="p-4 font-bold text-slate-700 min-w-[120px] text-center">FB CPL Target</th>
                                <th className="p-4 font-bold text-slate-700 min-w-[100px] text-center">Daily Leads</th>
                                <th className="p-4 font-bold text-slate-700 min-w-[150px]">PIC (CS)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {branchTargets.map((bt) => {
                                const m = calculateMetrics(bt);
                                return (
                                    <tr key={bt.branch_id} className="hover:bg-slate-50/50 transition-colors">
                                        {/* Branch Name */}
                                        <td className="p-4">
                                            <div className="font-bold text-slate-900 leading-none">{bt.branch_name}</div>
                                            <div className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider">{bt.hari_kerja} Hari Kerja</div>
                                        </td>

                                        {/* Target Omset */}
                                        <td className="p-4">
                                            <div className="relative group">
                                                <input 
                                                    type="number" 
                                                    value={bt.target_omset}
                                                    onChange={(e) => handleInputChange(bt.branch_id, "target_omset", e.target.value)}
                                                    className="w-full p-2 bg-slate-50/50 border border-gray-200 rounded-md font-bold text-slate-800 outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white transition-all" 
                                                />
                                            </div>
                                        </td>

                                        {/* % Ads */}
                                        <td className="p-4">
                                            <input 
                                                type="number" 
                                                value={bt.ads_percent}
                                                onChange={(e) => handleInputChange(bt.branch_id, "ads_percent", e.target.value)}
                                                className="w-full p-2 bg-slate-50/50 border border-gray-200 rounded-md font-bold text-center text-blue-600 outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white transition-all" 
                                            />
                                        </td>

                                        {/* Budget Iklan (Calc) */}
                                        <td className="p-4 text-center">
                                            <div className="font-bold text-slate-800">Rp {m.budgetAds.toLocaleString()}</div>
                                            <div className="text-[10px] text-slate-400">Total Perbulan</div>
                                        </td>

                                        {/* Google Ads (Daily) */}
                                        <td className="p-4 text-center">
                                            <input 
                                                type="number" 
                                                value={bt.google_ads}
                                                onChange={(e) => handleInputChange(bt.branch_id, "google_ads", e.target.value)}
                                                className="w-full p-2 bg-green-50/30 border border-green-100 rounded-md font-bold text-center text-green-700 outline-none focus:ring-1 focus:ring-green-500 focus:bg-white transition-all" 
                                            />
                                        </td>

                                        {/* Meta Ads (Calc) */}
                                        <td className="p-4 text-center">
                                            <div className="font-bold text-indigo-700">Rp {m.metaAds.toLocaleString(undefined, {maximumFractionDigits: 0})}</div>
                                            <div className="text-[10px] text-slate-400">Sisa Alokasi</div>
                                        </td>

                                        {/* Google CPL */}
                                        <td className="p-4 text-center">
                                            <input 
                                                type="number" 
                                                value={bt.google_ads_cpl}
                                                onChange={(e) => handleInputChange(bt.branch_id, "google_ads_cpl", e.target.value)}
                                                className="w-full p-2 border border-gray-200 rounded-md font-bold text-center text-orange-600 outline-none focus:ring-1 focus:ring-slate-900 transition-all" 
                                            />
                                        </td>

                                        {/* FB CPL */}
                                        <td className="p-4 text-center">
                                            <input 
                                                type="number" 
                                                value={bt.fb_ads_cpl}
                                                onChange={(e) => handleInputChange(bt.branch_id, "fb_ads_cpl", e.target.value)}
                                                className="w-full p-2 border border-gray-200 rounded-md font-bold text-center text-orange-600 outline-none focus:ring-1 focus:ring-slate-900 transition-all" 
                                            />
                                        </td>

                                        {/* Daily Leads (Calc) */}
                                        <td className="p-4 text-center">
                                            <div className="font-bold text-slate-800">{Math.ceil(m.gaLeads + m.fbLeads)}</div>
                                            <div className="text-[10px] text-slate-400">Target Harian</div>
                                        </td>

                                        {/* PIC */}
                                        <td className="p-4">
                                            <input 
                                                type="text" 
                                                value={bt.pic_cs}
                                                onChange={(e) => handleInputChange(bt.branch_id, "pic_cs", e.target.value)}
                                                placeholder="Nama PIC..."
                                                className="w-full p-2 bg-slate-50/50 border border-gray-200 rounded-md font-medium text-slate-600 outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white transition-all" 
                                            />
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Footer Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 bg-slate-900 text-white rounded-xl shadow-sm">
                    <div className="text-xs text-slate-400 uppercase font-bold tracking-wider">Total Target Omset</div>
                    <div className="text-2xl font-black mt-1">Rp {branchTargets.reduce((acc, bt) => acc + (Number(bt.target_omset) || 0), 0).toLocaleString()}</div>
                </div>
                <div className="p-6 bg-white border border-gray-200 rounded-xl shadow-sm">
                    <div className="text-xs text-slate-400 uppercase font-bold tracking-wider">Total Marketing Budget</div>
                    {/* Reusing existing totals logic or calculating here for simplicity */}
                    <div className="text-2xl font-black text-slate-900 mt-1">
                        Rp {branchTargets.reduce((acc, bt) => acc + calculateMetrics(bt).budgetAds, 0).toLocaleString()}
                    </div>
                </div>
                <div className="p-6 bg-white border border-gray-200 rounded-xl shadow-sm">
                    <div className="text-xs text-slate-400 uppercase font-bold tracking-wider">Estimated Total Leads</div>
                    <div className="text-2xl font-black text-slate-900 mt-1">
                        {branchTargets.reduce((acc, bt) => acc + Math.ceil(calculateMetrics(bt).gaLeads + calculateMetrics(bt).fbLeads), 0)}
                    </div>
                </div>
            </div>

            <div className="text-center text-[11px] font-medium text-slate-400 uppercase tracking-[0.2em] pt-8">
                Pevesindo Strategic Management &bull; 2026 Internal System
            </div>
        </div>
    );
}
