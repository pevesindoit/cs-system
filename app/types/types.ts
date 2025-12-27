export interface TypeType {
  id: number;
  name: string;
}

export interface BranchType {
  id: string;
  name: string;
}

export interface CostumerType {
  name: string;
}

export interface SelectItemData {
  value: string;
  label: string;
  classname?: string;
}
export interface SelectItemDataInt {
  value: number;
  label: string;
  classname?: string;
}

export interface FilterNumber {
  user_id: string;
  number: number;
}

export interface SelectItemDataMap {
  id: number;
  name: string;
}

export interface itemType {
  id: number;
  name: string;
  classname?: string;
}

export interface formType {
  email: string;
  password: string;
  cabang: string;
  type: number; // Database expects a number
  nama: string;
}

export interface leadsType {
  name: string;
  address: string;
  channel_id: number | null;
  platform_id: string; // 👈 FIXED
  keterangan_leads_id: number | null;
  status: string;
  nominal: number | null;
  pic_id: number | null;
  branch_id: string;
  pic_name?: {
    name: string;
  } | null;
  branch_name?: {
    name: string;
  } | null;
  reason: string;
  user_id: string;
  created_at: string;
  nomor_hp: string;
}

export interface leadsDataType {
  channel_id: number | null;
  platform_id: string; // 👈 FIXED
  keterangan_leads_id: number | null;
  status: string;
  pic_id: number | null;
  branch_id: string;
  user_id: string;
  created_at: string;
}

export interface leadsTypeError {
  address: string;
  id: string;
  platform: {
    name: string;
    id?: string;
  } | null; // <-- Supabase bisa return null
  channel: {
    name: string;
    id?: number;
  } | null; // <-- Supabase bisa return null
  ketearangan_leads: {
    name: string;
    id?: number;
  } | null; // <-- Supabase bisa return null
  pic: {
    name: string;
    id?: number;
  } | null; // <-- Supabase bisa return null
  branch: {
    name: string;
    id?: number;
  } | null; // <-- Supabase bisa return null
  status: string;
  nominal: number | null;
  reason: string;
  name: string;
  user_id: string;
  channel_id: number;
  platform_id: string;
  keterangan_leads_id: number;
  pic_id: number;
  branch_id: string;
  nomor_hp: string;
  created_at: string;
}

export interface adsTypeError {
  platform: {
    name: string;
    id?: string;
  } | null;
  branch: {
    name: string;
    id?: string;
  } | null;
  daily_spend: number | "";
  name: string;
  ads_manager_id: string;
  created_at: string;
}

export interface adsType {
  platform_id: string;
  daily_spend: number | "";
  name: string;
  branch_id: string;
  ads_manager_id: string;
}

export interface loginType {
  email: string;
  password: string;
}

export interface dashboardPayloadType {
  start_date: string;
  end_date: string;
}

export interface dashboardFilterType {
  start_date: string;
  end_date: string;
  branch: string;
  cs: string;
}

export interface dataType {
  id: string;
  noted: string;
}

export interface followUpsType {
  note: string;
  leads_id: string;
  created_at: string;
}

export type ChartDataItem = {
  date: string; // YYYY-MM-DD
  count: number;
};

export type ReportItem = {
  start_date?: string;
  end_date?: string;
  platform_id?: string;
  target_lead?: number;
  target_omset?: number;
  perweak?: string;
  perday?: string;
  branch_id?: string;
};

export type ReportSummaryData = {
  actual_lead: number;
  ads_vs_omset: string; // e.g., "18.03%"
  budget: number;
  closing: number;
  closing_rate: string; // e.g., "59.09%"
  // date_range: DateRange;
  omset: number;
  target_lead: number;
  target_omset: number;
  target_vs_actual_leads: string; // e.g., "0.00%"
  target_vs_actual_omset: string; // e.g., "0.00%"
  total_spend: number;
  warm_leads: number;
};

export type DailyReportItem = {
  date: string; // "2025-12-01"
  budget: number;
  total_spend: number;
  actual_lead: number;
  warm_leads: number;
  closing: number;
  closing_rate: string; // "50.00%"
  omset: number;
  ads_vs_omset: string; // "15.00%"
};

export interface AdvertiserData {
  id?: string | number; // Optional, as it might not exist before saving to DB
  date: string;
  cabang_id: string;
  spend: number;
  ppn: number;
  total_budget: number;
  platform_id: string;
  leads: number;
  cost_per_lead: number;
  konversi_google: number;
  cost_per_konversi: number;
  keterangan: string;
}
