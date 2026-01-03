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
