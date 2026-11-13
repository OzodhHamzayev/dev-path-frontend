const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080"
).replace(/\/+$/, "");

function readToken() {
  try {
    return sessionStorage.getItem(import.meta.env.VITE_AUTH_TOKEN_KEY || "token");
  } catch {
    return null;
  }
}

export async function createOrder(courseId: string, idempotencyKey: string) {
  const token = readToken();
  if (!token) throw new Error("Please log in before buying a course.");
  if (!/^\d+$/.test(courseId))
    throw new Error("This course is missing its database ID.");

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "Idempotency-Key": idempotencyKey,
      },
      body: JSON.stringify({ course_id: Number(courseId) }),
    });
  } catch {
    throw new Error("Could not connect to the backend to create the order.");
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    body = undefined;
  }

  if (response.status === 401) {
    sessionStorage.removeItem(import.meta.env.VITE_AUTH_TOKEN_KEY || "token");
    sessionStorage.removeItem("devpath-auth-user");
    sessionStorage.removeItem("devpath-auth-role");
    window.dispatchEvent(new Event("devpath-auth-expired"));
  }

  if (!response.ok) {
    const data = body && typeof body === "object" ? body as Record<string, unknown> : {};
    const detail = typeof data.error === "string"
      ? data.error
      : typeof data.message === "string"
        ? data.message
        : `Could not create the order (HTTP ${response.status}).`;
    throw new Error(detail);
  }

  return body;
}

export async function confirmDemoOrder(orderId: string, idempotencyKey: string) {
  const token = readToken();
  if (!token) throw new Error("Please log in before confirming this order.");
  if (!/^\d+$/.test(orderId)) throw new Error("The order ID is invalid.");

  let response: Response;
  try {
    response = await fetch(
      `${API_BASE_URL}/api/orders/${encodeURIComponent(orderId)}/demo-confirm`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Idempotency-Key": idempotencyKey,
        },
      },
    );
  } catch {
    throw new Error("Could not connect to the backend to confirm the demo order.");
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    body = undefined;
  }

  if (response.status === 401) {
    sessionStorage.removeItem(import.meta.env.VITE_AUTH_TOKEN_KEY || "token");
    sessionStorage.removeItem("devpath-auth-user");
    sessionStorage.removeItem("devpath-auth-role");
    window.dispatchEvent(new Event("devpath-auth-expired"));
  }

  if (!response.ok) {
    const data = body && typeof body === "object" ? body as Record<string, unknown> : {};
    const detail = typeof data.error === "string"
      ? data.error
      : typeof data.message === "string"
        ? data.message
        : `Could not confirm the demo order (HTTP ${response.status}).`;
    throw new Error(detail);
  }

  return body;
}
