import { api } from "./api";
export const categoryService = {
  list: () => api("/categories"),
  get: (id) => api(`/categories/${id}`),
  create: (body) => api("/categories", { method: "POST", body }),
  update: (id, body) => api(`/categories/${id}`, { method: "PUT", body }),
  remove: (id) => api(`/categories/${id}`, { method: "DELETE" }),
};
