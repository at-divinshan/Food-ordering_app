import { api, query } from "./api";
export const foodService = {
  list: (params) => api(`/foods?${query(params || {})}`),
  get: (id) => api(`/foods/${id}`),
  create: (body) => api("/foods", { method: "POST", body }),
  update: (id, body) => api(`/foods/${id}`, { method: "PUT", body }),
  remove: (id) => api(`/foods/${id}`, { method: "DELETE" }),
};
