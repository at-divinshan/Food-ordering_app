import { createContext, useContext, useEffect, useState } from "react";
import { readCart, cartTotal } from "../utils/cartUtils";
import { useAuth } from "./AuthContext";
const CartContext = createContext(null);
export function CartProvider({ children }) {
  const { user } = useAuth();
  const key = `foodie_cart_${user?.id || "guest"}`;
  const [store, setStore] = useState(() => ({ key, items: readCart(key) }));
  const items = store.key === key ? store.items : readCart(key);
  useEffect(() => {
    let next = readCart(key);
    if (user?.role === "customer") {
      const guest = readCart("foodie_cart_guest");
      for (const item of guest) {
        const found = next.find((i) => i.id === item.id);
        if (found)
          found.quantity = Math.min(99, found.quantity + item.quantity);
        else next.push(item);
      }
      if (guest.length) {
        localStorage.setItem(key, JSON.stringify(next));
        localStorage.removeItem("foodie_cart_guest");
      }
    }
    setStore({ key, items: next });
  }, [key, user?.role]);
  function change(fn) {
    setStore((previous) => {
      const next = fn(previous.key === key ? previous.items : readCart(key));
      localStorage.setItem(key, JSON.stringify(next));
      return { key, items: next };
    });
  }
  const add = (food) =>
    change((old) => {
      const found = old.find((i) => i.id === food.id);
      return found
        ? old.map((i) =>
            i.id === food.id
              ? { ...i, quantity: Math.min(99, i.quantity + 1) }
              : i,
          )
        : [
            ...old,
            {
              id: food.id,
              name: food.name,
              image: food.image,
              price: food.price,
              quantity: 1,
            },
          ];
    });
  const setQuantity = (id, quantity) =>
    change((old) =>
      quantity <= 0
        ? old.filter((i) => i.id !== id)
        : old.map((i) =>
            i.id === id ? { ...i, quantity: Math.min(99, quantity) } : i,
          ),
    );
  const clear = () => change(() => []);
  return (
    <CartContext.Provider
      value={{
        items,
        add,
        setQuantity,
        clear,
        total: cartTotal(items),
        count: items.reduce((s, i) => s + i.quantity, 0),
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
export const useCart = () => useContext(CartContext);
