# DevPath

A responsive programming learning platform built with React 19, TypeScript, Vite, Tailwind CSS 4, and Lucide icons. This repository contains the frontend. The learning demo works without a backend; creating a course now calls your Go backend.

## Run locally

Requires Node.js 22.12+ (validated with Node 22 and 24). A `.nvmrc` file selects Node 22 for nvm users.

```sh
npm ci
npm run dev
```

## Verify and build

```sh
npm test
npm run build
npm run preview
```

`npm test` runs 25 automated checks covering catalog search and filters, enrollment/progress, demo authentication, the admin UI, course-creation HTTP requests, authentication headers, API failures, and duplicate-submit prevention.

## Explore

- `/` — homepage
- `/courses` — 12-course catalog, filters, search, and sorting
- `/courses/react` — course overview, curriculum, and demo enrollment
- `/dashboard` — enrolled courses, bookmarks, progress, and activity
- `/learn/react/0` — lesson workspace (enroll first)
- `/signin` and `/signup` — clearly labeled demo authentication
- `/admin` — course management, search, filters, publishing, and deletion
- `/admin/courses/new` — create a course with a live preview
- `/admin/courses/:id/edit` — edit an existing course

Course enrollment is simulated and never collects payment. Authentication stores only a display name; passwords and email addresses are never saved or sent. Bookmarks, enrollment, completed lesson indices, and the selected dark ambiance are stored under `devpath` in localStorage. Clear that key to reset the demo. Both ambiance options remain dark.

Course covers can use uploaded images; courses without an image use local SVG/CSS artwork. External fonts have system fallbacks, and decorative learner photos fail gracefully. Lesson videos are honestly represented as placeholders with usable written lessons. Course metadata and testimonials are illustrative mock data. Weekly activity reflects lessons completed in the current demo, attributed to today; it is not a historical analytics service.

## Hosting

Deploy the generated `dist` directory to a static host and configure all application paths to fall back to `index.html` so direct links and browser refreshes work. Vite development and preview servers include this fallback.

The admin update was checked in Chromium on desktop, tablet, and mobile widths (320–1440px). Browser checks exercised creation, editing, publishing, reload persistence, course enrollment/progress, deletion, dialog keyboard behavior, and direct links. Backend responses were mocked in automated checks; this cloud workspace does not contain your local Go server. Tests and the production build passed.

## Admin frontend

Open `/admin` or use **Admin** in the navigation. **Create course** sends a POST to `http://localhost:8080/api/admin/courses`. Start your Go backend first. The frontend only adds a course to its browser copy after a successful response. Backend errors are displayed in the form, and repeated submissions are blocked while a request is pending.

The JSON payload contains `title`, `description`, `category`, `level`, `price`, `rating`, `duration`, and `instructor`. Frontend `hours` maps to backend `duration`. New-course price and duration use whole numbers to match the Go `int` fields described for this project; values are never silently rounded. Optional cover images upload through `POST /api/admin/uploads` as multipart field `image`; the returned `image_url` is included in course create/update JSON. The backend must store and return `image_url` in list/detail responses. See [the image upload contract](docs/admin-frontend.md#course-cover-image-upload). Technology/visibility remain frontend metadata until the backend supports them.

The browser's **Published** and **Draft** selections control visibility in this browser copy. They do not enforce publication or access control on the server. Editing, publishing/unpublishing, deletion, and the course list remain browser-only until their real API routes are supplied. No update/delete routes are guessed or called.

Deletion asks for confirmation and removes the course's local saved/enrollment/progress references. Searching, status/category filters, sorting, and pagination work in the course library. Forms validate required information, price, and duration; cancelled edits are not saved. Newly created courses start with zero reviews and students, and use the existing illustrative curriculum.

The frontend does not implement server-side admin role enforcement; your Go middleware must enforce it. The browser copy is stored under `devpath-courses-v1` in localStorage, separately from student preferences. The original courses in `src/data.ts` seed a fresh browser; an intentionally empty saved library stays empty. Clearing `devpath-courses-v1` resets only the browser copy and does not remove server records.

API defaults work without an env file. To change them, use the non-secret options documented in `.env.example` and restart Vite. By default, an existing JWT under `sessionStorage.token` or `localStorage.token` is sent as a Bearer token. If your login uses a different storage key, set `VITE_AUTH_TOKEN_KEY` to match. This update does not replace your login handler or store JWTs automatically. For HttpOnly-cookie authentication, set `VITE_API_AUTH_MODE=cookie` and configure credentialed CORS on the backend.

See [admin frontend integration notes](docs/admin-frontend.md) for response formats and the remaining API boundaries. Existing sign-in/sign-up handlers were not changed by this update.

## Native dependency troubleshooting on Linux

If Tailwind reports “Cannot find native binding”, first use a supported Node version and install optional dependencies. The lockfile already includes Linux platform bindings; keep it. `npm ci` replaces the generated dependency directory automatically.

With nvm: `nvm install && nvm use`, followed by `npm ci --include=dev --include=optional`.

Without changing your global Node installation, use:

```sh
npx --yes --package=node@22 --package=npm@10 -c 'node --version && npm ci --include=dev --include=optional && npm run dev'
```

This downloads Node 22 and npm 10 into npm's tool cache, installs dependencies under that runtime, and starts Vite. Subsequent development sessions should use this command or an activated Node 22 environment.
