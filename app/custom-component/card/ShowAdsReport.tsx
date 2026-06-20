"use client";

import { useEffect, useState } from "react";
import H1 from "../H1";
import DateMountSelector from "../formater/DateMountSelector";
import WeekFilter from "../formater/WeekFilter";
import axios from "axios";
import { Download, ChevronDown, ChevronUp } from "lucide-react";

export interface AdsDataStat {
    ads_id: string;
    ads_name: string;
    total_leads: number;
    closing: number;
    warm: number;
    closing_proyek: number;
    survey: number;
    hold: number;
}

export interface DailyAdsReport {
    date: string;
    total_leads: number;
    closing: number;
    warm: number;
    closing_proyek: number;
    survey: number;
    hold: number;
    ads_data: AdsDataStat[];
}

export interface BranchAdsReport {
    branch_name: string;
    dates: DailyAdsReport[];
}

const GetDefaultDate = () => {
    const today = new Date();
    const toLocalISO = (date: Date) => {
        const offset = date.getTimezoneOffset() * 60000;
        const localDate = new Date(date.getTime() - offset);
        return localDate.toISOString().split("T")[0];
    };
    const end = toLocalISO(today);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    return { start_date: toLocalISO(startDate), end_date: end };
};

export default function ShowAdsReport() {
    const [monthRange, setMonthRange] = useState(GetDefaultDate());
    const [range, setRange] = useState(GetDefaultDate());
    const [data, setData] = useState<BranchAdsReport[] | null>(null);
    const [loading, setLoading] = useState(true);
    const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({});

    const handleMonthChange = (newRange: { start_date: string; end_date: string }) => {
        setMonthRange(newRange);
        setRange(newRange);
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const res = await axios.post("/api/get/get-ads-report", range);
                if (res.data && res.data.data) {
                    setData(res.data.data);
                } else {
                    setData([]);
                }
            } catch (err) {
                console.error(err);
                setData([]);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [range]);

    const handlePrint = () => {
        window.print();
    };

    const toggleExpand = (branchName: string, date: string) => {
        const key = `${branchName}_${date}`;
        setExpandedDates(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    console.log("inimi", data)

    return (
        <div className="space-y-6">
            <style jsx global>{`
                @media print {
                    @page {
                        size: landscape;
                        margin: 10mm;
                    }
                    body * {
                        visibility: hidden;
                    }
                    #printable-area, #printable-area * {
                        visibility: visible;
                    }
                    #printable-area {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                    }
                    .print-hide {
                        display: none !important;
                    }
                    .print-show {
                        display: table-row-group !important;
                    }
                    .print-expand {
                        display: none !important;
                    }
                }
            `}</style>

            {/* HEADER & PRINT BUTTON */}
            <div className="flex flex-row justify-between items-center print-hide">
                <H1>Laporan Kinerja Iklan</H1>
                <button
                    onClick={handlePrint}
                    className="flex items-center gap-2 bg-black hover:bg-gray-900 text-white px-4 py-2 rounded-md shadow transition-colors"
                >
                    <Download size={18} />
                    <span>Download / Print</span>
                </button>
            </div>

            {/* FILTERS CONTAINER */}
            <div className="space-y-4 print-hide">
                <div className="flex flex-row gap-4 items-end">
                    <div className="w-64">
                        <DateMountSelector onChange={handleMonthChange} />
                    </div>
                    <div className="w-64">
                        <WeekFilter 
                            startDate={monthRange.start_date} 
                            endDate={monthRange.end_date} 
                            onChange={setRange} 
                        />
                    </div>
                </div>
            </div>

            <div id="printable-area" className="border rounded-[5px] h-full py-10 px-9 bg-[#FEFEFE] gap-8 space-y-8">
                <div className="hidden print:block mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">Laporan Kinerja Iklan (Ads Report)</h1>
                    <p className="text-sm text-gray-500">
                        Period: {range.start_date} - {range.end_date}
                    </p>
                </div>

                {loading ? (
                    <div className="space-y-8 mt-8 animate-pulse">
                        <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
                        {[1, 2].map((i) => (
                            <div key={i} className="border rounded-lg bg-white overflow-hidden shadow-sm">
                                <div className="bg-gray-100 px-6 py-4 border-b h-12"></div>
                                <div className="p-6 space-y-4">
                                    <div className="h-6 bg-gray-200 rounded w-full"></div>
                                    <div className="h-6 bg-gray-100 rounded w-full"></div>
                                    <div className="h-6 bg-gray-200 rounded w-full"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : !data || data.length === 0 ? (
                    <div className="text-center py-10 text-gray-500">Tidak ada data untuk periode ini.</div>
                ) : (
                    <div className="space-y-10 mt-8">
                        {data.map((branchData, bIndex) => (
                            <div key={bIndex} className="space-y-4">
                                <h2 className="text-xl font-bold text-gray-800 border-b border-gray-300 pb-2">
                                    {branchData.branch_name}
                                </h2>
                                <div className="overflow-x-auto border rounded-lg bg-white shadow-sm">
                                    <table className="w-full text-sm text-left text-gray-500">
                                        <thead className="text-[.7rem] text-gray-700 bg-gray-50 border-b">
                                            <tr>
                                                <th className="px-4 py-3">Tanggal</th>
                                                <th className="px-4 py-3 text-center">Total Leads</th>
                                                <th className="px-4 py-3 text-center">Closing</th>
                                                <th className="px-4 py-3 text-center">Closing Proyek</th>
                                                <th className="px-4 py-3 text-center">Warm</th>
                                                <th className="px-4 py-3 text-center">Survey</th>
                                                <th className="px-4 py-3 text-center">Hold</th>
                                                <th className="px-4 py-3 text-center print-hide w-10"></th>
                                            </tr>
                                        </thead>
                                        {branchData.dates.map((dayData, index) => {
                                            const expandKey = `${branchData.branch_name}_${dayData.date}`;
                                            const isExpanded = expandedDates[expandKey];

                                            return (
                                                <tbody key={expandKey || index} className="border-b">
                                                    {/* DAY SUMMARY ROW */}
                                                    <tr 
                                                        className="bg-white hover:bg-gray-50 transition-colors cursor-pointer"
                                                        onClick={() => toggleExpand(branchData.branch_name, dayData.date)}
                                                    >
                                                        <td className="px-4 py-3 font-bold text-gray-900">
                                                            {dayData.date}
                                                        </td>
                                                        <td className="px-4 py-3 text-center font-bold text-gray-900">
                                                            {dayData.total_leads.toLocaleString("id-ID")}
                                                        </td>
                                                        <td className="px-4 py-3 text-center text-green-600 font-bold">
                                                            {dayData.closing.toLocaleString("id-ID")}
                                                        </td>
                                                        <td className="px-4 py-3 text-center text-green-600 font-bold">
                                                            {dayData.closing_proyek.toLocaleString("id-ID")}
                                                        </td>
                                                        <td className="px-4 py-3 text-center text-orange-600 font-medium">
                                                            {dayData.warm.toLocaleString("id-ID")}
                                                        </td>
                                                        <td className="px-4 py-3 text-center text-purple-600 font-medium">
                                                            {dayData.survey.toLocaleString("id-ID")}
                                                        </td>
                                                        <td className="px-4 py-3 text-center text-gray-500 font-medium">
                                                            {dayData.hold.toLocaleString("id-ID")}
                                                        </td>
                                                        <td className="px-4 py-3 text-center print-hide">
                                                            <button className="text-gray-500 hover:text-gray-700 focus:outline-none">
                                                                {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                                            </button>
                                                        </td>
                                                    </tr>

                                                    {/* ADS DETAIL ROWS (COLLAPSIBLE) */}
                                                    <tr className={`${isExpanded ? '' : 'hidden'} print-show bg-gray-50`}>
                                                        <td colSpan={8} className="p-0">
                                                            <div className="px-8 py-4 border-t border-gray-200">
                                                                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                                                                    Detail Iklan ({dayData.ads_data.length})
                                                                </h4>
                                                                <table className="w-full text-sm text-left text-gray-500">
                                                                    <thead className="text-[.7rem] text-gray-700 bg-gray-100 border-b">
                                                                        <tr>
                                                                            <th className="px-4 py-2">Nama Iklan</th>
                                                                            <th className="px-4 py-2 text-center">Total Leads</th>
                                                                            <th className="px-4 py-2 text-center">Closing</th>
                                                                            <th className="px-4 py-2 text-center">Closing Proyek</th>
                                                                            <th className="px-4 py-2 text-center">Warm</th>
                                                                            <th className="px-4 py-2 text-center">Survey</th>
                                                                            <th className="px-4 py-2 text-center">Hold</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                        {dayData.ads_data && dayData.ads_data.length > 0 ? (
                                                                            dayData.ads_data.map((ad, idx) => (
                                                                                <tr key={idx} className="bg-white border-b border-gray-100 hover:bg-gray-50">
                                                                                    <td className="px-4 py-2 font-medium text-gray-800">
                                                                                        {ad.ads_name}
                                                                                    </td>
                                                                                    <td className="px-4 py-2 text-center font-semibold text-gray-800">
                                                                                        {ad.total_leads.toLocaleString("id-ID")}
                                                                                    </td>
                                                                                    <td className="px-4 py-2 text-center text-green-600">
                                                                                        {ad.closing.toLocaleString("id-ID")}
                                                                                    </td>
                                                                                    <td className="px-4 py-2 text-center text-green-600">
                                                                                        {ad.closing_proyek.toLocaleString("id-ID")}
                                                                                    </td>
                                                                                    <td className="px-4 py-2 text-center text-orange-600">
                                                                                        {ad.warm.toLocaleString("id-ID")}
                                                                                    </td>
                                                                                    <td className="px-4 py-2 text-center text-purple-600">
                                                                                        {ad.survey.toLocaleString("id-ID")}
                                                                                    </td>
                                                                                    <td className="px-4 py-2 text-center text-gray-500">
                                                                                        {ad.hold.toLocaleString("id-ID")}
                                                                                    </td>
                                                                                </tr>
                                                                            ))
                                                                        ) : (
                                                                            <tr>
                                                                                <td colSpan={7} className="text-center py-4 text-gray-400 italic">
                                                                                    Tidak ada detail iklan.
                                                                                </td>
                                                                            </tr>
                                                                        )}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            );
                                        })}
                                    </table>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}