import axios from "axios";

export const addUser = async (payload: formType) => {
  try {
    const res = await axios.post("/api/auth/signup", payload);
    return res;
  } catch (error) {
    console.log("Failed to fetch organisations", error);
  }
};
