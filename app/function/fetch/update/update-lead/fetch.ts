import axios from "axios";

type UpdateLeadPayload = {
  id: string;
  field: string;
  value: string | number;
};

export const updateLead = async ({ id, field, value }: UpdateLeadPayload) => {
  const res = await axios.post("/api/update/update-lead", {
    id,
    field,
    value,
  });

  return res.data;
};
export const updateAdvertiser = async ({
  id,
  field,
  value,
}: UpdateLeadPayload) => {
  const res = await axios.post("/api/update/update-advertiser", {
    id,
    field,
    value,
  });

  return res.data;
};

export const updateSocialMediaGrowth = async ({
  id,
  field,
  value,
}: UpdateLeadPayload) => {
  const res = await axios.post("/api/update/update-socialmedia-growth", {
    id,
    field,
    value,
  });

  return res.data;
};
