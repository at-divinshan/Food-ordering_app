import OrderStatusButtons from "./OrderStatusButtons";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { orderService, transitions } from "../../../services/orderService";
import { useLoad, ErrorMessage, Status } from "../../../components/AsyncState";
import { FoodImage } from "../../../components/FoodCard";
import Loading from "../../../components/Loading";
import { useAuth } from "../../../context/AuthContext";
import { currency } from "../../../utils/currency";
export default function OrderDetails() {
  const { id } = useParams(),
    { user } = useAuth(),
    admin = user.role === "admin";
  const { data, error, loading, reload } = useLoad(
    () => orderService.get(id),
    [id],
  );
  const [actionError, setActionError] = useState(""),
    [busy, setBusy] = useState(false);
  async function update(status) {
    setBusy(true);
    setActionError("");
    try {
      await orderService.status(id, status);
      reload();
    } catch (e) {
      setActionError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className={admin ? "" : "container"}>
      <Link className="back-link" to={admin ? "/admin/orders" : "/my-orders"}>
        ← {admin ? "Orders" : "My Orders"}
      </Link>
      <ErrorMessage message={error || actionError} />
      {loading ? (
        <Loading />
      ) : (
        data &&
        !error && (
          <>
            <div className="section-heading">
              <div>
                <h1>Order #ORD{data.id}</h1>
                <p className="muted">
                  {new Date(data.created_at).toLocaleString()}
                </p>
              </div>
              <Status value={data.status} />
            </div>
            <div className="cart-layout">
              <section className="panel">
                <h3>Order Items</h3>
                {data.items.map((i) => (
                  <div className="cart-item" key={i.id}>
                    <div className="thumb">
                      <FoodImage food={i} />
                    </div>
                    <div className="grow">
                      <strong>{i.name}</strong>
                      <p className="muted">
                        {currency(i.unit_price)} × {i.quantity}
                      </p>
                    </div>
                    <strong>{currency(i.subtotal)}</strong>
                  </div>
                ))}
                <div className="summary">
                  <div>
                    <span>Subtotal</span>
                    <strong>{currency(data.subtotal)}</strong>
                  </div>
                  <div className="total">
                    <strong>Total</strong>
                    <strong>{currency(data.total_amount)}</strong>
                  </div>
                </div>
              </section>
              <aside className="panel">
                <h3>Customer Details</h3>
                <strong>{data.customer.name}</strong>
                <p>{data.customer.email}</p>
                <p>{data.customer.phone}</p>
                <p>{data.customer.address}</p>
                <p className="muted small-text">
                  Current customer contact details.
                </p>
                {admin && (
                  <>
                    <h3>Manage Order</h3>
                    <OrderStatusButtons
                      status={data.status}
                      busy={busy}
                      onUpdate={update}
                      orderId={data.id}
                    />
                    {!transitions[data.status]?.length && (
                      <p className="muted">This order is complete.</p>
                    )}
                  </>
                )}
              </aside>
            </div>
          </>
        )
      )}
    </div>
  );
}
