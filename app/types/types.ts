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

interface loginType {
  email: string;
  password: string;
}
