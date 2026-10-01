import {
  Routes,
  Route,
  Navigate,
  Outlet,
  useLocation,
  Link,
} from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Loading from "../components/Loading";
import Home from "../pages/customer/Home";
import Login from "../pages/customer/Login";
import Foods from "../pages/customer/Foods";
import FoodDetails from "../pages/customer/FoodDetails";
import Cart from "../pages/customer/Cart";
import Checkout from "../pages/customer/Checkout";
import MyOrders from "../pages/customer/MyOrders";
import OrderConfirmation from "../pages/customer/OrderConfirmation";
import AdminLayout from "../pages/admin/AdminLayout";
import Dashboard from "../pages/admin/Dashboard";
import Categories from "../pages/admin/categories/Categories";
import AddCategory from "../pages/admin/categories/AddCategory";
import EditCategory from "../pages/admin/categories/EditCategory";
import FoodManagement from "../pages/admin/foods/FoodManagement";
import AddFood from "../pages/admin/foods/AddFood";
import EditFood from "../pages/admin/foods/EditFood";
import OrderManagement from "../pages/admin/orders/OrderManagement";
import OrderDetails from "../pages/admin/orders/OrderDetails";
import CustomerManagement from "../pages/admin/customers/CustomerManagement";
function Protected({ role }) {
  const { user, loading } = useAuth(),
    location = useLocation();
  if (loading) return <Loading />;
  if (!user)
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname + location.search }}
      />
    );
  if (user.role !== role)
    return <Navigate to={user.role === "admin" ? "/admin" : "/"} replace />;
  return <Outlet />;
}
function StoreLayout() {
  return (
    <>
      <Navbar />
      <Outlet />
      <Footer />
    </>
  );
}
export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login key="login" />} />
      <Route path="/register" element={<Login key="register" register />} />
      <Route element={<StoreLayout />}>
        <Route index element={<Home />} />
        <Route path="foods" element={<Foods />} />
        <Route path="foods/:id" element={<FoodDetails />} />
        <Route path="cart" element={<Cart />} />
        <Route element={<Protected role="customer" />}>
          <Route path="checkout" element={<Checkout />} />
          <Route path="my-orders" element={<MyOrders />} />
          <Route path="my-orders/:id" element={<OrderDetails />} />
          <Route
            path="order-confirmation/:id"
            element={<OrderConfirmation />}
          />
        </Route>
      </Route>
      <Route element={<Protected role="admin" />}>
        <Route path="admin" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="statistics" element={<Dashboard statistics />} />
          <Route path="categories" element={<Categories />} />
          <Route path="categories/add" element={<AddCategory />} />
          <Route path="categories/:id/edit" element={<EditCategory />} />
          <Route path="foods" element={<FoodManagement />} />
          <Route path="foods/add" element={<AddFood />} />
          <Route path="foods/:id/edit" element={<EditFood />} />
          <Route path="orders" element={<OrderManagement />} />
          <Route path="orders/:id" element={<OrderDetails />} />
          <Route
            path="customers"
            element={<CustomerManagement key="customers" />}
          />
          <Route
            path="users"
            element={<CustomerManagement key="users" users />}
          />
        </Route>
      </Route>
      <Route
        path="*"
        element={
          <main className="container empty">
            <h1>Page not found</h1>
            <Link className="button" to="/">
              Back to Home
            </Link>
          </main>
        }
      />
    </Routes>
  );
}
