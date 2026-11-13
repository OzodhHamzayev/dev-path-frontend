// @vitest-environment jsdom
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { createCourse, getCoursesFromApi, updateCourseInApi, uploadCourseImage, validateCourseImage } from "./courses";
import { courses } from "../data";

beforeEach(() => {
  sessionStorage.clear();
  vi.stubEnv("VITE_API_BASE_URL", "http://localhost:8080");
  vi.stubEnv("VITE_COURSE_IMAGE_UPLOAD_PATH", "/api/admin/uploads");
  vi.stubEnv("VITE_API_AUTH_MODE", "bearer");
});
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
const image = () => new File(["image-bytes"], "cover.png", { type: "image/png" });
const candidate = { ...courses[0], status: "draft" as const, imageUrl: "http://localhost:8080/uploads/cover.png" };

test("uploads a multipart image with auth and resolves the backend URL", async () => {
  sessionStorage.setItem("token", "test-token");
  const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ image_url: "/uploads/cover.png" }), { status: 201 }));
  vi.stubGlobal("fetch", fetchMock);
  const file = image();
  expect(await uploadCourseImage(file)).toBe(candidate.imageUrl);
  const [url, options] = fetchMock.mock.calls[0];
  expect(url).toBe("http://localhost:8080/api/admin/uploads");
  expect(options.body.get("image")).toBe(file);
  expect(options.headers.get("Authorization")).toBe("Bearer test-token");
  expect(options.headers.has("Content-Type")).toBe(false);
});

test("cookie mode supports a configurable upload path without bearer auth", async () => {
  vi.stubEnv("VITE_API_AUTH_MODE", "cookie");
  vi.stubEnv("VITE_COURSE_IMAGE_UPLOAD_PATH", "/uploads/images");
  sessionStorage.setItem("token", "test-token");
  const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ image_url: "https://cdn.example.com/cover.webp" })));
  vi.stubGlobal("fetch", fetchMock);
  expect(await uploadCourseImage(image())).toBe("https://cdn.example.com/cover.webp");
  const [url, options] = fetchMock.mock.calls[0];
  expect(url).toBe("http://localhost:8080/uploads/images");
  expect(options.credentials).toBe("include");
  expect(options.headers.has("Authorization")).toBe(false);
});

test("rejects unsupported, empty and oversized files before upload", async () => {
  const fetchMock = vi.fn(); vi.stubGlobal("fetch", fetchMock);
  for (const file of [new File(["text"], "bad.svg", { type: "image/svg+xml" }), new File([], "empty.png", { type: "image/png" }), new File([new Uint8Array(5 * 1024 * 1024 + 1)], "large.png", { type: "image/png" })]) {
    expect(validateCourseImage(file)).not.toBe("");
    await expect(uploadCourseImage(file)).rejects.toThrow();
  }
  expect(fetchMock).not.toHaveBeenCalled();
});

test("reports upload rejection and refuses unusable success URLs", async () => {
  const fetchMock = vi.fn()
    .mockResolvedValueOnce(new Response(JSON.stringify({ error: "Image too large" }), { status: 413 }))
    .mockResolvedValueOnce(new Response(JSON.stringify({ image_url: "javascript:alert(1)" })))
    .mockResolvedValueOnce(new Response("{}"));
  vi.stubGlobal("fetch", fetchMock);
  await expect(uploadCourseImage(image())).rejects.toThrow("Image too large (HTTP 413)");
  await expect(uploadCourseImage(image())).rejects.toThrow("image_url");
  await expect(uploadCourseImage(image())).rejects.toThrow("image_url");
});

test("persists image_url on create and replacement, and restores it from GET", async () => {
  const fetchMock = vi.fn()
    .mockResolvedValueOnce(new Response('{"id":17}', { status: 201 }))
    .mockResolvedValueOnce(new Response(null, { status: 204 }))
    .mockResolvedValueOnce(new Response(JSON.stringify({ courses: [{ id: 17, title: "Course", image_url: "/uploads/cover.png" }] })));
  vi.stubGlobal("fetch", fetchMock);
  expect((await createCourse(candidate)).imageUrl).toBe(candidate.imageUrl);
  await updateCourseInApi("17", candidate);
  for (const [, options] of fetchMock.mock.calls.slice(0, 2)) expect(JSON.parse(options.body).image_url).toBe(candidate.imageUrl);
  expect((await getCoursesFromApi())[0].imageUrl).toBe(candidate.imageUrl);
});
