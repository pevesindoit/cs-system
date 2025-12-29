"use client";

import { SocialLogData } from "@/app/types/types";

interface Props {
    data: SocialLogData[];
}

export default function ListSocialGrowth({ data }: Props) {

    // Helper to color code platform text
    const getPlatformColor = (p: string) => {
        switch (p) {
            case 'Instagram': return 'text-pink-600 font-semibold';
            case 'Facebook': return 'text-blue-700 font-semibold';
            case 'TikTok': return 'text-black font-semibold';
            case 'Website': return 'text-green-600 font-semibold';
            default: return '';
        }
    }

    if (!data || data.length === 0) {
        return (
            <tr>
                <td colSpan={7} className="text-center py-4 text-gray-400">
                    No data available.
                </td>
            </tr>
        );
    }

    return (
        <>
            {data.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50 transition-colors group">
                    {/* Date - Sticky */}
                    <td className="px-2 py-2 border-r border-b sticky left-0 bg-white group-hover:bg-gray-50">
                        {item.entry_date}
                    </td>

                    {/* Platform */}
                    <td className={`px-2 py-2 border-r border-b ${getPlatformColor(item.platform)}`}>
                        {item.platform}
                    </td>

                    {/* Followers */}
                    <td className="px-2 py-2 border-r border-b">
                        {item.followers.toLocaleString('id-ID')}
                    </td>

                    {/* Reach */}
                    <td className="px-2 py-2 border-r border-b">
                        {item.reach_or_impressions.toLocaleString('id-ID')}
                    </td>

                    {/* Engagement */}
                    <td className="px-2 py-2 border-r border-b">
                        {item.engagement_or_clicks.toLocaleString('id-ID')}
                    </td>

                    {/* Notes */}
                    <td className="px-2 py-2 border-r border-b text-gray-600 max-w-[200px] truncate" title={item.notes}>
                        {item.notes || "-"}
                    </td>

                    {/* Action (Delete/Edit placeholders) */}
                    <td className="px-2 py-2 border-b text-center">
                        <button className="text-gray-400 hover:text-red-500">
                            Delete
                        </button>
                    </td>
                </tr>
            ))}
        </>
    );
}