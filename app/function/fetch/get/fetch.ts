import {
  csPerformanceType,
  dashboardFilterType,
  dashboardPayloadType,
  FilterNumber,
  ReportItem,
} from "@/app/types/types";
import axios from "axios";

export const getType = async () => {
  try {
    const res = await axios.get("/api/get/get-type");
    return res;
  } catch (error) {
    console.log("Failed to fetch organisations", error);
  }
};

export const getBranch = async () => {
  try {
    const res = await axios.get("/api/get/get-branch");
    return res;
  } catch (error) {
    console.log("Failed to fetch organisations", error);
  }
};

export const getPlatforms = async () => {
  try {
    const res = await axios.get("/api/get/get-platforms");
    return res;
  } catch (error) {
    console.log("Failed to fetch organisations", error);
  }
};

export const getCostumers = async () => {
  try {
    const res = await axios.get("/api/get/get-costumers");
    return res;
  } catch (error) {
    console.log("Failed to fetch organisations", error);
  }
};

export const getLeads = async (user_id: string) => {
  try {
    const res = await axios.post("/api/get/get-leads", { user_id });
    return res;
  } catch (error) {
    console.log("Failed to fetch organisations", error);
  }
};

export const getFilterSearch = async (data: FilterNumber) => {
  try {
    const res = await axios.post("/api/get/get-filter-search", data);
    return res;
  } catch (error) {
    console.log("Failed to fetch organisations", error);
  }
};
export const getAds = async (user_id: string) => {
  try {
    const res = await axios.post("/api/get/get-ads", { user_id });
    return res;
  } catch (error) {
    console.log("Failed to fetch organisations", error);
  }
};

export const getDashboardData = async (data: dashboardPayloadType) => {
  try {
    const res = await axios.post("/api/get/get-data-dashboard", { data });
    return res;
  } catch (error) {
    console.log("Failed to fetch organisations", error);
  }
};

export const getFilterData = async (data: dashboardFilterType) => {
  try {
    const res = await axios.post("/api/get/get-data-filter", { data });
    return res;
  } catch (error) {
    console.log("Failed to fetch organisations", error);
  }
};

export const getFollowups = async (leads_id: string) => {
  try {
    const res = await axios.post("/api/get/get-followups", { leads_id });
    return res;
  } catch (error) {
    console.log("Failed to fetch organisations", error);
  }
};

export const getCs = async () => {
  try {
    const res = await axios.get("/api/get/get-cs");
    return res;
  } catch (error) {
    console.log("Failed to fetch organisations", error);
  }
};
export const getReport = async (data: ReportItem) => {
  try {
    const res = await axios.post("/api/get/get-report", data);
    return res;
  } catch (error) {
    console.log("Failed to fetch organisations", error);
  }
};

export const getDataAdvertiserList = async (id: string) => {
  try {
    const res = await axios.post("/api/get/get-advertiser-data", {
      user_id: id,
    });
    return res;
  } catch (error) {
    console.log("Failed to fetch organisations", error);
    return null;
  }
};

export const getSocialMediaGrowth = async (id: string) => {
  try {
    const res = await axios.post("/api/get/get-socialmedia-growth", {
      user_id: id,
    });
    return res;
  } catch (error) {
    console.log("Failed to fetch organisations", error);
    return null;
  }
};

export const getRealOmset = async (id: string) => {
  try {
    const res = await axios.post("/api/get/get-real-omset", {
      user_id: id,
    });
    return res;
  } catch (error) {
    console.log("Failed to fetch organisations", error);
    return null;
  }
};

export const getCsPerformance = async (data: csPerformanceType) => {
  try {
    const res = await axios.post("/api/get/get-cs-performance", { data });
    return res;
  } catch (error) {
    console.log("Failed to fetch organisations", error);
  }
};
