import axios from "axios";

export const addUser = async (payload: formType) => {
  try {
    const res = await axios.post("/api/auth/signup", payload);
    return res;
  } catch (error) {
    console.log("Failed to fetch organisations", error);
  }
};

export const login = async (payload: loginType) => {
  try {
    const res = await axios.post("/api/auth/login", payload);
    return res;
  } catch (error) {
    console.log("Failed to fetch organisations", error);
  }
};

export const logOut = async () => {
  try {
    return await axios.post("/api/auth/logout");
  } catch (error) {
    console.log("Failed to fetch organisations", error);
  }
};
