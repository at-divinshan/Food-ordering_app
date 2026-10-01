import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useCart } from "../../context/CartContext";
import CartItem from "../../components/CartItem";
import { Empty } from "../../components/AsyncState";
import { currency } from "../../utils/currency";
export default function Cart() {
  const { items, count, total, clear } = useCart();
  return (
    <main className="container">
      <div className="section-heading">
        <h1>
          Your Cart <small>({count} items)</small>
        </h1>
        {items.length > 0 && (
          <button className="text-button" onClick={clear}>
            Clear Cart
          </button>
        )}
      </div>
      {items.length ? (
        <div className="cart-layout">
          <section className="panel">
            {items.map((item) => (
              <CartItem key={item.id} item={item} />
            ))}
            <Link className="back-link" to="/foods">
              ← Continue browsing
            </Link>
          </section>
          <aside className="panel summary">
            <h2>Order Summary</h2>
            <div>
              <span>Subtotal</span>
              <strong>{currency(total)}</strong>
            </div>
            <div>
              <span>Delivery</span>
              <span>Included</span>
            </div>
            <div className="total">
              <strong>Estimated Total</strong>
              <strong>{currency(total)}</strong>
            </div>
            <p className="muted small-text">
              Final prices and availability are confirmed when you place your
              order.
            </p>
            <Link className="button full" to="/checkout">
              Proceed to Checkout <ArrowRight size={18} />
            </Link>
          </aside>
        </div>
      ) : (
        <Empty title="Your cart is waiting for something delicious">
          <Link className="button" to="/foods">
            Explore Menu →
          </Link>
        </Empty>
      )}
    </main>
  );
}
