"use client";

import { useEffect, useState } from "react";
import H1 from "../custom-component/H1";
import { getReport } from "../function/fetch/get/fetch";
import { ReportItem, ReportSummaryData } from "../types/types";
import { ReportSummary } from "../custom-component/table/ReportSummary";
import ReportBranch from "../custom-component/card/ReportBranch";
import DateMountSelector from "../custom-component/formater/DateMountSelector";
import AdsReport from "../custom-component/table/AdsReport";
import WeekFilter from "../custom-component/formater/WeekFilter";

export interface AdsDataRow {
    week: string;
    budget_iklan: number;
    total_spend: number;
    target_leads: number;
    target_omset: number;
    cost_perlead: number;
    google_ads: number;
    meta_ads: number;
    tiktok_ads: number;
    total_ads: number;
    omset: number;
    ads_ratio: string;
}

// FIX: Use Local Time instead of UTC (toISOString)
const GetDefaultDate = () => {
    const today = new Date();

    // Helper to format as YYYY-MM-DD in LOCAL time
    const toLocalISO = (date: Date) => {
        const offset = date.getTimezoneOffset() * 60000; // offset in milliseconds
        const localDate = new Date(date.getTime() - offset);
        return localDate.toISOString().split("T")[0];
    };

    const end = toLocalISO(today);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    const start = toLocalISO(startDate);

    return {
        start_date: start,
        end_date: end,
    };
};

import { BranchWeeklyReport } from "../custom-component/card/ReportBranch";
import { Printer, Download } from "lucide-react"; // Import Icons

