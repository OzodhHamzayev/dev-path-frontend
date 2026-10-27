import type { ManagedCourse } from "../courses/CourseStore";

function getConfig() {
  return {
    base: (
      import.meta.env.VITE_API_BASE_URL || "http://localhost:8080"
    ).replace(/\/+$/, ""),
    path: import.meta.env.VITE_COURSE_CREATE_PATH || "/api/admin/courses",
    tokenKey: import.meta.env.VITE_AUTH_TOKEN_KEY || "token",
    cookieAuth: import.meta.env.VITE_API_AUTH_MODE === "cookie",
  };
}

export function courseCreationUrl() {
  const { base, path } = getConfig();
  return `${base}/${path.replace(/^\/+/, "")}`;
}

export function courseDeletionUrl(id: string) {
  return `${courseCreationUrl()}/${encodeURIComponent(id)}`;
}

export function courseUpdateUrl(id: string) {
  return `${courseCreationUrl()}/${encodeURIComponent(id)}`;
}

type JsonObject = Record<string, unknown>;
function object(value: unknown): JsonObject | undefined {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonObject)
    : undefined;
}

function readToken(key: string) {
  // Use an existing login token; this client never manufactures authentication.
  try {
    const value = localStorage.getItem(key) || sessionStorage.getItem(key);
    return value?.trim() || null;
  } catch {
    return null;
  }
}

function expireStoredToken(
  response: Response,
  config: ReturnType<typeof getConfig>,
) {
  if (response.status !== 401 || !readToken(config.tokenKey)) return;
  try {
    localStorage.removeItem(config.tokenKey);
    localStorage.removeItem("devpath-auth-user");
    localStorage.removeItem("devpath-auth-role");
    sessionStorage.removeItem(config.tokenKey);
  } finally {
    window.dispatchEvent(new Event("devpath-auth-expired"));
  }
}

function getServerId(body: unknown): string | undefined {
  function findId(value: unknown, depth: number): string | undefined {
    if (depth > 4) return undefined;
    if (Array.isArray(value)) {
      for (const item of value) {
        const found = findId(item, depth + 1);
        if (found) return found;
      }
      return undefined;
    }
    const data = object(value);
    if (!data) return undefined;
    const id = data.id ?? data.ID;
    if (typeof id === "number" && Number.isSafeInteger(id) && id > 0)
      return String(id);
    if (typeof id === "string" && /^\d+$/.test(id) && Number(id) > 0)
      return id;
    for (const nested of Object.values(data)) {
      const found = findId(nested, depth + 1);
      if (found) return found;
    }
    return undefined;
  }
  return findId(body, 0);
}

function errorMessage(
  status: number,
  body: unknown,
  action: "create" | "update",
) {
  const data = object(body);
  const detail =
    typeof data?.error === "string"
      ? data.error
      : typeof data?.message === "string"
        ? data.message
        : "";
  const defaults: Record<number, string> = {
    400: "The backend rejected the course details.",
    401: "Please sign in again. A valid login token is required.",
    403: `Your account does not have permission to ${action} courses.`,
    404:
      action === "create"
        ? "The course creation route was not found. Check the POST API path."
        : "The course update route or course ID was not found. Check the PUT API path and ID.",
    409: "A course with these details already exists.",
    422: "Please check the course details and try again.",
  };
  return `${detail || defaults[status] || `The backend could not ${action} this course.`} (HTTP ${status})`;
}

function coursePayload(candidate: ManagedCourse) {
  return {
    title: candidate.title,
    description: candidate.description,
    category: candidate.category,
    level: candidate.level,
    price: candidate.price,
    rating: candidate.rating,
    duration: candidate.hours,
    instructor: candidate.instructor,
  };
}

function authHeaders(config: ReturnType<typeof getConfig>, json = false) {
  const headers = new Headers(
    json ? { "Content-Type": "application/json" } : undefined,
  );
  if (!config.cookieAuth) {
    const token = readToken(config.tokenKey);
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }
  return headers;
}

function textField(data: JsonObject, lower: string, upper: string) {
  const value = data[lower] ?? data[upper];
  return typeof value === "string" ? value : "";
}

