import { useState } from "react";
import { api, query } from "../../../services/api";
import { customerService } from "../../../services/customerService";
import { useLoad, ErrorMessage, Empty } from "../../../components/AsyncState";
import Pagination from "../../../components/Pagination";
import Loading from "../../../components/Loading";
import SearchBar from "../../../components/SearchBar";
export default function CustomerManagement({ users = false }) {
  const [page, setPage] = useState(1),
    [search, setSearch] = useState(""),
    [actionError, setActionError] = useState(""),
    [busy, setBusy] = useState(null);
  const { data, error, loading, reload } = useLoad(
    () =>
      users
        ? api(`/users?${query({ page, search })}`)
        : customerService.list({ page }),
    [users, page, search],
  );
  async function toggle(u) {
    setBusy(u.id);
    setActionError("");
    try {
      await api(`/users/${u.id}`, {
        method: "PATCH",
        body: { is_active: !u.is_active },
      });
      reload();
    } catch (e) {
      setActionError(e.message);
    } finally {
      setBusy(null);
    }
  }
  return (
    <>
      <div className="section-heading">
        <h1>{users ? "User" : "Customer"} Management</h1>
        <button className="secondary" onClick={reload}>
          Refresh
        </button>
      </div>
      {users && (
        <div className="toolbar">
          <SearchBar
            value={search}
            onChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            placeholder="Search users…"
          />
        </div>
      )}
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
                      {(users
                        ? ["#", "Name", "Email", "Role", "Status", "Actions"]
                        : ["#", "Name", "Email", "Phone", "Address"]
                      ).map((h) => (
                        <th key={h}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.items.map((u) => (
                      <tr key={u.id}>
                        <td>{u.id}</td>
                        <td>
                          <strong>{u.name}</strong>
                        </td>
                        <td>{u.email}</td>
                        {users ? (
                          <>
                            <td>{u.role}</td>
                            <td>
                              <span
                                className={`status ${u.is_active ? "delivered" : "cancelled"}`}
                              >
                                {u.is_active ? "Active" : "Inactive"}
                              </span>
                            </td>
                            <td>
                              {u.role !== "admin" && (
                                <button
                                  disabled={busy === u.id}
                                  className="outline small"
                                  onClick={() => toggle(u)}
                                >
                                  {u.is_active ? "Deactivate" : "Activate"}
                                </button>
                              )}
                            </td>
                          </>
                        ) : (
                          <>
                            <td>{u.phone || "—"}</td>
                            <td>{u.address || "—"}</td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <Empty title={`No ${users ? "users" : "customers"} found`} />
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
