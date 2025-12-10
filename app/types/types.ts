interface TypeType {
  id: number;
  name: string;
}

interface BranchType {
  id: string;
  name: string;
}

interface formType {
  email: string;
  password: string;
  cabang: string;
  type: number; // Database expects a number
  nama: string;
}
