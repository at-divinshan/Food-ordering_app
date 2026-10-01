import { useState } from "react";
import { Link } from "react-router-dom";
import { foodService } from "../../../services/foodService";
import { categoryService } from "../../../services/categoryService";
import { useLoad, ErrorMessage, Empty } from "../../../components/AsyncState";
import { FoodImage } from "../../../components/FoodCard";
import SearchBar from "../../../components/SearchBar";
import Pagination from "../../../components/Pagination";
import Loading from "../../../components/Loading";
import { currency } from "../../../utils/currency";
export default function FoodManagement() {
  const [search, setSearch] = useState(""),
    [category, setCategory] = useState(""),
    [availability, setAvailability] = useState(""),
    [page, setPage] = useState(1),
    [actionError, setActionError] = useState(""),
    [busy, setBusy] = useState(null);
  const categories = useLoad(() => categoryService.list());
  const { data, error, loading, reload } = useLoad(
    () =>
      foodService.list({
        search,
        category_id: category,
        is_available: availability,
        page,
        page_size: 20,
        sort: "newest",
      }),
    [search, category, availability, page],
  );
  async function remove(food) {
    if (
      !window.confirm(
        `Delete "${food.name}"? Foods used in orders cannot be deleted.`,
      )
    )
      return;
    setBusy(food.id);
    setActionError("");
    try {
      await foodService.remove(food.id);
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
        <h1>Food Management</h1>
        <Link className="button" to="/admin/foods/add">
          + Add Food
        </Link>
      </div>
      <div className="toolbar">
        <SearchBar
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
        />
        <select
          aria-label="Category"
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All Categories</option>
          {categories.data?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          aria-label="Availability"
          value={availability}
          onChange={(e) => {
            setAvailability(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All Availability</option>
          <option value="true">Available</option>
          <option value="false">Unavailable</option>
        </select>
      </div>
      <ErrorMessage message={error || actionError || categories.error} />
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
                        "Image",
                        "Name",
                        "Category",
                        "Price",
                        "Availability",
                        "Actions",
                      ].map((s) => (
                        <th key={s}>{s}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.items.map((f) => (
                      <tr key={f.id}>
                        <td>{f.id}</td>
                        <td>
                          <div className="thumb">
                            <FoodImage food={f} />
                          </div>
                        </td>
                        <td>
                          <strong>{f.name}</strong>
                        </td>
                        <td>
                          {categories.data?.find((c) => c.id === f.category_id)
                            ?.name || f.category_id}
                        </td>
                        <td>{currency(f.price)}</td>
                        <td>
                          <span
                            className={`status ${f.is_available ? "delivered" : "cancelled"}`}
                          >
                            {f.is_available ? "Available" : "Unavailable"}
                          </span>
                        </td>
                        <td>
                          <div className="actions">
                            <Link
                              className="button outline small"
                              to={`/admin/foods/${f.id}/edit`}
                            >
                              Edit
                            </Link>
                            <button
                              className="danger outline small"
                              disabled={busy === f.id}
                              onClick={() => remove(f)}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <Empty title="No foods found" />
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
