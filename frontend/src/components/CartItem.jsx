import { Trash2, Minus, Plus } from "lucide-react";
import { FoodImage } from "./FoodCard";
import { useCart } from "../context/CartContext";
import { currency } from "../utils/currency";
export default function CartItem({ item }) {
  const { setQuantity } = useCart();
  return (
    <div className="cart-item">
      <div className="thumb">
        <FoodImage food={item} />
      </div>
      <div className="grow">
        <strong>{item.name}</strong>
        <p>{currency(item.price)}</p>
      </div>
      <div className="quantity">
        <button
          className="plain"
          aria-label={`Decrease ${item.name}`}
          onClick={() => setQuantity(item.id, item.quantity - 1)}
        >
          <Minus size={14} />
        </button>
        <span>{item.quantity}</span>
        <button
          className="plain"
          disabled={item.quantity >= 99}
          aria-label={`Increase ${item.name}`}
          onClick={() => setQuantity(item.id, item.quantity + 1)}
        >
          <Plus size={14} />
        </button>
      </div>
      <strong>{currency(Number(item.price) * item.quantity)}</strong>
      <button
        className="icon danger"
        aria-label={`Remove ${item.name}`}
        onClick={() => setQuantity(item.id, 0)}
      >
        <Trash2 size={17} />
      </button>
    </div>
  );
}
