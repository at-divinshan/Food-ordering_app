import { api, query } from "./api";
export const orderService = {
  place: (body) => api("/orders", { method: "POST", body }),
  mine: (params) => api(`/orders/mine?${query(params || {})}`),
  list: (params) => api(`/orders?${query(params || {})}`),
  get: (id) => api(`/orders/${id}`),
  status: (id, status) =>
    api(`/orders/${id}/status`, { method: "PATCH", body: { status } }),
};
export const statuses = [
  "Pending",
  "Preparing",
  "Out for Delivery",
  "Delivered",
  "Cancelled",
];
export const transitions = {
  Pending: ["Preparing", "Cancelled"],
  Preparing: ["Out for Delivery", "Cancelled"],
  "Out for Delivery": ["Delivered"],
  Delivered: [],
  Cancelled: [],
};
