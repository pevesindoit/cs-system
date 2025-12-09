import axios from "axios";

export const getType = async () => {
  try {
    const res = await axios.post("/api/auth/signup");
    return res;
  } catch (error) {
    console.log("Failed to fetch organisations", error);
  }
};
