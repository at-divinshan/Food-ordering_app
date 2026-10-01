import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { customerService } from "../../services/customerService";
import { orderService } from "../../services/orderService";
import { ErrorMessage, Empty } from "../../components/AsyncState";
import { FoodImage } from "../../components/FoodCard";
import { currency } from "../../utils/currency";
import Loading from "../../components/Loading";
export default function Checkout() {
  const { user } = useAuth(),
    { items, total, clear } = useCart(),
    navigate = useNavigate();
  const [profile, setProfile] = useState(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const submitting = useRef(false);
  useEffect(() => {
    customerService
      .me()
      .then(setProfile)
      .catch((e) => setError(e.message));
  }, []);
  async function submit(e) {
    e.preventDefault();
    if (submitting.current) return;
    submitting.current = true;
    setBusy(true);
    setError("");
    const customer = Object.fromEntries(new FormData(e.currentTarget));
    try {
      const order = await orderService.place({
        customer,
        items: items.map((i) => ({ food_id: i.id, quantity: i.quantity })),
      });
      clear();
      navigate(`/order-confirmation/${order.id}`, { replace: true });
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
      submitting.current = false;
    }
  }
  if (!items.length)
    return (
      <main className="container">
        <Empty title="Your cart is empty">
          <Link className="button" to="/foods">
            Browse Foods
          </Link>
        </Empty>
      </main>
    );
  return (
    <main className="container">
      <Link className="back-link" to="/cart">
        ← Back to Cart
      </Link>
      <h1>Checkout</h1>
      <ErrorMessage message={error} />
      {!profile ? (
        !error && <Loading />
      ) : (
        <form onSubmit={submit} className="checkout-grid panel">
          <section>
            <h3>
              <b className="step">1</b>Customer Information
            </h3>
            <label>
              Full Name
              <input
                name="name"
                defaultValue={profile.name}
                required
                minLength={2}
                maxLength={100}
              />
            </label>
            <label>
              Email
              <input value={user.email} disabled />
            </label>
            <label>
              Phone
              <input
                name="phone"
                type="tel"
                defaultValue={profile.phone}
                required
                minLength={7}
                maxLength={30}
                placeholder="Enter your phone number"
              />
            </label>
          </section>
          <section>
            <h3>
              <b className="step">2</b>Delivery Details
            </h3>
            <div className="delivery-type">◉ Home Delivery</div>
            <label>
              Delivery Address
              <textarea
                name="address"
                defaultValue={profile.address}
                required
                minLength={5}
                maxLength={255}
                placeholder="House number, street and city"
                rows={5}
              />
            </label>
            <p className="muted small-text">
              Please provide your full address and a phone number we can reach
              you on.
            </p>
          </section>
          <section className="summary">
            <h3>
              <b className="step">3</b>Order Summary
            </h3>
            {items.map((i) => (
              <div className="checkout-item" key={i.id}>
                <div className="thumb">
                  <FoodImage food={i} />
                </div>
                <span>
                  {i.name} × {i.quantity}
                </span>
                <strong>{currency(Number(i.price) * i.quantity)}</strong>
              </div>
            ))}
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
            <button className="full" disabled={busy}>
              {busy ? "Placing Order…" : "Place Order →"}
            </button>
          </section>
        </form>
      )}
    </main>
  );
}
