import OrderStatusButtons from "./OrderStatusButtons";
import { useState } from "react";
import { Link } from "react-router-dom";
import { orderService, statuses } from "../../../services/orderService";
import {
  useLoad,
  ErrorMessage,
  Empty,
  Status,
} from "../../../components/AsyncState";
import SearchBar from "../../../components/SearchBar";
import Pagination from "../../../components/Pagination";
import Loading from "../../../components/Loading";
import { currency } from "../../../utils/currency";
export default function OrderManagement() {
  const [status, setStatus] = useState(""),
    [search, setSearch] = useState(""),
    [page, setPage] = useState(1),
    [busyOrder, setBusyOrder] = useState(null),
    [actionError, setActionError] = useState("");
  const { data, error, loading, reload } = useLoad(
    () => orderService.list({ status, search, page }),
    [status, search, page],
  );
  async function updateStatus(orderId, nextStatus) {
    setBusyOrder(orderId);
    setActionError("");
    try {
      await orderService.status(orderId, nextStatus);
      reload();
    } catch (error) {
      setActionError(error.message);
    } finally {
      setBusyOrder(null);
    }
  }
  return (
    <>
      <div className="section-heading">
        <h1>Order Management</h1>
        <button className="secondary" onClick={reload}>
          Refresh
        </button>
      </div>
      <div className="toolbar">
        <SearchBar
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          placeholder="Search customer or order number…"
        />
        <select
          aria-label="Order status"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All Statuses</option>
          {statuses.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </div>
      <ErrorMessage message={error || actionError} />
      {loading ? (
        <Loading />
      ) : (
        data &&
        !error && (
          <>
            {data.items.length ? (
              <div className="panel table-wrap">
                <table>
                  <thead>
                    <tr>
                      {[
                        "#",
                        "Customer",
                        "Total Amount",
                        "Status",
                        "Date",
                        "Actions",
                      ].map((s) => (
                        <th key={s}>{s}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.items.map((o) => (
                      <tr key={o.id}>
                        <td>#ORD{o.id}</td>
                        <td>{o.customer.name}</td>
                        <td>{currency(o.total_amount)}</td>
                        <td>
                          <Status value={o.status} />
                          <OrderStatusButtons
                            status={o.status}
                            busy={busyOrder !== null}
                            orderId={o.id}
                            onUpdate={(nextStatus) =>
                              updateStatus(o.id, nextStatus)
                            }
                          />
                        </td>
                        <td>{new Date(o.created_at).toLocaleDateString()}</td>
                        <td>
                          <Link
                            className="button outline small"
                            to={`/admin/orders/${o.id}`}
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <Empty title="No orders found" />
            )}
            <Pagination
              page={page}
              total={data.total}
              pageSize={20}
              onChange={setPage}
            />
          </>
        )
      )}
    </>
  );
}
