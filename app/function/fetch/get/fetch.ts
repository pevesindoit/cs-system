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
