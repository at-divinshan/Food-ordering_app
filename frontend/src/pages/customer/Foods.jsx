import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { categoryService } from "../../services/categoryService";
import { foodService } from "../../services/foodService";
import { useLoad, ErrorMessage, Empty } from "../../components/AsyncState";
import FoodCard from "../../components/FoodCard";
import SearchBar from "../../components/SearchBar";
import Pagination from "../../components/Pagination";
import Loading from "../../components/Loading";
export default function Foods() {
  const [params, setParams] = useSearchParams();
  const category = params.get("category") || "";
  const [search, setSearch] = useState(""),
    [sort, setSort] = useState("popular"),
    [page, setPage] = useState(1),
    [available, setAvailable] = useState(""),
    [min, setMin] = useState(""),
    [max, setMax] = useState("");
  const categories = useLoad(() => categoryService.list());
  const { data, error, loading } = useLoad(
    () =>
      foodService.list({
        search,
        category_id: category,
        sort,
        page,
        is_available: available,
        min_price: min,
        max_price: max,
      }),
    [search, category, sort, page, available, min, max],
  );
  function change(setter) {
    return (v) => {
      setter(v);
      setPage(1);
    };
  }
  return (
    <main className="container">
      <div className="page-heading">
        <span className="eyebrow">GOOD FOOD, GREAT CHOICES</span>
        <h1>Our Menu</h1>
        <p className="muted">
          Find something delicious for every kind of craving.
        </p>
      </div>
      <div className="menu-layout">
        <aside className="category-sidebar">
          <h3>Categories</h3>
          <button
            className={!category ? "selected" : ""}
            onClick={() => {
              setParams({});
              setPage(1);
            }}
          >
            All Foods
          </button>
          {categories.data?.map((c) => (
            <button
              key={c.id}
              className={category === String(c.id) ? "selected" : ""}
              onClick={() => {
                setParams({ category: c.id });
                setPage(1);
              }}
            >
              {c.name}
            </button>
          ))}
          <ErrorMessage message={categories.error} />
        </aside>
        <section className="menu-content">
          <div className="toolbar">
            <SearchBar value={search} onChange={change(setSearch)} />
            <select
              aria-label="Sort foods"
              value={sort}
              onChange={(e) => change(setSort)(e.target.value)}
            >
              <option value="popular">Most Popular</option>
              <option value="newest">Newest</option>
              <option value="name">Name A–Z</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
            <select
              aria-label="Availability"
              value={available}
              onChange={(e) => change(setAvailable)(e.target.value)}
            >
              <option value="">All availability</option>
              <option value="true">Available</option>
              <option value="false">Unavailable</option>
            </select>
          </div>
          <div className="price-filter">
            <span>Price range</span>
            <input
              aria-label="Minimum price"
              type="number"
              min="0"
              value={min}
              onChange={(e) => change(setMin)(e.target.value)}
              placeholder="Min Rs."
            />
            <span>–</span>
            <input
              aria-label="Maximum price"
              type="number"
              min="0"
              value={max}
              onChange={(e) => change(setMax)(e.target.value)}
              placeholder="Max Rs."
            />
            <small>{data?.total ?? 0} foods</small>
          </div>
          <ErrorMessage message={error} />
          {loading ? (
            <Loading />
          ) : (
            data &&
            !error && (
              <>
                {data.items.length ? (
                  <div className="food-grid">
                    {data.items.map((food) => (
                      <FoodCard key={food.id} food={food} />
                    ))}
                  </div>
                ) : (
                  <Empty title="No foods found">
                    <p>Try another category or search.</p>
                  </Empty>
                )}
                <Pagination
                  page={page}
                  total={data.total}
                  pageSize={12}
                  onChange={setPage}
                />
              </>
            )
          )}
        </section>
      </div>
    </main>
  );
}
