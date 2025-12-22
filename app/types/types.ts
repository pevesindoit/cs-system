interface TypeType {
  id: number;
  name: string;
}

interface BranchType {
  id: string;
  name: string;
}

interface CostumerType {
  name: string;
}

interface SelectItemData {
  value: string;
  label: string;
  classname?: string;
}
interface SelectItemDataInt {
  value: number;
  label: string;
  classname?: string;
}

interface FilterNumber {
  user_id: string;
  number: number;
}

interface SelectItemDataMap {
  id: number;
  name: string;
}

interface itemType {
  id: number;
  name: string;
  classname?: string;
}

interface formType {
  email: string;
  password: string;
  cabang: string;
  type: number; // Database expects a number
  nama: string;
}

interface leadsType {
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

interface leadsDataType {
  channel_id: number | null;
  platform_id: string; // 👈 FIXED
  keterangan_leads_id: number | null;
  status: string;
  pic_id: number | null;
  branch_id: string;
  user_id: string;
  created_at: string;
}

interface leadsTypeError {
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

interface adsTypeError {
  platform: {
    name: string;
    id?: string;
  } | null;
  daily_spend: number | "";
  name: string;
  ads_manager_id: string;
  created_at: string;
}

interface adsType {
  platform_id: string;
  daily_spend: number | "";
  name: string;
  ads_manager_id: string;
}

interface loginType {
  email: string;
  password: string;
}

interface dashboardPayloadType {
  start_date: string;
  end_date: string;
}

interface dashboardFilterType {
  start_date: string;
  end_date: string;
  branch: string;
  cs: string;
}

interface dataType {
  id: string;
  noted: string;
}

interface followUpsType {
  note: string;
  leads_id: string;
  created_at: string;
}

export type ChartDataItem = {
  date: string; // YYYY-MM-DD
  count: number;
};
