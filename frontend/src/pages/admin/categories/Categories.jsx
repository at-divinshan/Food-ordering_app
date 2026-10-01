import { useState } from "react";
import { Link } from "react-router-dom";
import { categoryService } from "../../../services/categoryService";
import { useLoad, ErrorMessage, Empty } from "../../../components/AsyncState";
import Loading from "../../../components/Loading";
export default function Categories() {
  const { data, error, loading, reload } = useLoad(() =>
    categoryService.list(),
  );
  const [actionError, setActionError] = useState(""),
    [busy, setBusy] = useState(null);
  async function remove(c) {
    if (!window.confirm(`Delete category "${c.name}"?`)) return;
    setBusy(c.id);
    setActionError("");
    try {
      await categoryService.remove(c.id);
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
        <h1>Categories</h1>
        <Link className="button" to="/admin/categories/add">
          + Add Category
        </Link>
      </div>
      <ErrorMessage message={error || actionError} />
      {loading ? (
        <Loading />
      ) : data?.length ? (
        <div className="panel table-wrap">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Description</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.map((c) => (
                <tr key={c.id}>
                  <td>{c.id}</td>
                  <td>
                    <strong>{c.name}</strong>
                  </td>
                  <td>{c.description || "—"}</td>
                  <td className="actions">
                    <Link
                      className="button outline small"
                      to={`/admin/categories/${c.id}/edit`}
                    >
                      Edit
                    </Link>
                    <button
                      className="danger outline small"
                      disabled={busy === c.id}
                      onClick={() => remove(c)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        !error && (
          <Empty title="No categories yet">
            <p>Add your first category to organize the menu.</p>
          </Empty>
        )
      )}
    </>
  );
}
