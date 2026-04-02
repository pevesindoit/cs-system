import axios from "axios";

export const deleteLead = async (id: string) => {
  try {
    const res = await axios.post("/api/delete/delete-lead", {
      id,
    });
    return res;
  } catch (error) {
    console.log("Failed to fetch organisations", error);
    return null;
  }
};

export const deleteAdvertiserData = async (id: string | number) => {
  try {
    const res = await axios.post("/api/delete/delete-advertiser-data", {
      id,
    });
    return res;
  } catch (error) {
    console.log("Failed to delete advertiser data", error);
    return null;
  }
};
