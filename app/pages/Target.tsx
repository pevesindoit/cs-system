"use client";

import { useEffect, useState } from "react";
import H1 from "../custom-component/H1";
import { getBranch, getTarget } from "../function/fetch/get/fetch";
import { updateTarget } from "../function/fetch/update/update-lead/fetch";

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
    const [branchTargets, setBranchTargets] = useState<BranchTarget[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

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
                            hari_kerja: getWorkDaysInMonth(),
                            pic_cs: "",
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
            alert("✓ Target berhasil disimpan!");
        } catch (error) {
            console.error("Error saving targets:", error);
            alert("❌ Gagal menyimpan target.");
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

        // Formula: budget ads is target * ads
        const budgetAds = target * (adsPerc / 100);
        
        // Formula: budget harian is budget ads / hari kerja
        const budgetHarian = budgetAds / hariKerja;
        
        // Formula: meta ads is budget harian - google ads
        const metaAds = Math.max(0, budgetHarian - googleAds);
        
        // Formula: GA Daily leads is google ads / google ads CPL
        const gaLeads = googleCPL > 0 ? googleAds / googleCPL : 0;
        
        // Formula: FB Daily leads is meta ads / FB Ads CPL
        const fbLeads = fbCPL > 0 ? metaAds / fbCPL : 0;
        
        const totalLeads = gaLeads + fbLeads;
        
        // Formula: target warm is (GA Daily Leads + FB Daily Leads) * 7%
        const targetWarm = totalLeads * 0.07;
        
        // Formula: target closing is (FB Daily Leads + GA Daily Leads) * 3%
        const targetClosing = totalLeads * 0.03;
        
        // Formula: Target Closing Value is budget Harian * 14
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

    const totals = branchTargets.reduce((acc, bt) => {
        const m = calculateMetrics(bt);
        return {
            target: acc.target + (Number(bt.target_omset) || 0),
            budgetAds: acc.budgetAds + m.budgetAds,
            budgetHarian: acc.budgetHarian + m.budgetHarian,
            googleAds: acc.googleAds + (Number(bt.google_ads) || 0),
            metaAds: acc.metaAds + m.metaAds,
            gaLeads: acc.gaLeads + m.gaLeads,
            fbLeads: acc.fbLeads + m.fbLeads,
            warm: acc.warm + m.targetWarm,
            closing: acc.closing + m.targetClosing,
            closingValue: acc.closingValue + m.closingValue,
        };
    }, { target: 0, budgetAds: 0, budgetHarian: 0, googleAds: 0, metaAds: 0, gaLeads: 0, fbLeads: 0, warm: 0, closing: 0, closingValue: 0 });

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-20 animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/50 backdrop-blur-md p-6 rounded-3xl border border-white/20 shadow-xl">
                <div>
                    <H1>Target KPI Cabang</H1>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-black rounded-lg uppercase tracking-wider">Periode: April 2026</span>
                    </div>
                </div>
                <button 
                    onClick={handleSave}
                    disabled={saving}
                    className="group relative px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-sm transition-all shadow-lg hover:shadow-blue-200 active:scale-95 disabled:opacity-50 overflow-hidden"
                >
                    <span className="relative z-10">{saving ? "MENYIMPAN..." : "SIMPAN KONFIGURASI"}</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                </button>
            </div>

            <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] border border-white/40 shadow-2xl overflow-hidden">
                <div className="overflow-x-auto scrollbar-hide">
                    <table className="w-full border-collapse text-left">
                        <thead>
                            <tr className="bg-gray-50/50">
                                <th className="sticky left-0 z-20 bg-gray-50/80 backdrop-blur-md p-5 text-[11px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 min-w-[200px]">Metrics / Cabang</th>
                                {branchTargets.map(bt => (
                                    <th key={bt.branch_id} className="p-5 text-sm font-black text-gray-800 uppercase tracking-tight border-b border-gray-100 text-center min-w-[160px] bg-white/40">
                                        {bt.branch_name}
                                    </th>
                                ))}
                                <th className="sticky right-0 z-20 bg-blue-50/80 backdrop-blur-md p-5 text-sm font-black text-blue-600 uppercase tracking-tight border-b border-blue-100 text-center min-w-[180px]">TOTAL</th>
                            </tr>
                        </thead>
                        <tbody>
                            {/* CABANG SECTION */}
                            <tr className="bg-blue-50/20"><td colSpan={branchTargets.length + 2} className="px-5 py-2 text-[10px] font-black text-blue-500 uppercase tracking-[0.3em]">Cabang Metrics</td></tr>
                            
                            {/* row: Target */}
                            <tr className="group hover:bg-blue-50/30 transition-colors">
                                <td className="sticky left-0 z-10 bg-white/95 backdrop-blur-sm p-4 text-xs font-bold text-gray-600 border-b border-gray-50 border-r border-gray-50 shadow-[4px_0_8px_rgba(0,0,0,0,0.02)]">Target Omset</td>
                                {branchTargets.map(bt => (
                                    <td key={bt.branch_id} className="p-2 border-b border-gray-50">
                                        <input 
                                            type="number" 
                                            value={bt.target_omset}
                                            onChange={(e) => handleInputChange(bt.branch_id, "target_omset", e.target.value)}
                                            className="w-full p-3 bg-transparent text-center font-black text-gray-700 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 rounded-xl transition-all" 
                                        />
                                    </td>
                                ))}
                                <td className="sticky right-0 z-10 bg-blue-50/60 p-4 text-center font-black text-blue-700 border-b border-blue-100">
                                    Rp {totals.target.toLocaleString()}
                                </td>
                            </tr>

                            {/* row: %Ads */}
                            <tr className="group hover:bg-blue-50/30 transition-colors">
                                <td className="sticky left-0 z-10 bg-white/95 backdrop-blur-sm p-4 text-xs font-bold text-gray-600 border-b border-gray-50 border-r border-gray-50">% Ads</td>
                                {branchTargets.map(bt => (
                                    <td key={bt.branch_id} className="p-2 border-b border-gray-50">
                                        <div className="relative">
                                            <input 
                                                type="number" 
                                                value={bt.ads_percent}
                                                onChange={(e) => handleInputChange(bt.branch_id, "ads_percent", e.target.value)}
                                                className="w-full p-3 bg-transparent text-center font-black text-blue-600 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 rounded-xl transition-all" 
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-blue-300">%</span>
                                        </div>
                                    </td>
                                ))}
                                <td className="sticky right-0 z-10 bg-blue-50/60 p-4 text-center font-black text-blue-700 border-b border-blue-100">
                                    {(totals.target > 0 ? (totals.budgetAds / totals.target) * 100 : 0).toFixed(1)}%
                                </td>
                            </tr>

                            {/* row: Budget Ads (Calc) */}
                            <tr className="bg-yellow-50/30">
                                <td className="sticky left-0 z-10 bg-yellow-50/80 backdrop-blur-sm p-4 text-xs font-black text-amber-700 border-b border-amber-50 border-r border-amber-50">Budget Ads</td>
                                {branchTargets.map(bt => (
                                    <td key={bt.branch_id} className="p-4 text-center font-black text-amber-600 border-b border-amber-50">
                                        Rp {calculateMetrics(bt).budgetAds.toLocaleString()}
                                    </td>
                                ))}
                                <td className="sticky right-0 z-10 bg-amber-100/60 p-4 text-center font-black text-amber-700 border-b border-amber-200">
                                    Rp {totals.budgetAds.toLocaleString()}
                                </td>
                            </tr>

                            {/* row: Hari Kerja */}
                            <tr className="group hover:bg-gray-50 transition-colors">
                                <td className="sticky left-0 z-10 bg-white/95 backdrop-blur-sm p-4 text-xs font-bold text-gray-600 border-b border-gray-50 border-r border-gray-50">Hari Kerja</td>
                                {branchTargets.map(bt => (
                                    <td key={bt.branch_id} className="p-2 border-b border-gray-50">
                                        <input 
                                            type="number" 
                                            value={bt.hari_kerja}
                                            onChange={(e) => handleInputChange(bt.branch_id, "hari_kerja", e.target.value)}
                                            className="w-full p-3 bg-transparent text-center font-black text-gray-500 outline-none focus:bg-white focus:ring-2 focus:ring-gray-300 rounded-xl transition-all" 
                                        />
                                    </td>
                                ))}
                                <td className="sticky right-0 z-10 bg-gray-50 p-4 text-center font-black text-gray-700 border-b border-gray-100">-</td>
                            </tr>

                            {/* row: Budget Harian (Calc) */}
                            <tr className="group hover:bg-gray-50 transition-colors">
                                <td className="sticky left-0 z-10 bg-white/95 backdrop-blur-sm p-4 text-xs font-bold text-gray-600 border-b border-gray-50 border-r border-gray-50">Budget Harian</td>
                                {branchTargets.map(bt => (
                                    <td key={bt.branch_id} className="p-4 text-center font-black text-gray-700 border-b border-gray-50">
                                        Rp {calculateMetrics(bt).budgetHarian.toLocaleString(undefined, {maximumFractionDigits: 0})}
                                    </td>
                                ))}
                                <td className="sticky right-0 z-10 bg-gray-50 p-4 text-center font-black text-gray-700 border-b border-gray-100">
                                    Rp {totals.budgetHarian.toLocaleString(undefined, {maximumFractionDigits: 0})}
                                </td>
                            </tr>

                            {/* ALOKASI SECTION */}
                            <tr className="bg-indigo-50/20"><td colSpan={branchTargets.length + 2} className="px-5 py-2 text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em]">Alokasi Harian</td></tr>

                            {/* row: Google Ads */}
                            <tr className="group hover:bg-indigo-50/30 transition-colors">
                                <td className="sticky left-0 z-10 bg-white/95 backdrop-blur-sm p-4 text-xs font-bold text-gray-600 border-b border-gray-50 border-r border-gray-50">Google Ads</td>
                                {branchTargets.map(bt => (
                                    <td key={bt.branch_id} className="p-2 border-b border-gray-50">
                                        <input 
                                            type="number" 
                                            value={bt.google_ads}
                                            onChange={(e) => handleInputChange(bt.branch_id, "google_ads", e.target.value)}
                                            className="w-full p-3 bg-transparent text-center font-black text-green-600 outline-none focus:bg-white focus:ring-2 focus:ring-green-300 rounded-xl transition-all" 
                                        />
                                    </td>
                                ))}
                                <td className="sticky right-0 z-10 bg-indigo-50/60 p-4 text-center font-black text-indigo-700 border-b border-indigo-100">
                                    Rp {totals.googleAds.toLocaleString()}
                                </td>
                            </tr>

                            {/* row: Meta Ads (Calc) */}
                            <tr className="group hover:bg-indigo-50/30 transition-colors">
                                <td className="sticky left-0 z-10 bg-white/95 backdrop-blur-sm p-4 text-xs font-bold text-gray-600 border-b border-gray-50 border-r border-gray-50">Meta Ads</td>
                                {branchTargets.map(bt => (
                                    <td key={bt.branch_id} className="p-4 text-center font-black text-indigo-600 border-b border-gray-50">
                                        Rp {calculateMetrics(bt).metaAds.toLocaleString(undefined, {maximumFractionDigits: 0})}
                                    </td>
                                ))}
                                <td className="sticky right-0 z-10 bg-indigo-50/60 p-4 text-center font-black text-indigo-700 border-b border-indigo-100">
                                    Rp {totals.metaAds.toLocaleString(undefined, {maximumFractionDigits: 0})}
                                </td>
                            </tr>

                            {/* row: Google CPL */}
                            <tr className="group hover:bg-orange-50/30 transition-colors">
                                <td className="sticky left-0 z-10 bg-white/95 backdrop-blur-sm p-4 text-xs font-bold text-gray-600 border-b border-gray-50 border-r border-gray-50">Google CPL</td>
                                {branchTargets.map(bt => (
                                    <td key={bt.branch_id} className="p-2 border-b border-gray-50">
                                        <input 
                                            type="number" 
                                            value={bt.google_ads_cpl}
                                            onChange={(e) => handleInputChange(bt.branch_id, "google_ads_cpl", e.target.value)}
                                            className="w-full p-3 bg-transparent text-center font-black text-orange-600 outline-none focus:bg-white focus:ring-2 focus:ring-orange-300 rounded-xl transition-all" 
                                        />
                                    </td>
                                ))}
                                <td className="sticky right-0 z-10 bg-orange-50/60 p-4 text-center font-black text-orange-700 border-b border-orange-100">-</td>
                            </tr>

                            {/* row: FB CPL */}
                            <tr className="group hover:bg-orange-50/30 transition-colors">
                                <td className="sticky left-0 z-10 bg-white/95 backdrop-blur-sm p-4 text-xs font-bold text-gray-600 border-b border-gray-50 border-r border-gray-50">FB CPL Target</td>
                                {branchTargets.map(bt => (
                                    <td key={bt.branch_id} className="p-2 border-b border-gray-50">
                                        <input 
                                            type="number" 
                                            value={bt.fb_ads_cpl}
                                            onChange={(e) => handleInputChange(bt.branch_id, "fb_ads_cpl", e.target.value)}
                                            className="w-full p-3 bg-transparent text-center font-black text-orange-600 outline-none focus:bg-white focus:ring-2 focus:ring-orange-300 rounded-xl transition-all" 
                                        />
                                    </td>
                                ))}
                                <td className="sticky right-0 z-10 bg-orange-50/60 p-4 text-center font-black text-orange-700 border-b border-orange-100">-</td>
                            </tr>

                            {/* row: GA Daily Leads (Calc) */}
                            <tr className="bg-emerald-50/20">
                                <td className="sticky left-0 z-10 bg-emerald-50/60 backdrop-blur-sm p-4 text-xs font-bold text-emerald-700 border-b border-emerald-50 border-r border-emerald-50">GA Daily Leads</td>
                                {branchTargets.map(bt => (
                                    <td key={bt.branch_id} className="p-4 text-center font-black text-emerald-600 border-b border-emerald-50">
                                        {calculateMetrics(bt).gaLeads.toFixed(1)}
                                    </td>
                                ))}
                                <td className="sticky right-0 z-10 bg-emerald-100/60 p-4 text-center font-black text-emerald-700 border-b border-emerald-200">
                                    {totals.gaLeads.toFixed(1)}
                                </td>
                            </tr>

                            {/* row: FB Daily Leads (Calc) */}
                            <tr className="bg-emerald-50/20">
                                <td className="sticky left-0 z-10 bg-emerald-50/60 backdrop-blur-sm p-4 text-xs font-bold text-emerald-700 border-b border-emerald-50 border-r border-emerald-50">FB Daily Leads</td>
                                {branchTargets.map(bt => (
                                    <td key={bt.branch_id} className="p-4 text-center font-black text-emerald-600 border-b border-emerald-50">
                                        {Math.ceil(calculateMetrics(bt).fbLeads)}
                                    </td>
                                ))}
                                <td className="sticky right-0 z-10 bg-emerald-100/60 p-4 text-center font-black text-emerald-700 border-b border-emerald-200">
                                    {Math.ceil(totals.fbLeads)}
                                </td>
                            </tr>

                            {/* row: Target Warm (Calc) */}
                            <tr className="group hover:bg-gray-50 transition-colors">
                                <td className="sticky left-0 z-10 bg-white/95 backdrop-blur-sm p-4 text-xs font-bold text-gray-400 border-b border-gray-50 border-r border-gray-50">Target Warm (7%)</td>
                                {branchTargets.map(bt => (
                                    <td key={bt.branch_id} className="p-4 text-center font-black text-gray-500 border-b border-gray-50">
                                        {calculateMetrics(bt).targetWarm.toFixed(0)}
                                    </td>
                                ))}
                                <td className="sticky right-0 z-10 bg-gray-50 p-4 text-center font-black text-gray-700 border-b border-gray-100">
                                    {totals.warm.toFixed(0)}
                                </td>
                            </tr>

                            {/* row: Target Closing (Calc) */}
                            <tr className="group hover:bg-gray-50 transition-colors">
                                <td className="sticky left-0 z-10 bg-white/95 backdrop-blur-sm p-4 text-xs font-bold text-gray-400 border-b border-gray-50 border-r border-gray-50">Target Closing (3%)</td>
                                {branchTargets.map(bt => (
                                    <td key={bt.branch_id} className="p-4 text-center font-black text-gray-500 border-b border-gray-50">
                                        {calculateMetrics(bt).targetClosing.toFixed(0)}
                                    </td>
                                ))}
                                <td className="sticky right-0 z-10 bg-gray-50 p-4 text-center font-black text-gray-700 border-b border-gray-100">
                                    {totals.closing.toFixed(0)}
                                </td>
                            </tr>

                            {/* row: Target Closing Value (Calc) */}
                            <tr className="group hover:bg-gray-50 transition-colors">
                                <td className="sticky left-0 z-10 bg-white/95 backdrop-blur-sm p-4 text-xs font-bold text-gray-400 border-b border-gray-50 border-r border-gray-50">Target Closing Value</td>
                                {branchTargets.map(bt => (
                                    <td key={bt.branch_id} className="p-4 text-center font-black text-green-700 border-b border-gray-50 bg-green-50/10">
                                        Rp {calculateMetrics(bt).closingValue.toLocaleString(undefined, {maximumFractionDigits: 0})}
                                    </td>
                                ))}
                                <td className="sticky right-0 z-10 bg-green-50/40 p-4 text-center font-black text-green-800 border-b border-green-100">
                                    Rp {totals.closingValue.toLocaleString(undefined, {maximumFractionDigits: 0})}
                                </td>
                            </tr>

                            {/* row: PIC CS */}
                            <tr className="group hover:bg-gray-50 transition-colors">
                                <td className="sticky left-0 z-10 bg-white/95 backdrop-blur-sm p-4 text-xs font-bold text-gray-600 border-b border-gray-50 border-r border-gray-50">PIC (CS)</td>
                                {branchTargets.map(bt => (
                                    <td key={bt.branch_id} className="p-2 border-b border-gray-50">
                                        <input 
                                            type="text" 
                                            value={bt.pic_cs}
                                            onChange={(e) => handleInputChange(bt.branch_id, "pic_cs", e.target.value)}
                                            placeholder="..."
                                            className="w-full p-3 bg-transparent text-center font-bold text-gray-500 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-300 rounded-xl transition-all" 
                                        />
                                    </td>
                                ))}
                                <td className="sticky right-0 z-10 bg-gray-50 p-4 text-center font-black text-gray-700 border-b border-gray-100">-</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
            
            <div className="text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-8">
                &copy; 2026 Pevesindo CS System &bull; Dynamic Strategy Visualization
            </div>
        </div>
    );
}
