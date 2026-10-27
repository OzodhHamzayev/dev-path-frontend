// @vitest-environment jsdom
import React from "react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { App } from "./main";

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  vi.spyOn(window, "scrollTo").mockImplementation(() => {});
  vi.stubGlobal(
    "fetch",
    vi.fn().mockImplementation(async (input: string | URL | Request, init) => {
      const url = String(input);
      if (url.endsWith("/api/auth/login"))
        return new Response(
          JSON.stringify({
            token: "persistent-test-token",
            user: { name: "Alex Morgan", role: "student" },
          }),
          { status: 200 },
        );
      if (init?.method === "GET")
        return new Response(JSON.stringify({ courses: [] }), { status: 200 });
      return new Response(null, { status: 404 });
    }),
  );
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function open(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

test("login persists the token and restores the user after remount", async () => {
  const user = userEvent.setup();
  const view = open("/signin");
  await user.type(screen.getByLabelText("Email address"), "alex@example.com");
  await user.type(screen.getByLabelText("Password"), "password123");
  await user.click(screen.getByRole("button", { name: "Log in" }));

  expect(
    await screen.findByRole("heading", { name: "Welcome back, Alex." }),
  ).toBeTruthy();
  expect(localStorage.getItem("token")).toBe("persistent-test-token");
  expect(localStorage.getItem("devpath-auth-user")).toBe("Alex Morgan");
  expect(JSON.stringify(localStorage)).not.toContain("password123");

  view.unmount();
  open("/dashboard");
  expect(
    screen.getByRole("heading", { name: "Welcome back, Alex." }),
  ).toBeTruthy();
});

function storeSession(role: "user" | "admin") {
  localStorage.setItem("token", "test-token");
  localStorage.setItem("devpath-auth-user", "Alex Morgan");
  localStorage.setItem("devpath-auth-role", role);
  localStorage.setItem(
    "devpath",
    JSON.stringify({
      saved: [],
      enrolled: [],
      progress: {},
      user: "Alex Morgan",
      role,
      theme: "midnight",
    }),
  );
}

test("blocks a signed-in non-admin from the admin workspace", () => {
  storeSession("user");
  open("/admin");
  expect(
    screen.getByRole("heading", { name: "Admin access required." }),
  ).toBeTruthy();
});

test("allows a signed-in admin into the admin workspace", async () => {
  storeSession("admin");
  open("/admin");
  expect(
    await screen.findByRole("heading", { name: "Your course library." }),
  ).toBeTruthy();
});
