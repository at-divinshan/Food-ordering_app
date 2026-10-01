import { Link, useParams } from "react-router-dom";
import { Check } from "lucide-react";
import { orderService } from "../../services/orderService";
import { useLoad, ErrorMessage } from "../../components/AsyncState";
import Loading from "../../components/Loading";
import { currency } from "../../utils/currency";
export default function OrderConfirmation() {
  const { id } = useParams(),
    { data, error, loading } = useLoad(() => orderService.get(id), [id]);
  return (
    <main className="container">
      <ErrorMessage message={error} />
      {loading ? (
        <Loading />
      ) : (
        data && (
          <section className="confirmation panel">
            <span className="success-check">
              <Check size={48} />
            </span>
            <h1>Order Placed Successfully!</h1>
            <p>Thank you for your order. Our kitchen will get started soon.</p>
            <div className="confirmation-info">
              <strong>Order ID: #ORD{data.id}</strong>
              <p>
                {data.items.reduce((s, i) => s + i.quantity, 0)} items ·{" "}
                {currency(data.total_amount)}
              </p>
              <span>Status: {data.status}</span>
            </div>
            <Link className="button" to="/my-orders">
              View My Orders →
            </Link>
            <Link className="back-link" to={`/my-orders/${data.id}`}>
              View Order Details
            </Link>
          </section>
        )
      )}
    </main>
  );
}
