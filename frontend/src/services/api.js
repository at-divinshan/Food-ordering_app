const base = import.meta.env.VITE_API_URL || "/api";
export async function api(path, options = {}) {
  const token = sessionStorage.getItem("foodie_token");
  let response;
  try {
    response = await fetch(`${base}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
      ...(options.body !== undefined
        ? { body: JSON.stringify(options.body) }
        : {}),
    });
  } catch {
    throw new Error(
      "Cannot reach the server. Check your connection and try again.",
    );
  }
  if (response.status === 204) return null;
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401 && token && !path.startsWith("/auth/login"))
      window.dispatchEvent(new Event("auth-expired"));
    const detail = Array.isArray(data.detail)
      ? data.detail
          .map((e) => `${e.loc.slice(1).join(" ")}: ${e.msg}`)
          .join("; ")
      : data.detail;
    throw new Error(detail || `Request failed (${response.status})`);
  }
  return data;
}
export const query = (values) => {
  const params = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => {
    if (value !== "" && value !== null && value !== undefined)
      params.set(key, value);
  });
  return params.toString();
};
