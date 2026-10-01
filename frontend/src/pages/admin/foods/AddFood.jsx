import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { foodService } from "../../../services/foodService";
import { categoryService } from "../../../services/categoryService";
import { useLoad, ErrorMessage } from "../../../components/AsyncState";
import Loading from "../../../components/Loading";
export function FoodForm({ id }) {
  const navigate = useNavigate(),
    [data, setData] = useState(id ? null : { is_available: true }),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const categories = useLoad(() => categoryService.list());
  useEffect(() => {
    if (id)
      foodService
        .get(id)
        .then(setData)
        .catch((e) => setError(e.message));
  }, [id]);
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(e.currentTarget);
    const body = {
      name: form.get("name"),
      description: form.get("description"),
      price: form.get("price"),
      image: form.get("image") || null,
      category_id: Number(form.get("category_id")),
      is_available: form.get("is_available") === "on",
    };
    try {
      if (!id) {
        const name = form.get("category_name").trim();
        if (!name) throw new Error("Enter a category name.");
        const existing = await categoryService.list();
        const category =
          existing.find(
            (category) => category.name.toLowerCase() === name.toLowerCase(),
          ) || (await categoryService.create({ name }));
        body.category_id = category.id;
      }
      await (id ? foodService.update(id, body) : foodService.create(body));
      navigate("/admin/foods");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Link className="back-link" to="/admin/foods">
        ← Food Management
      </Link>
      <h1>{id ? "Edit" : "Add"} Food</h1>
      <ErrorMessage message={error || categories.error} />
      {data && !categories.loading ? (
        <form className="panel editor-form" onSubmit={submit}>
          <label>
            Food Name
            <input
              name="name"
              defaultValue={data.name || ""}
              required
              maxLength={150}
            />
          </label>
          <div className="form-row">
            <label>
              Category
              {id ? (
                <select
                  name="category_id"
                  defaultValue={data.category_id || ""}
                  required
                >
                  <option value="" disabled>
                    Select category
                  </option>
                  {categories.data?.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  name="category_name"
                  type="text"
                  placeholder="Enter category name"
                  required
                  maxLength={100}
                />
              )}
            </label>
            <label>
              Price (Rs.)
              <input
                name="price"
                type="number"
                min="0.01"
                max="99999999.99"
                step="0.01"
                defaultValue={data.price || ""}
                required
              />
            </label>
          </div>
          {id && categories.data?.length === 0 && (
            <p>
              Add a <Link to="/admin/categories/add">category</Link> first.
            </p>
          )}
          <label>
            Description
            <textarea
              name="description"
              defaultValue={data.description || ""}
              maxLength={255}
              rows={3}
            />
          </label>
          <label>
            Image URL
            <input
              name="image"
              defaultValue={data.image || ""}
              placeholder="https://… or /images/food.jpg"
              maxLength={255}
            />
          </label>
          <label className="checkbox">
            <input
              name="is_available"
              type="checkbox"
              defaultChecked={data.is_available}
            />
            Available to order
          </label>
          <div className="actions">
            <button disabled={busy || (id && !categories.data?.length)}>
              {busy ? "Saving…" : "Save Food"}
            </button>
            <Link className="button secondary" to="/admin/foods">
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
export default function AddFood() {
  return <FoodForm />;
}
