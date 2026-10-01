import {
  ShoppingBag,
  Users,
  Utensils,
  Layers,
  Wallet,
  Clock,
  CheckCircle,
} from "lucide-react";
import { api } from "../../services/api";
import { useLoad, ErrorMessage, Empty } from "../../components/AsyncState";
import { FoodImage } from "../../components/FoodCard";
import Loading from "../../components/Loading";
import { currency } from "../../utils/currency";
export default function Dashboard({ statistics = false }) {
  const { data, error, loading, reload } = useLoad(() => api("/dashboard"));
  const metrics = data
    ? [
        ["Total Foods", data.foods, Utensils],
        ["Total Categories", data.categories, Layers],
        ["Total Customers", data.customers, Users],
        ["Total Users", data.users, Users],
        ["Total Orders", data.orders, ShoppingBag],
        ["Delivered Revenue", currency(data.revenue), Wallet],
        ["Pending Orders", data.pending_orders, Clock],
        ["Delivered Orders", data.delivered_orders, CheckCircle],
      ]
    : [];
  return (
    <>
      <div className="section-heading">
        <div>
          <h1>{statistics ? "Statistics" : "Dashboard Overview"}</h1>
          <p className="muted">A fresh look at your business.</p>
        </div>
        <button className="secondary" onClick={reload}>
          Refresh
        </button>
      </div>
      <ErrorMessage message={error} />
      {loading ? (
        <Loading />
      ) : (
        data &&
        !error && (
          <>
            <div className="metrics">
              {metrics.map(([label, value, Icon], i) => (
                <div className="metric panel" key={label}>
                  <span className={`metric-icon color-${i % 4}`}>
                    <Icon size={22} />
                  </span>
                  <div>
                    <span>{label}</span>
                    <strong>{value}</strong>
                  </div>
                </div>
              ))}
            </div>
            <div className="dashboard-grid">
              <section className="panel orders-overview">
                <h3>Orders Overview</h3>
                <p className="muted small-text">
                  Last 7 days with order activity
                </p>
                {data.daily_orders.length ? (
                  <div className="bar-chart">
                    {data.daily_orders.map((d) => (
                      <div key={d.date}>
                        <span>{d.orders}</span>
                        <div
                          className="bar"
                          style={{
                            height: `${Math.max(4, (d.orders / Math.max(...data.daily_orders.map((x) => x.orders))) * 150)}px`,
                          }}
                        />
                        <small>
                          {new Date(`${d.date}T00:00:00`).toLocaleDateString(
                            undefined,
                            { month: "short", day: "numeric" },
                          )}
                        </small>
                      </div>
                    ))}
                  </div>
                ) : (
                  <Empty title="No orders yet" />
                )}
              </section>
              <section className="panel">
                <h3>Popular Foods</h3>
                {data.popular_foods.length ? (
                  data.popular_foods.map((f, i) => (
                    <div className="popular-row" key={f.id}>
                      <b>{i + 1}</b>
                      <div className="thumb">
                        <FoodImage food={f} />
                      </div>
                      <strong>{f.name}</strong>
                      <span>{f.quantity} sold</span>
                    </div>
                  ))
                ) : (
                  <Empty title="Waiting for your first order" />
                )}
              </section>
            </div>
            {statistics && (
              <section className="panel">
                <h3>Orders by Status</h3>
                <div className="metrics">
                  {Object.entries(data.statuses).map(([status, count]) => (
                    <div className="metric" key={status}>
                      <div>
                        <span>{status}</span>
                        <strong>{count}</strong>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="muted small-text">
                  Revenue includes delivered orders only. Popular foods exclude
                  cancelled orders.
                </p>
              </section>
            )}
          </>
        )
      )}
    </>
  );
}
