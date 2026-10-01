import { Link, useParams } from "react-router-dom";
import { foodService } from "../../services/foodService";
import { useLoad, ErrorMessage } from "../../components/AsyncState";
import { FoodImage } from "../../components/FoodCard";
import Loading from "../../components/Loading";
import { useCart } from "../../context/CartContext";
import { currency } from "../../utils/currency";
import { useState } from "react";
export default function FoodDetails() {
  const { id } = useParams(),
    { add } = useCart(),
    [added, setAdded] = useState(false);
  const { data, error, loading } = useLoad(() => foodService.get(id), [id]);
  return (
    <main className="container">
      <Link className="back-link" to="/foods">
        ← Back to Menu
      </Link>
      <ErrorMessage message={error} />
      {loading ? (
        <Loading />
      ) : (
        data && (
          <div className="food-detail panel">
            <div className="detail-image">
              <FoodImage food={data} />
            </div>
            <div>
              <span className="eyebrow">FRESH FROM OUR KITCHEN</span>
              <h1>{data.name}</h1>
              <p className="muted">{data.description}</p>
              <h2>{currency(data.price)}</h2>
              <p>
                {data.is_available
                  ? "Available to order"
                  : "Currently unavailable"}
              </p>
              <button
                disabled={!data.is_available}
                onClick={() => {
                  add(data);
                  setAdded(true);
                }}
              >
                {added ? "Added — add another" : "Add to Cart"}
              </button>
              {added && (
                <Link className="button secondary" to="/cart">
                  View Cart →
                </Link>
              )}
            </div>
          </div>
        )
      )}
    </main>
  );
}
