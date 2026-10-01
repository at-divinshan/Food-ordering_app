import { Link, NavLink, useNavigate } from "react-router-dom";
import { ChefHat, ShoppingCart, LogOut, UserRound } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
export function Brand() {
  return (
    <Link to="/" className="brand">
      <ChefHat />
      <span>
        Foodie<small>Fresh food. Happy mood.</small>
      </span>
    </Link>
  );
}
export default function Navbar() {
  const { user, logout } = useAuth(),
    { count } = useCart(),
    navigate = useNavigate();
  return (
    <header className="navbar">
      <div className="nav-inner">
        <Brand />
        <nav>
          <NavLink to="/">Home</NavLink>
          <NavLink to="/foods">Menu</NavLink>
          {user?.role === "customer" && (
            <NavLink to="/my-orders">My Orders</NavLink>
          )}
          {user?.role === "admin" && <NavLink to="/admin">Admin Panel</NavLink>}
        </nav>
        <div className="nav-actions">
          <Link
            className="cart-link"
            to="/cart"
            aria-label={`Cart, ${count} items`}
          >
            <ShoppingCart size={22} />
            {count > 0 && <b>{count}</b>}
          </Link>
          {user ? (
            <>
              <span className="user-name">
                <UserRound size={17} />
                {user.name}
              </span>
              <button
                className="icon"
                title="Sign out"
                aria-label="Sign out"
                onClick={() => {
                  logout();
                  navigate("/login");
                }}
              >
                <LogOut size={19} />
              </button>
            </>
          ) : (
            <Link className="button small" to="/login">
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
