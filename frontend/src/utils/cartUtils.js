export function readCart(key) {
  try {
    const data = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(data)
      ? data.filter(
          (i) =>
            Number.isInteger(i.id) &&
            i.id > 0 &&
            Number.isInteger(i.quantity) &&
            i.quantity > 0 &&
            i.quantity <= 99 &&
            Number.isFinite(Number(i.price)) &&
            Number(i.price) > 0,
        )
      : [];
  } catch {
    return [];
  }
}
export const cartTotal = (items) =>
  items.reduce(
    (sum, item) => sum + Math.round(Number(item.price) * 100) * item.quantity,
    0,
  ) / 100;
