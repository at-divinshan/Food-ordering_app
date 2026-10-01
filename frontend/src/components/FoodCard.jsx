import { Link } from "react-router-dom";
import { Plus, Check } from "lucide-react";
import { useState } from "react";
import { useCart } from "../context/CartContext";
import { currency } from "../utils/currency";
export function FoodImage({ food, className = "" }) {
  return food.image ? (
    <img
      className={className}
      src={food.image}
      alt={food.name}
      loading="lazy"
      onError={(e) => {
        e.currentTarget.style.display = "none";
        e.currentTarget.parentElement.classList.add("image-missing");
      }}
    />
  ) : (
    <span className={`food-placeholder ${className}`} aria-label={food.name}>
      🍽️
    </span>
  );
}
export default function FoodCard({ food }) {
  const { add } = useCart();
  const [added, setAdded] = useState(false);
  return (
    <article className="food-card">
      <Link to={`/foods/${food.id}`} className="food-photo">
        <FoodImage food={food} />
        {!food.is_available && <span className="unavailable">Unavailable</span>}
      </Link>
      <div className="food-card-body">
        <Link to={`/foods/${food.id}`}>
          <h3>{food.name}</h3>
        </Link>
        <p className="food-description">
          {food.description || "Freshly prepared, just for you."}
        </p>
        <div className="food-price">{currency(food.price)}</div>
        <button
          disabled={!food.is_available}
          onClick={() => {
            add(food);
            setAdded(true);
            setTimeout(() => setAdded(false), 1600);
          }}
        >
          {added ? (
            <>
              <Check size={16} /> Added to Cart
            </>
          ) : (
            <>
              <Plus size={16} /> Add to Cart
            </>
          )}
        </button>
      </div>
    </article>
  );
}
