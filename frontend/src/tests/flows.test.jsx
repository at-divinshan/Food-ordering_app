// @vitest-environment jsdom
import React from "react";
import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { CartProvider, useCart } from "../context/CartContext";
import AppRoutes from "../routes/AppRoutes";
import { api } from "../services/api";

vi.mock("../services/api", () => ({
  api: vi.fn(),
  query: (values) =>
    new URLSearchParams(
      Object.entries(values).filter(
        ([, v]) => v !== "" && v !== undefined && v !== null,
      ),
    ).toString(),
}));
const customer = {
  id: 7,
  name: "Test Customer",
  email: "customer@example.com",
  role: "customer",
  is_active: true,
};
const admin = {
  id: 1,
  name: "Admin",
  email: "admin@foodorder.com",
  role: "admin",
  is_active: true,
};
const food = {
  id: 9,
  name: "Test Pizza",
  price: "123.45",
  quantity: 2,
  image: null,
  is_available: true,
};
const dashboard = {
  foods: 0,
  categories: 0,
  customers: 0,
  users: 1,
  orders: 0,
  revenue: 0,
  pending_orders: 0,
  delivered_orders: 0,
  statuses: {},
  popular_foods: [],
  daily_orders: [],
};
function app(path = "/") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <CartProvider>
          <AppRoutes />
        </CartProvider>
      </AuthProvider>
    </MemoryRouter>,
  );
}
beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  vi.resetAllMocks();
  api.mockImplementation(async (path) => {
    if (path === "/auth/me") return customer;
    if (path === "/categories") return [];
    if (path.startsWith("/foods?")) return { items: [], total: 0 };
    if (path === "/dashboard") return dashboard;
    throw new Error(`Unexpected API call: ${path}`);
  });
});
afterEach(cleanup);

describe("customer and admin flows", () => {
  it("protects admin pages from a signed-in customer", async () => {
    sessionStorage.setItem("foodie_token", "customer-token");
    app("/admin");
    await screen.findByRole("heading", { name: /Delicious Food/ });
    expect(
      screen.queryByRole("heading", { name: "Dashboard Overview" }),
    ).toBeNull();
    expect(api.mock.calls.some(([path]) => path === "/dashboard")).toBe(false);
  });
  it("requires login before checkout", async () => {
    app("/checkout");
    await screen.findByRole("heading", { name: "Welcome Back!" });
  });
  it("logs in through the API and navigates an admin to their dashboard", async () => {
    api.mockImplementation(async (path) => {
      if (path === "/auth/login")
        return { access_token: "signed-jwt", user: admin };
      if (path === "/dashboard") return dashboard;
      throw new Error(path);
    });
    const user = userEvent.setup();
    app("/login");
    await user.type(screen.getByLabelText("Email"), "admin@foodorder.com");
    await user.type(screen.getByLabelText("Password"), "Admin@12345");
    await user.click(screen.getByRole("button", { name: "Login" }));
    await screen.findByRole("heading", { name: "Dashboard Overview" });
    expect(api).toHaveBeenCalledWith("/auth/login", {
      method: "POST",
      body: { email: "admin@foodorder.com", password: "Admin@12345" },
    });
    expect(sessionStorage.getItem("foodie_token")).toBe("signed-jwt");
  });
  it("transfers a guest cart to the customer and isolates it after logout", async () => {
    localStorage.setItem("foodie_cart_guest", JSON.stringify([food]));
    api.mockResolvedValue({ access_token: "signed-jwt", user: customer });
    function Probe() {
      const { authenticate, logout } = useAuth(),
        { count, total } = useCart();
      return (
        <>
          <output data-testid="cart">
            {count}:{total}
          </output>
          <button
            onClick={() =>
              authenticate("login", {
                email: customer.email,
                password: "password",
              })
            }
          >
            Sign In
          </button>
          <button onClick={logout}>Sign Out</button>
        </>
      );
    }
    const user = userEvent.setup();
    render(
      <AuthProvider>
        <CartProvider>
          <Probe />
        </CartProvider>
      </AuthProvider>,
    );
    expect(screen.getByTestId("cart").textContent).toBe("2:246.9");
    await user.click(screen.getByText("Sign In"));
    await waitFor(() =>
      expect(JSON.parse(localStorage.getItem("foodie_cart_7"))).toHaveLength(1),
    );
    expect(screen.getByTestId("cart").textContent).toBe("2:246.9");
    expect(localStorage.getItem("foodie_cart_guest")).toBeNull();
    await user.click(screen.getByText("Sign Out"));
    await waitFor(() =>
      expect(screen.getByTestId("cart").textContent).toBe("0:0"),
    );
    expect(JSON.parse(localStorage.getItem("foodie_cart_7"))[0].quantity).toBe(
      2,
    );
  });
  it("submits food IDs and quantities, then shows the server-calculated confirmation", async () => {
    sessionStorage.setItem("foodie_token", "customer-token");
    localStorage.setItem("foodie_cart_7", JSON.stringify([food]));
    const order = {
      id: 22,
      total_amount: "250.00",
      items: [{ ...food, quantity: 2 }],
      status: "Pending",
    };
    api.mockImplementation(async (path, options) => {
      if (path === "/auth/me") return customer;
      if (path === "/customers/me")
        return { ...customer, phone: "0771234567", address: "123 Main Street" };
      if (path === "/orders" && options.method === "POST") return order;
      if (path === "/orders/22") return order;
      throw new Error(path);
    });
    const user = userEvent.setup();
    app("/checkout");
    await screen.findByLabelText("Full Name");
    await user.click(screen.getByRole("button", { name: "Place Order →" }));
    await screen.findByRole("heading", { name: "Order Placed Successfully!" });
    expect(api).toHaveBeenCalledWith("/orders", {
      method: "POST",
      body: {
        customer: {
          name: "Test Customer",
          phone: "0771234567",
          address: "123 Main Street",
        },
        items: [{ food_id: 9, quantity: 2 }],
      },
    });
    expect(screen.getByText(/Rs. 250.00/)).toBeTruthy();
    expect(JSON.parse(localStorage.getItem("foodie_cart_7"))).toEqual([]);
  });
  it("keeps the cart when the backend rejects an unavailable food", async () => {
    sessionStorage.setItem("foodie_token", "customer-token");
    localStorage.setItem("foodie_cart_7", JSON.stringify([food]));
    api.mockImplementation(async (path) => {
      if (path === "/auth/me") return customer;
      if (path === "/customers/me")
        return { ...customer, phone: "0771234567", address: "123 Main Street" };
      if (path === "/orders")
        throw new Error("One or more foods are unavailable");
      throw new Error(path);
    });
    const user = userEvent.setup();
    app("/checkout");
    await screen.findByLabelText("Full Name");
    await user.click(screen.getByRole("button", { name: "Place Order →" }));
    expect((await screen.findByRole("alert")).textContent).toContain(
      "unavailable",
    );
    expect(JSON.parse(localStorage.getItem("foodie_cart_7"))).toHaveLength(1);
  });
});
