import { Link } from "react-router-dom";
import { ArrowRight, Leaf, Clock, Heart } from "lucide-react";
import { categoryService } from "../../services/categoryService";
import { foodService } from "../../services/foodService";
import { useLoad, ErrorMessage, Empty } from "../../components/AsyncState";
import CategoryCard from "../../components/CategoryCard";
import FoodCard from "../../components/FoodCard";
import Loading from "../../components/Loading";
export default function Home() {
  const { data, error, loading } = useLoad(() =>
    Promise.all([
      categoryService.list(),
      foodService.list({ page_size: 4, sort: "popular", is_available: true }),
    ]),
  );
  return (
    <main className="container customer-home">
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">Fresh Ingredients · Great Taste</span>
          <h1>
            Delicious Food
            <br />
            Delivered To You<span>.</span>
          </h1>
          <p>
            Your favorites, freshly prepared.
            <br />
            Order from our menu and let us bring the happiness.
          </p>
          <Link className="button" to="/foods">
            Order Now <ArrowRight size={18} />
          </Link>
          <div className="hero-perks">
            <span>
              <Leaf size={16} />
              Fresh & healthy
            </span>
            <span>
              <Clock size={16} />
              Made to order
            </span>
          </div>
        </div>
        <div className="hero-image">
          <img
            src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1000&q=85"
            alt="Freshly prepared colorful food bowl"
          />
          <span className="hero-sticker">
            <Heart size={21} />
            Made with
            <br />
            <strong>love & flavor</strong>
          </span>
        </div>
      </section>
      <ErrorMessage message={error} />
      {loading ? (
        <Loading />
      ) : (
        data && (
          <>
            <div className="section-heading">
              <div>
                <span className="eyebrow">SOMETHING FOR EVERY CRAVING</span>
                <h2>Popular Categories</h2>
              </div>
              <Link to="/foods">
                View All <ArrowRight size={16} />
              </Link>
            </div>
            {data[0].length ? (
              <div className="category-grid">
                {data[0].map((c) => (
                  <CategoryCard key={c.id} category={c} />
                ))}
              </div>
            ) : (
              <Empty title="The menu is being prepared" />
            )}
            <div className="section-heading">
              <div>
                <span className="eyebrow">YOUR NEXT FAVORITE</span>
                <h2>Fresh from our kitchen</h2>
              </div>
              <Link to="/foods">
                Explore Menu <ArrowRight size={16} />
              </Link>
            </div>
            <div className="food-grid home-foods">
              {data[1].items.map((f) => (
                <FoodCard key={f.id} food={f} />
              ))}
            </div>
          </>
        )
      )}
    </main>
  );
}
