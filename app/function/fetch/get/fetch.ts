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
export const getAds = async (user_id: string) => {
  try {
    const res = await axios.post("/api/get/get-ads", { user_id });
    return res;
  } catch (error) {
    console.log("Failed to fetch organisations", error);
  }
};
