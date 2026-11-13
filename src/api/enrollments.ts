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

function expireSession() {
  sessionStorage.removeItem(import.meta.env.VITE_AUTH_TOKEN_KEY || "token");
  sessionStorage.removeItem("devpath-auth-user");
  sessionStorage.removeItem("devpath-auth-role");
  window.dispatchEvent(new Event("devpath-auth-expired"));
}

function record(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined;
}

function positiveId(value: unknown): string | undefined {
  if (typeof value === "number" && Number.isSafeInteger(value) && value > 0)
    return String(value);
  if (typeof value === "string" && /^\d+$/.test(value) && Number(value) > 0)
    return value;
  return undefined;
}

function courseIdsFromResponse(body: unknown): string[] {
  const ids = new Set<string>();

  function visit(value: unknown, depth = 0) {
    if (depth > 6 || value == null) return;
    if (Array.isArray(value)) {
      value.forEach((item) => visit(item, depth + 1));
      return;
    }

    const data = record(value);
    if (!data) return;

    for (const [key, field] of Object.entries(data)) {
      const normalizedKey = key.toLowerCase().replace(/[^a-z]/g, "");
      if (["courseid", "course"].includes(normalizedKey)) {
        const directId = positiveId(field);
        if (directId) ids.add(directId);
        const nestedCourse = record(field);
        if (nestedCourse) {
          const nestedId = positiveId(nestedCourse.id ?? nestedCourse.ID);
          if (nestedId) ids.add(nestedId);
        }
      }
    }

    // Also accept an API response that directly returns course objects.
    if (data.title !== undefined || data.Title !== undefined) {
      const directId = positiveId(data.id ?? data.ID);
      if (directId) ids.add(directId);
    }

    Object.values(data).forEach((nested) => visit(nested, depth + 1));
  }

  visit(body);
  return [...ids];
}

/** Fetch the signed-in user's enrollments. The user ID always comes from the JWT. */
export async function getMyEnrollmentCourseIds(): Promise<string[]> {
  const token = readToken();
  if (!token) throw new Error("Log in to view your courses.");

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/me/enrollments`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    throw new Error("Could not connect to the backend to load your enrollments.");
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    body = undefined;
  }

  if (response.status === 401) expireSession();
  if (!response.ok) {
    const data = record(body);
    const detail = typeof data?.error === "string"
      ? data.error
      : typeof data?.message === "string"
        ? data.message
        : `Could not load your enrollments (HTTP ${response.status}).`;
    throw new Error(detail);
  }

  return courseIdsFromResponse(body);
}
