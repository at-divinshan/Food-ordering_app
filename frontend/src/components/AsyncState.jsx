import { useCallback, useEffect, useState } from "react";
export function useLoad(load, deps = []) {
  const [data, setData] = useState(null),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    Promise.resolve()
      .then(load)
      .then((d) => {
        if (active) setData(d);
      })
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [...deps, revision]);
  const reload = useCallback(() => setRevision((n) => n + 1), []);
  return { data, error, loading, reload };
}
export function ErrorMessage({ message }) {
  return message ? (
    <div className="error" role="alert">
      {message}
    </div>
  ) : null;
}
export function Empty({ title = "Nothing here yet", children }) {
  return (
    <div className="empty">
      <span>🍽️</span>
      <h3>{title}</h3>
      {children}
    </div>
  );
}
export function Status({ value }) {
  return (
    <span className={`status ${value.toLowerCase().replaceAll(" ", "-")}`}>
      {value}
    </span>
  );
}
