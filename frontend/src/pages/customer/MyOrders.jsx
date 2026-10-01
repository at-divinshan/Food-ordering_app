import { useState } from "react";
import { Link } from "react-router-dom";
import { orderService, statuses } from "../../services/orderService";
import {
  useLoad,
  ErrorMessage,
  Empty,
  Status,
} from "../../components/AsyncState";
import { FoodImage } from "../../components/FoodCard";
import Pagination from "../../components/Pagination";
import Loading from "../../components/Loading";
import { currency } from "../../utils/currency";
export default function MyOrders() {
  const [status, setStatus] = useState(""),
    [page, setPage] = useState(1);
  const { data, error, loading, reload } = useLoad(
    () => orderService.mine({ status, page }),
    [status, page],
  );
  return (
    <main className="container">
      <div className="section-heading">
        <h1>My Orders</h1>
        <button className="secondary" onClick={reload}>
          Refresh
        </button>
      </div>
      <div className="tabs">
        {["", ...statuses].map((s) => (
          <button
            key={s}
            className={s === status ? "selected" : "secondary"}
            onClick={() => {
              setStatus(s);
              setPage(1);
            }}
          >
            {s || "All Orders"}
          </button>
        ))}
      </div>
      <ErrorMessage message={error} />
      {loading ? (
        <Loading />
      ) : (
        data &&
        !error && (
          <>
            {data.items.length ? (
              <div className="order-list">
                {data.items.map((o) => (
                  <article className="order-row panel" key={o.id}>
                    <div>
                      <strong>Order #ORD{o.id}</strong>
                      <p className="muted small-text">
                        {new Date(o.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="order-thumbs">
                      {o.items.slice(0, 3).map((i) => (
                        <div className="thumb" key={i.id}>
                          <FoodImage food={i} />
                        </div>
                      ))}
                    </div>
                    <span>
                      {o.items.reduce((s, i) => s + i.quantity, 0)} items
                    </span>
                    <strong>{currency(o.total_amount)}</strong>
                    <Status value={o.status} />
                    <Link
                      className="button secondary small"
                      to={`/my-orders/${o.id}`}
                    >
                      View Details
                    </Link>
                  </article>
                ))}
              </div>
            ) : (
              <Empty title="No orders here yet">
                <Link to="/foods" className="button">
                  Explore Menu
                </Link>
              </Empty>
            )}
            <Pagination
              page={page}
              total={data.total}
              pageSize={10}
              onChange={setPage}
            />
          </>
        )
      )}
    </main>
  );
}
