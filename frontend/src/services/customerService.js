import { api, query } from "./api";
export const customerService = {
  me: () => api("/customers/me"),
  update: (body) => api("/customers/me", { method: "PUT", body }),
  list: (params) => api(`/customers?${query(params || {})}`),
};
