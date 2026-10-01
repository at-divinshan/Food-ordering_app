import { NavLink, Outlet, Link, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Layers,
  UtensilsCrossed,
  ClipboardList,
  Users,
  BarChart3,
  LogOut,
  ChefHat,
  ArrowUpRight,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
export default function AdminLayout() {
  const { user, logout } = useAuth(),
    navigate = useNavigate();
  const links = [
    ["", "Dashboard", LayoutDashboard],
    ["categories", "Categories", Layers],
    ["foods", "Foods", UtensilsCrossed],
    ["orders", "Orders", ClipboardList],
    ["customers", "Customers", Users],
    ["users", "Users", Users],
    ["statistics", "Statistics", BarChart3],
  ];
  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <Link className="brand" to="/admin">
          <ChefHat />
          <span>
            Foodie<small>Admin Panel</small>
          </span>
        </Link>
        <nav>
          {links.map(([path, label, Icon]) => (
            <NavLink end to={`/admin${path ? "/" + path : ""}`} key={label}>
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="admin-profile">
          <div>
            <strong>{user.name}</strong>
            <small>{user.email}</small>
          </div>
          <button
            className="icon"
            aria-label="Sign out"
            onClick={() => {
              logout();
              navigate("/login");
            }}
          >
            <LogOut size={18} />
          </button>
        </div>
      </aside>
      <div className="admin-main">
        <header className="admin-topbar">
          <span>Foodie / Administration</span>
          <Link to="/">
            Visit Store <ArrowUpRight size={16} />
          </Link>
        </header>
        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
