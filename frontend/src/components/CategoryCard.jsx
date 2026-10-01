import { Link } from "react-router-dom";
export const categoryEmoji = (name) =>
  ({
    pizza: "🍕",
    burger: "🍔",
    rice: "🍚",
    drinks: "🥤",
    desserts: "🧁",
    chicken: "🍗",
    snacks: "🍟",
  })[name.toLowerCase()] || "🍽️";
export default function CategoryCard({ category }) {
  return (
    <Link className="category-card" to={`/foods?category=${category.id}`}>
      <span>{categoryEmoji(category.name)}</span>
      <strong>{category.name}</strong>
    </Link>
  );
}
