import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Eye, EyeOff, ArrowRight } from "lucide-react";
import { Brand } from "../../components/Navbar";
import { useAuth } from "../../context/AuthContext";
import { ErrorMessage } from "../../components/AsyncState";
export default function Login({ register = false }) {
  const { authenticate } = useAuth(),
    navigate = useNavigate(),
    location = useLocation();
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [show, setShow] = useState(false);
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const form = Object.fromEntries(new FormData(e.currentTarget));
    try {
      const user = await authenticate(register ? "register" : "login", form);
      const target = location.state?.from;
      const safe =
        typeof target === "string" &&
        target.startsWith("/") &&
        !target.startsWith("//") &&
        !target.startsWith("/admin");
      navigate(user.role === "admin" ? "/admin" : safe ? target : "/foods", {
        replace: true,
      });
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="auth-page">
      <div className="auth-card">
        <section className="auth-form">
          <Brand />
          <h1>{register ? "Join the Foodie family" : "Welcome Back!"}</h1>
          <p className="muted">
            {register
              ? "Good food is just a few clicks away."
              : "Sign in to continue your delicious journey"}
          </p>
          <ErrorMessage message={error} />
          <form onSubmit={submit}>
            {register && (
              <label>
                Full name
                <input
                  name="name"
                  required
                  minLength={2}
                  maxLength={100}
                  placeholder="Enter your name"
                  autoComplete="name"
                />
              </label>
            )}
            <label>
              Email
              <input
                name="email"
                type="email"
                required
                maxLength={150}
                placeholder="Enter your email"
                autoComplete="email"
              />
            </label>
            <label>
              Password
              <div className="password-input">
                <input
                  name="password"
                  type={show ? "text" : "password"}
                  required
                  minLength={register ? 8 : 1}
                  maxLength={128}
                  placeholder={
                    register ? "At least 8 characters" : "Enter your password"
                  }
                  autoComplete={register ? "new-password" : "current-password"}
                />
                <button
                  type="button"
                  className="icon"
                  aria-label={show ? "Hide password" : "Show password"}
                  onClick={() => setShow(!show)}
                >
                  {show ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>
            <button disabled={busy} className="full">
              {busy ? "Please wait…" : register ? "Create Account" : "Login"}
              <ArrowRight size={17} />
            </button>
          </form>
          <p className="auth-switch">
            {register ? "Already have an account?" : "Don't have an account?"}{" "}
            <Link to={register ? "/login" : "/register"}>
              {register ? "Sign in" : "Sign up"}
            </Link>
          </p>
          <Link className="muted" to="/">
            ← Back to Foodie
          </Link>
        </section>
        <aside className="auth-art">
          <div>
            <span>FRESHLY MADE, JUST FOR YOU</span>
            <h2>
              Good Food.
              <br />
              Good Mood.
            </h2>
            <p>A little happiness in every bite.</p>
          </div>
          <img
            src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1000&q=85"
            alt="Fresh burger with vegetables"
          />
        </aside>
      </div>
    </main>
  );
}
