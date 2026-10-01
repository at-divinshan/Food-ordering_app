import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { categoryService } from "../../../services/categoryService";
import { ErrorMessage } from "../../../components/AsyncState";
import Loading from "../../../components/Loading";
export function CategoryForm({ id }) {
  const navigate = useNavigate(),
    [data, setData] = useState(id ? null : {}),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    if (id)
      categoryService
        .get(id)
        .then(setData)
        .catch((e) => setError(e.message));
  }, [id]);
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const body = Object.fromEntries(new FormData(e.currentTarget));
      await (id
        ? categoryService.update(id, body)
        : categoryService.create(body));
      navigate("/admin/categories");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Link className="back-link" to="/admin/categories">
        ← Categories
      </Link>
      <h1>{id ? "Edit" : "Add"} Category</h1>
      <ErrorMessage message={error} />
      {data ? (
        <form className="panel editor-form" onSubmit={submit}>
          <label>
            Name
            <input
              name="name"
              defaultValue={data.name || ""}
              required
              maxLength={100}
            />
          </label>
          <label>
            Description
            <textarea
              name="description"
              defaultValue={data.description || ""}
              maxLength={255}
              rows={4}
            />
          </label>
          <div className="actions">
            <button disabled={busy}>
              {busy ? "Saving…" : "Save Category"}
            </button>
            <Link className="button secondary" to="/admin/categories">
              Cancel
            </Link>
          </div>
        </form>
      ) : (
        !error && <Loading />
      )}
    </>
  );
}
export default function AddCategory() {
  return <CategoryForm />;
}
