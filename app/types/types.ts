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
}

interface itemType {
  id: number;
  name: string;
}

interface formType {
  email: string;
  password: string;
  cabang: string;
  type: number; // Database expects a number
  nama: string;
}

interface leadsType {
  platform_id: string;
  status: string;
  nominal: number | "";
  reason: string;
  name: string;
  user_id: string;
}

interface leadsTypeError {
  platform: {
    name: string;
    id?: string;
  } | null; // <-- Supabase bisa return null
  status: string;
  nominal: number | "";
  reason: string;
  name: string;
  user_id: string;
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