function numberField(data: JsonObject, lower: string, upper: string) {
  const value = data[lower] ?? data[upper];
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function mapApiCourse(value: unknown, index: number): ManagedCourse {
  const data = object(value);
  if (!data) throw new Error("The backend returned an invalid course item.");
  const rawId = data.id ?? data.ID;
  const id =
    typeof rawId === "number" || typeof rawId === "string"
      ? String(rawId)
      : "";
  if (!/^\d+$/.test(id) || Number(id) < 1)
    throw new Error("A backend course is missing a numeric database ID.");

  const instructor = textField(data, "instructor", "Instructor");
  const statusValue = textField(data, "status", "Status");
  const colors = ["blue", "sage", "purple", "gold", "coral"];
  return {
    id,
    backendId: id,
    title: textField(data, "title", "Title"),
    description: textField(data, "description", "Description"),
    category: textField(data, "category", "Category") || "Programming",
    level: textField(data, "level", "Level") || "Beginner",
    price: numberField(data, "price", "Price"),
    rating: numberField(data, "rating", "Rating"),
    hours: numberField(data, "duration", "Duration"),
    instructor,
    initials:
      instructor
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .map((part) => part[0])
        .slice(0, 2)
        .join("")
        .toUpperCase() || "DP",
    color: colors[index % colors.length],
    tech:
      textField(data, "tech", "Tech") ||
      textField(data, "category", "Category") ||
      "Course",
    status: statusValue === "draft" ? "draft" : "published",
    students: numberField(data, "students", "Students"),
  };
}

export async function getCoursesFromApi(): Promise<ManagedCourse[]> {
  const config = getConfig();
  let response: Response;
  try {
    response = await fetch(courseCreationUrl(), {
      method: "GET",
      headers: authHeaders(config),
      credentials: config.cookieAuth ? "include" : "same-origin",
    });
  } catch {
    throw new Error(
      "Could not load courses from the backend. Check that it is running and allows this frontend origin through CORS.",
    );
  }
  expireStoredToken(response, config);

  let body: unknown;
  let validJson = true;
  try {
    body = await response.json();
  } catch {
    body = undefined;
    validJson = false;
  }
  if (!response.ok) {
    const data = object(body);
    const detail =
      typeof data?.error === "string"
        ? data.error
        : typeof data?.message === "string"
          ? data.message
          : "The backend could not load courses.";
    throw new Error(`${detail} (HTTP ${response.status})`);
  }

  if (!validJson)
    throw new Error(
      "The backend returned invalid JSON. Send one JSON response from GetAllCourses.",
    );

  function findCourseRows(value: unknown, depth = 0): unknown[] | undefined {
    if (depth > 4) return undefined;
    if (Array.isArray(value)) return value;
    const data = object(value);
    if (!data) return undefined;
    const preferred = data.courses ?? data.Courses ?? data.course ?? data.data;
    if (Array.isArray(preferred)) return preferred;
    const fromPreferred = findCourseRows(preferred, depth + 1);
    if (fromPreferred) return fromPreferred;
    for (const nested of Object.values(data)) {
      const found = findCourseRows(nested, depth + 1);
      if (found) return found;
    }
    return undefined;
  }

  const rows = findCourseRows(body);
  if (!rows)
    throw new Error('The backend response must contain a "courses" array.');
  return rows.map(mapApiCourse);
}

/** Create a course and retain the database ID returned by the backend. */
export async function createCourse(
  candidate: ManagedCourse,
): Promise<ManagedCourse> {
  const config = getConfig();
  const headers = authHeaders(config, true);

  let response: Response;
  try {
    response = await fetch(courseCreationUrl(), {
      method: "POST",
      headers,
      credentials: config.cookieAuth ? "include" : "same-origin",
      body: JSON.stringify(coursePayload(candidate)),
    });
  } catch {
    throw new Error(
      "Could not connect to the backend. Check that it is running on the configured port and allows this frontend origin through CORS.",
    );
  }
  expireStoredToken(response, config);

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    body = undefined;
  }
  if (!response.ok)
    throw new Error(errorMessage(response.status, body, "create"));

  const backendId = getServerId(body);
  if (!backendId)
    throw new Error(
      'The backend created the course but did not return its numeric database ID. Return JSON such as {"id": 14}.',
    );
  return { ...candidate, id: backendId, backendId };
}

export async function updateCourseInApi(
  id: string,
  candidate: ManagedCourse,
): Promise<void> {
  const config = getConfig();
  let response: Response;
  try {
    response = await fetch(courseUpdateUrl(id), {
      method: "PUT",
      headers: authHeaders(config, true),
      credentials: config.cookieAuth ? "include" : "same-origin",
      body: JSON.stringify(coursePayload(candidate)),
    });
  } catch {
    throw new Error(
      "Could not connect to the backend. Check that it is running and allows this frontend origin through CORS.",
    );
  }
  expireStoredToken(response, config);

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    body = undefined;
  }
  if (!response.ok)
    throw new Error(errorMessage(response.status, body, "update"));
}

export async function deleteCourseFromApi(id: string): Promise<void> {
  const config = getConfig();
  const headers = authHeaders(config);

  let response: Response;
  try {
    response = await fetch(courseDeletionUrl(id), {
      method: "DELETE",
      headers,
      credentials: config.cookieAuth ? "include" : "same-origin",
    });
  } catch {
    throw new Error(
      "Could not connect to the backend. Check that it is running and allows this frontend origin through CORS.",
    );
  }
  expireStoredToken(response, config);

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    body = undefined;
  }
  if (!response.ok) {
    const data = object(body);
    const detail =
      typeof data?.error === "string"
        ? data.error
        : typeof data?.message === "string"
          ? data.message
          : response.status === 401
            ? "Please sign in again."
            : response.status === 403
              ? "Your account cannot delete courses."
              : response.status === 404
                ? "The course was not found on the backend."
                : "The backend could not delete this course.";
    throw new Error(`${detail} (HTTP ${response.status})`);
  }
}
