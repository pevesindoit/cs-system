import axios from "axios";

export const addCostumer = async (data: CostumerType) => {
  try {
    const res = await axios.post("/api/add/add-costumer", data);
    return res;
  } catch (error) {
    console.log("Failed to fetch organisations", error);
  }
};

export const addLead = async (data: CostumerType) => {
  try {
    const res = await axios.post("/api/add/add-lead", data);
    return res;
  } catch (error) {
    console.log("Failed to fetch organisations", error);
  }
};