export default function Report() {
    const [fullMonthRange, setFullMonthRange] = useState(GetDefaultDate());
    const [range, setRange] = useState(GetDefaultDate());

    const [reportData, setReportData] = useState<ReportSummaryData | null>(null);
    const [reportBranch, setReportBranch] = useState<any[] | null>(null);
    const [adsReport, setAdsReport] = useState<AdsDataRow[] | null>(null);

    const [interval, setInterval] = useState<'day' | 'week'>('week');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setRange(fullMonthRange);
    }, [fullMonthRange]);

    useEffect(() => {
        const fetchData = async () => {
            if (!range.start_date || !range.end_date) return;

            try {
                setLoading(true);
                setReportData(null);
                setReportBranch(null);
                setAdsReport(null);

                const payload: ReportItem = {
                    start_date: range.start_date,
                    end_date: range.end_date,
                    interval: interval,
                };

                const res = await getReport(payload);

                if (res?.data?.data) {
                    setReportData(res.data.data.summary);
                    setReportBranch(res.data.data.branch_breakdown || []);
                    setAdsReport(res.data.data.ads || []);
                }
            } catch (error) {
                console.error("Error fetching report:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [range, interval]);

    // Handler for generating and downloading PDF
    const handlePrint = async () => {
        try {
            // @ts-ignore
            const html2pdf = (await import("html2pdf.js")).default;
            const element = document.getElementById("printable-area");

            if (!element) return;

            let ctx: CanvasRenderingContext2D | null = null;
            const colorCache = new Map<string, string>();
            const getRgbFromColor = (colorStr: string) => {
                if (colorCache.has(colorStr)) return colorCache.get(colorStr)!;
                if (!ctx) {
                    const canvas = document.createElement('canvas');
                    canvas.width = 1;
                    canvas.height = 1;
                    ctx = canvas.getContext('2d', { willReadFrequently: true });
                }
                if (!ctx) return colorStr;
                ctx.clearRect(0, 0, 1, 1);
                ctx.fillStyle = colorStr;
                ctx.fillRect(0, 0, 1, 1);
                const data = ctx.getImageData(0, 0, 1, 1).data;
                const rgb = `rgba(${data[0]}, ${data[1]}, ${data[2]}, ${data[3] / 255})`;
                colorCache.set(colorStr, rgb);
                return rgb;
            };

            const replaceColorsInString = (str: string) => {
                return str.replace(/(?:oklch|lab|color)\([^)]+\)/g, (match) => getRgbFromColor(match));
            };

            // 1. Sanitize local <link> stylesheets
            const linkTags = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
            const fetchedStyles: { link: Element, style: HTMLStyleElement }[] = [];

            for (const link of linkTags) {
                try {
                    const href = (link as HTMLLinkElement).href;
                    if (href && href.startsWith(window.location.origin)) {
                        const res = await fetch(href);
                        let css = await res.text();
                        if (css.includes('oklch(') || css.includes('lab(') || css.includes('color(')) {
                            css = replaceColorsInString(css);
                            const styleNode = document.createElement('style');
                            styleNode.innerHTML = css;
                            link.parentElement?.insertBefore(styleNode, link);
                            link.remove();
                            fetchedStyles.push({ link, style: styleNode });
                        }
                    }
                } catch (e) { console.error("Failed to inline stylesheet for PDF prep:", e) }
            }

            // 2. Sanitize inline <style> tags
            const styleTags = Array.from(document.querySelectorAll('style'));
            const originalStylesHTML = new Map<HTMLStyleElement, string>();

            styleTags.forEach(tag => {
                const html = tag.innerHTML;
                if (html && (html.includes('lab(') || html.includes('oklch(') || html.includes('color('))) {
                    originalStylesHTML.set(tag, html);
                    tag.innerHTML = replaceColorsInString(html);
                }
            });

            // 3. Sanitize inline explicit styles
            const originalInlineStyles = new Map<HTMLElement, Record<string, string>>();
            const elements = [document.documentElement, document.body, element, ...Array.from(element.querySelectorAll('*'))];
            elements.forEach((el: Element) => {
                const htmlEl = el as HTMLElement;
                const style = window.getComputedStyle(htmlEl);
                if (!style) return;

                const changes: Record<string, string> = {};
                for (let i = 0; i < style.length; i++) {
                    const prop = style[i];
                    const val = style.getPropertyValue(prop);
                    if (val && (val.includes('lab(') || val.includes('oklch(') || val.includes('color('))) {
                        changes[prop] = htmlEl.style.getPropertyValue(prop);
                        htmlEl.style.setProperty(prop, replaceColorsInString(val), style.getPropertyPriority(prop));
                    }
                }
                if (Object.keys(changes).length > 0) originalInlineStyles.set(htmlEl, changes);
            });

            // Prevent table cutoff by forcing visible overflow
            const scrollables = element.querySelectorAll('.overflow-x-auto');
            const originalScrollStyles = new Map<HTMLElement, { overflow: string, maxWidth: string, display: string }>();
            scrollables.forEach(el => {
                const htmlEl = el as HTMLElement;
                originalScrollStyles.set(htmlEl, {
                    overflow: htmlEl.style.overflow,
                    maxWidth: htmlEl.style.maxWidth,
                    display: htmlEl.style.display
                });
                htmlEl.style.setProperty('overflow', 'visible', 'important');
                htmlEl.style.setProperty('max-width', 'none', 'important');
                htmlEl.style.setProperty('display', 'block', 'important');
            });

            const originalElementWidth = element.style.width;
            const originalElementMaxWidth = element.style.maxWidth;
            element.style.setProperty('width', 'max-content', 'important');
            element.style.setProperty('max-width', 'none', 'important');

            // --- NEW: Add class to shrink text and padding specifically for PDF ---
            element.classList.add('pdf-mode-active');

            const opt = {
                margin: 10,
                filename: `Manager_Report_${activeTab}_${new Date().toISOString().split("T")[0]}.pdf`,
                image: { type: "jpeg" as const, quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true, windowWidth: element.scrollWidth + 50 },
                jsPDF: { unit: "mm" as const, format: "a4" as const, orientation: "landscape" as const }
            };

            await html2pdf().set(opt).from(element).save();

            // RESTORE EVERYTHING
            element.classList.remove('pdf-mode-active'); // Remove shrink class

            if (originalElementWidth) element.style.width = originalElementWidth; else element.style.removeProperty('width');
            if (originalElementMaxWidth) element.style.maxWidth = originalElementMaxWidth; else element.style.removeProperty('max-width');

            originalScrollStyles.forEach((styles, htmlEl) => {
                if (styles.overflow) htmlEl.style.overflow = styles.overflow; else htmlEl.style.removeProperty('overflow');
                if (styles.maxWidth) htmlEl.style.maxWidth = styles.maxWidth; else htmlEl.style.removeProperty('max-width');
                if (styles.display) htmlEl.style.display = styles.display; else htmlEl.style.removeProperty('display');
            });

            originalInlineStyles.forEach((changes, htmlEl) => {
                for (const prop in changes) {
                    if (changes[prop] === "") htmlEl.style.removeProperty(prop);
                    else htmlEl.style.setProperty(prop, changes[prop]);
                }
            });

            originalStylesHTML.forEach((html, tag) => {
                tag.innerHTML = html;
            });

            fetchedStyles.forEach(({ link, style }) => {
                style.parentElement?.insertBefore(link, style);
                style.remove();
            });

        } catch (error) {
            console.error("Failed to generate PDF, falling back to print window:", error);
            window.print();
        }
    };

    const [activeTab, setActiveTab] = useState<'monthly' | 'daily'>('monthly');

    useEffect(() => {
        if (activeTab === 'monthly') {
            setInterval('week');
            setRange(fullMonthRange);
        } else {
            setInterval('day');
            setRange(fullMonthRange);
        }
    }, [activeTab, fullMonthRange]);

    return (
        <div className="space-y-6">
            <style jsx global>{`
                /* --- NEW: Shrink classes triggered only during PDF generation --- */
                .pdf-mode-active * {
                    font-size: 10px !important; /* Shrink text */
                    line-height: 1.2 !important;
                }
                .pdf-mode-active th, 
                .pdf-mode-active td {
                    padding: 4px 6px !important; /* Shrink padding to prevent wide stretching */
                }
                .pdf-mode-active h1 {
                    font-size: 16px !important; /* Keep titles readable */
                }
                .pdf-mode-active .text-sm {
                    font-size: 9px !important;
                }

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
                    * {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    .overflow-x-auto {
                        overflow: visible !important;
                        display: block !important;
                        width: max-content !important;
                        max-width: none !important;
                    }
                    #printable-area {
                        zoom: 65%;
                    }
                }
            `}</style>

            {/* HEADER & PRINT BUTTON */}
            <div className="flex flex-row justify-between items-center">
                <H1>Manager Report</H1>
                <button
                    onClick={handlePrint}
                    className="flex items-center gap-2 bg-black hover:bg-gray-900 text-white px-4 py-2 rounded-md shadow transition-colors"
                >
                    <Download size={18} />
                    <span>Download</span>
                </button>
            </div>

            {/* TABS & FILTERS CONTAINER */}
            <div className="space-y-4">
                <div className="flex border-b border-gray-200">
                    <button
                        className={`py-2 px-4 font-medium text-sm focus:outline-none ${activeTab === 'monthly'
                            ? 'text-blue-600 border-b-2 border-blue-600'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                        onClick={() => setActiveTab('monthly')}
                    >
                        Laporan Bulanan
                    </button>
                    <button
                        className={`py-2 px-4 font-medium text-sm focus:outline-none ${activeTab === 'daily'
                            ? 'text-blue-600 border-b-2 border-blue-600'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                        onClick={() => setActiveTab('daily')}
                    >
                        Laporan Harian
                    </button>
                </div>

                <div className="flex flex-row gap-4 items-end">
                    <div className="w-64">
                        <DateMountSelector onChange={setFullMonthRange} />
                    </div>

                    {activeTab === 'daily' && (
                        <div className="w-64">
                            <WeekFilter
                                startDate={fullMonthRange.start_date}
                                endDate={fullMonthRange.end_date}
                                onChange={setRange}
                            />
                        </div>
                    )}
                </div>
            </div>

            <div id="printable-area" className="border rounded-[5px] h-full py-10 px-9 bg-[#FEFEFE] gap-8 space-y-8 ">
                <div className="hidden print:block mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">
                        {activeTab === 'monthly' ? 'Laporan Bulanan' : 'Laporan Harian'}
                    </h1>
                    <p className="text-sm text-gray-500">
                        Period: {range.start_date} - {range.end_date}
                    </p>
                </div>

                <ReportBranch data={reportBranch} />
                <AdsReport data={adsReport} />
                <ReportSummary data={reportData} />
            </div>
        </div>
    );
}