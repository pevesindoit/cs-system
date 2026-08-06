"use client"
import { useEffect, useState } from "react";
import DateRangePicker from "../custom-component/DateRangePicker";
import H1 from "../custom-component/H1";
import { getBranch, getReportDay } from "../function/fetch/get/fetch";
import { useAuth } from "../custom-component/global/AuthProfider";
import { useRouter } from "next/navigation";
import { DropDownLeads } from "../custom-component/DropDownLeads";
import { itemType } from "@/app/types/types";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";

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
    const start = toLocalISO(startDate);
    return { start_date: start, end_date: end };
};

const formatIDR = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
};

export default function Matrix() {
    const [range, setRange] = useState(GetDefaultDate());
    const [branchs, setBranchs] = useState<{value: string, label: string, className: string}[]>([]);
    const [branch, setBranch] = useState<string>("");
    const [reportData, setReportData] = useState<any[] | null>(null);
    const [loading, setLoading] = useState(false);

    const router = useRouter();
    const { user, loading: authLoading } = useAuth();

    // Auth Check
    useEffect(() => {
        if (!authLoading && !user) {
            router.push("/login");
        }
    }, [user, authLoading, router]);

    // Initial Fetch Options (Branches)
    useEffect(() => {
        const fetchOptions = async () => {
            const branchRes = await getBranch();
            if (branchRes?.data?.data) {
                const formattedListBranch = branchRes.data.data.map((item: itemType) => ({
                    value: item.id,
                    label: item.name,
                    className: item.classname || ""
                }));
                setBranchs(formattedListBranch);
            }
        };
        fetchOptions();
    }, []);

    // Fetch Daily Report Data
    useEffect(() => {
        const fetchData = async () => {
            if (!range.start_date || !range.end_date) return;
            
            try {
                setLoading(true);
                const payload = {
                    start_date: range.start_date,
                    end_date: range.end_date,
                    interval: 'day',
                    ...(branch && branch !== 'all' ? { branch_id: branch } : {})
                };

                const res = await getReportDay(payload as any);

                if (res?.data?.data?.branch_breakdown) {
                    setReportData(res.data.data.branch_breakdown);
                }
            } catch (error) {
                console.error("Error fetching matrix data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [range, branch]);

    return (
        <div className="space-y-7 pb-10">
            <div className="h-full">
                <H1>Ads Performance Matrix</H1>
                <div className="space-y-4">
                    {/* Filter Section */}
                    <div className="md:flex md:space-x-3 items-center">
                        <DateRangePicker value={range} onChange={setRange} />
                        <div className="grid md:grid-cols-2 w-full max-w-md gap-3 mt-4 md:mt-0">
                            <DropDownLeads
                                items={[{ value: 'all', label: 'Semua Cabang', className: '' }, ...branchs]}
                                value={branch as any}
                                onValueChange={setBranch}
                                placeholder="Select Branch..." />
                        </div>
                    </div>

                    {/* Analytics Section */}
                    <div className="grid grid-cols-1 gap-8 mt-6">
                        {loading ? (
                            <div className="w-full bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex justify-center items-center h-64">
                                <p className="text-gray-500 font-medium">Loading data...</p>
                            </div>
                        ) : reportData && reportData.length > 0 ? (
                            <>
                                {reportData.map((branchData, index) => {
                                    const chartData = (branchData.weeks || []).map((w: any) => ({
                                        date: w.week_name,
                                        spend: w.total_spend || 0,
                                        omset: w.omset_all || 0, 
                                        leads: w.actual_lead || 0,
                                    }));

                                    return (
                                        <div key={branchData.branch_id || index} className="w-full bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                                            <h3 className="text-lg font-bold text-gray-800 mb-6 border-b pb-2">
                                                {branchData.branch_name}
                                            </h3>
                                            <div className="h-80 w-full">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <LineChart
                                                        data={chartData}
                                                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                                    >
                                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                                        <XAxis 
                                                            dataKey="date" 
                                                            tick={{fontSize: 12}} 
                                                            tickMargin={10}
                                                        />
                                                        <YAxis 
                                                            yAxisId="left"
                                                            tickFormatter={(val) => `Rp ${(val/1000000).toFixed(1)}M`}
                                                            tick={{fontSize: 12}}
                                                            width={80}
                                                        />
                                                        <YAxis 
                                                            yAxisId="right"
                                                            orientation="right"
                                                            tick={{fontSize: 12}}
                                                            width={40}
                                                        />
                                                        <Tooltip 
                                                            formatter={(value: number, name: string) => {
                                                                if (name === "Actual Leads") return value;
                                                                return formatIDR(value);
                                                            }}
                                                            labelFormatter={(label: any) => {
                                                                if (!label) return "";
                                                                const d = new Date(label);
                                                                if (isNaN(d.getTime())) return label;
                                                                return d.toLocaleDateString("id-ID", {
                                                                    weekday: "long",
                                                                    year: "numeric",
                                                                    month: "2-digit",
                                                                    day: "2-digit",
                                                                });
                                                            }}
                                                            labelStyle={{ fontWeight: 'bold', color: '#374151' }}
                                                        />
                                                        <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                                        <Line 
                                                            yAxisId="left"
                                                            type="monotone" 
                                                            name="Total Spend (Ads)"
                                                            dataKey="spend" 
                                                            stroke="#ef4444" 
                                                            strokeWidth={2}
                                                            activeDot={{ r: 6 }} 
                                                        />
                                                        <Line 
                                                            yAxisId="left"
                                                            type="monotone" 
                                                            name="Total Omset (Semua Keterangan)"
                                                            dataKey="omset" 
                                                            stroke="#10b981" 
                                                            strokeWidth={2} 
                                                            activeDot={{ r: 6 }}
                                                        />
                                                        <Line 
                                                            yAxisId="right"
                                                            type="monotone" 
                                                            name="Actual Leads"
                                                            dataKey="leads" 
                                                            stroke="#3b82f6" 
                                                            strokeWidth={2} 
                                                            activeDot={{ r: 6 }}
                                                        />
                                                    </LineChart>
                                                </ResponsiveContainer>
                                            </div>

                                            {/* Summary Data */}
                                            <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mt-6">
                                                {(() => {
                                                    const totalSpend = (branchData.weeks || []).reduce((acc: number, w: any) => acc + (w.total_spend || 0), 0);
                                                    const totalClosing = (branchData.weeks || []).reduce((acc: number, w: any) => acc + (w.closing || 0), 0);
                                                    const totalLeads = (branchData.weeks || []).reduce((acc: number, w: any) => acc + (w.actual_lead || 0), 0);
                                                    const totalOmsetAll = (branchData.weeks || []).reduce((acc: number, w: any) => acc + (w.omset_all || 0), 0);

                                                    const costPerLead = totalLeads > 0 ? totalSpend / totalLeads : 0;
                                                    const costPerAcquisition = totalClosing > 0 ? totalSpend / totalClosing : 0;
                                                    const roas = totalSpend > 0 ? totalOmsetAll / totalSpend : 0;

                                                    return (
                                                        <>
                                                            <div className="p-4 bg-gray-50 rounded-md text-center border border-gray-100 shadow-sm">
                                                                <p className="text-xs text-gray-500 mb-1">Total Spend + PPN</p>
                                                                <p className="font-bold text-gray-800">{formatIDR(totalSpend)}</p>
                                                            </div>
                                                            <div className="p-4 bg-gray-50 rounded-md text-center border border-gray-100 shadow-sm">
                                                                <p className="text-xs text-gray-500 mb-1">Total Omset</p>
                                                                <p className="font-bold text-gray-800">{formatIDR(totalOmsetAll)}</p>
                                                            </div>
                                                            <div className="p-4 bg-gray-50 rounded-md text-center border border-gray-100 shadow-sm">
                                                                <p className="text-xs text-gray-500 mb-1">Total Closing</p>
                                                                <p className="font-bold text-gray-800">{totalClosing}</p>
                                                            </div>
                                                            <div className="p-4 bg-gray-50 rounded-md text-center border border-gray-100 shadow-sm">
                                                                <p className="text-xs text-gray-500 mb-1">Cost Per Lead (CPL)</p>
                                                                <p className="font-bold text-gray-800">{formatIDR(costPerLead)}</p>
                                                            </div>
                                                            <div className="p-4 bg-gray-50 rounded-md text-center border border-gray-100 shadow-sm">
                                                                <p className="text-xs text-gray-500 mb-1">Cost Per Acquisition</p>
                                                                <p className="font-bold text-gray-800">{formatIDR(costPerAcquisition)}</p>
                                                            </div>
                                                            <div className="p-4 bg-gray-50 rounded-md text-center border border-gray-100 shadow-sm">
                                                                <p className="text-xs text-gray-500 mb-1">ROAS</p>
                                                                <p className="font-bold text-gray-800">{roas.toFixed(2)}x</p>
                                                            </div>
                                                        </>
                                                    );
                                                })()}
                                            </div>
                                        </div>
                                    );
                                })}

                                {/* Overall Summary Data */}
                                {(() => {
                                    const grandTotalSpend = reportData.reduce((acc, branch) => acc + (branch.weeks || []).reduce((bAcc: number, w: any) => bAcc + (w.total_spend || 0), 0), 0);
                                    const grandTotalClosing = reportData.reduce((acc, branch) => acc + (branch.weeks || []).reduce((bAcc: number, w: any) => bAcc + (w.closing || 0), 0), 0);
                                    const grandTotalLeads = reportData.reduce((acc, branch) => acc + (branch.weeks || []).reduce((bAcc: number, w: any) => bAcc + (w.actual_lead || 0), 0), 0);
                                    const grandTotalOmsetAll = reportData.reduce((acc, branch) => acc + (branch.weeks || []).reduce((bAcc: number, w: any) => bAcc + (w.omset_all || 0), 0), 0);

                                    const grandCostPerLead = grandTotalLeads > 0 ? grandTotalSpend / grandTotalLeads : 0;
                                    const grandCostPerAcquisition = grandTotalClosing > 0 ? grandTotalSpend / grandTotalClosing : 0;
                                    const grandRoas = grandTotalSpend > 0 ? grandTotalOmsetAll / grandTotalSpend : 0;

                                    return (
                                        <div className="w-full bg-white p-6 rounded-lg shadow-sm border-t-4 border-blue-500 mt-4">
                                            <h3 className="text-xl font-bold text-gray-800 mb-6 border-b pb-2">
                                                Grand Total
                                            </h3>
                                            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                                                <div className="p-4 bg-blue-50 rounded-md text-center border border-blue-100 shadow-sm">
                                                    <p className="text-xs text-blue-500 mb-1 font-semibold">Total Spend + PPN</p>
                                                    <p className="font-bold text-gray-800 text-lg">{formatIDR(grandTotalSpend)}</p>
                                                </div>
                                                <div className="p-4 bg-blue-50 rounded-md text-center border border-blue-100 shadow-sm">
                                                    <p className="text-xs text-blue-500 mb-1 font-semibold">Total Omset</p>
                                                    <p className="font-bold text-gray-800 text-lg">{formatIDR(grandTotalOmsetAll)}</p>
                                                </div>
                                                <div className="p-4 bg-blue-50 rounded-md text-center border border-blue-100 shadow-sm">
                                                    <p className="text-xs text-blue-500 mb-1 font-semibold">Total Closing</p>
                                                    <p className="font-bold text-gray-800 text-lg">{grandTotalClosing}</p>
                                                </div>
                                                <div className="p-4 bg-blue-50 rounded-md text-center border border-blue-100 shadow-sm">
                                                    <p className="text-xs text-blue-500 mb-1 font-semibold">Cost Per Lead (CPL)</p>
                                                    <p className="font-bold text-gray-800 text-lg">{formatIDR(grandCostPerLead)}</p>
                                                </div>
                                                <div className="p-4 bg-blue-50 rounded-md text-center border border-blue-100 shadow-sm">
                                                    <p className="text-xs text-blue-500 mb-1 font-semibold">Cost Per Acquisition</p>
                                                    <p className="font-bold text-gray-800 text-lg">{formatIDR(grandCostPerAcquisition)}</p>
                                                </div>
                                                <div className="p-4 bg-blue-50 rounded-md text-center border border-blue-100 shadow-sm">
                                                    <p className="text-xs text-blue-500 mb-1 font-semibold">ROAS</p>
                                                    <p className="font-bold text-gray-800 text-lg">{grandRoas.toFixed(2)}x</p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </>
                        ) : (
                            <div className="w-full bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex justify-center items-center h-64">
                                <p className="text-gray-500 font-medium">No data available for the selected period.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
