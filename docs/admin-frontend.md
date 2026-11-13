# Admin frontend integration

## Files

| File                               | Responsibility                                                                         |
| ---------------------------------- | -------------------------------------------------------------------------------------- |
| `src/admin/AdminCourses.tsx`       | Course list, statistics, filtering, pagination, publish/unpublish, delete confirmation |
| `src/admin/CourseEditor.tsx`       | Create/edit form, validation, cover choices, live preview                              |
| `src/api/courses.ts`               | POST request, token/cookie transport, API errors, returned course ID                   |
| `src/admin/AdminLayout.tsx`        | Admin sidebar, mobile navigation, breadcrumbs                                          |
| `src/admin/DeleteCourseDialog.tsx` | Native modal confirmation, Escape handling, focus restoration                          |
| `src/admin/admin.css`              | Responsive admin styling                                                               |
| `src/courses/CourseStore.tsx`      | Shared course state and browser persistence                                            |
| `src/components/CourseVisual.tsx`  | Reusable admin cover artwork                                                           |
| `src/main.tsx`                     | Admin routes and published-course consumption in existing student pages                |

The admin UI is available at `/admin`. Course creation is connected to `POST /api/admin/courses`; update/delete/list remain browser-only. No Go backend files or existing authentication handlers are changed. Backend middleware must authenticate and authorize course creation.

## Shared data

`CourseProvider` owns the course library. `useCourseStore()` exposes all courses to the admin; `usePublishedCourses()` exposes published courses to student pages. Both use the same state, so changes are reflected immediately. Courses retain their IDs during editing, preserving existing links and student progress. Deletion also removes local learning references through `onDeleteCourse` in `AppContent`.

`ManagedCourse` extends the existing `Course` type with `status: "draft" | "published"`. Existing ratings and student counts are preserved during editing. New courses start at zero; admins cannot invent reviews through the form. Curriculum remains the existing sample content and is outside this course-metadata editor.

## Course creation API

`CourseEditor.save` calls `createCourse` only when creating a new course, after client-side validation. It waits for success before updating shared course state and navigating to the edit page. While pending, a ref guards duplicate submit events and the form is disabled. A failed request leaves input intact and does not add a local course.

Defaults:

```env
VITE_API_BASE_URL=http://localhost:8080
VITE_COURSE_CREATE_PATH=/api/admin/courses
VITE_API_AUTH_MODE=bearer
VITE_AUTH_TOKEN_KEY=token
```

These options go in a frontend `.env.local` if changes are needed. Restart Vite after changes. They are public configuration, not secrets.

Bearer mode reuses an existing raw JWT from sessionStorage, then localStorage, under the configured key. If no token exists, no Authorization header is invented; a protected backend will return 401, which is shown in the form. Existing demo authentication does not create JWTs. Your local real login must provide the token or use cookie mode. Cookie mode sends `credentials: "include"` and no Bearer header, and requires backend `Access-Control-Allow-Credentials: true` with an exact permitted frontend origin. Both modes require backend CORS to support the frontend's actual origin and OPTIONS requests; Bearer mode also needs Authorization and Content-Type in allowed headers.

The request sends the known Go DTO: title, description, category, level, price, rating, duration, instructor. Duration is mapped from the form's hours. Price/duration are validated as integers for new courses because the supplied Go model uses `int`; no conversion to cents or rounding is assumed. Presentation fields (`tech`, `color`, `status`) are browser-only metadata.

Successful responses can contain an ID as `{ "id": 12 }`, `{ "ID": 12 }`, `{ "course": { "id": 12 } }`, or `{ "data": { "ID": 12 } }`. Numeric IDs are converted to strings for React routing and retained as `backendId`. The other submitted values are used for the browser copy. If the backend returns only a success message or an empty 2xx response, creation still succeeds, but the browser uses a local reference; return the server ID before connecting update/delete APIs.

On non-2xx responses, JSON `error` or `message` text is displayed with the HTTP status. Network/CORS failures receive a connection message. Successful POSTs are not retried automatically. If the server created the course but browser caching fails, the course is kept in memory and the UI explains that the server save succeeded, preventing an accidental repeated POST.

## Remaining Go API integration

The current `saveCourse` (edit/publish) and `deleteCourse` operations persist to localStorage. Replace those boundaries only after their routes and response formats are known:

1. Load the admin's course list from the backend, with loading/error states.
2. Connect editing/publishing to the actual PUT/PATCH routes, retaining the backend ID returned at creation.
3. Await successful DELETE responses before removing courses locally.
4. Apply the server's returned course data to shared state after successful mutations.
5. Send authentication according to the backend's cookie or Bearer-token contract. Enforce admin authorization on every backend mutation and private admin read.
6. Serve the public catalog from a backend endpoint that excludes drafts. Frontend filtering alone is not access control.
7. Move enrollment/bookmark/progress cleanup into a backend transaction or appropriate relational constraints once those records are stored remotely.

The creation URL and token lookup key are configurable as documented above. Other localStorage changes do not update PostgreSQL, other users, or another browser. In particular, deleting a backend-created course in the current UI removes only its browser copy.

## Checks

```sh
npm ci
npm test
npm run build
npm run dev
```

The test suite covers HTTP payload mapping, Bearer/cookie transport, server IDs, 401/403/404/409/422/500 responses, network failures, duplicate submission, Go integer validation, caching failures after successful creation, and the original admin/learning workflows. Chromium checks cover desktop/tablet/mobile layouts, the POST through a mocked API response, and native dialog Escape/focus behavior. A live request to your local Go backend has not been validated from this cloud workspace.


## Course cover image upload

The create and edit forms accept an optional JPG, PNG, or WebP file (nonempty, at most 5 MiB). Selecting a file previews it locally; discarding the selection restores the existing cover. No file is uploaded until Save/Create. Existing covers are preserved when no replacement is selected. Covers appear in admin rows, public course cards and course details; unavailable images fall back to the existing illustration.

Implement this backend contract:

1. `POST /api/admin/uploads` (override path with `VITE_COURSE_IMAGE_UPLOAD_PATH`). Authenticate with the same Bearer token or HttpOnly cookie as course operations. Accept `multipart/form-data` with a file part named **image**; do not expect JSON here. The browser supplies the multipart boundary.
2. Validate authorization, actual image contents, MIME type and size server-side; browser checks are only convenience. Generate a safe unique filename, store the file and return a 2xx JSON response: `{"image_url":"/uploads/covers/unique.webp"}`. Absolute HTTP(S) URLs are also accepted; relative paths resolve against `VITE_API_BASE_URL` (default `http://localhost:8080`). Return non-2xx JSON `{"error":"..."}` on failure. Allow the frontend origin and Authorization header through CORS, including credentialed CORS when cookie mode is enabled.
3. Existing course POST and PUT endpoints continue accepting JSON with their existing fields plus **image_url** (string). Store it with the course. If the field is omitted, preserve the existing cover on update.
4. Include **image_url** in course list and detail GET responses (public and admin), so the cover survives reloads. Serve that URL as an image accessible to an `<img>` element; browser image requests cannot attach the application's sessionStorage Bearer token.

The frontend uploads first and submits the returned URL with the course. Upload failure prevents course submission. A successful upload is reused when retrying a failed course save in the same form. Backend upload storage should clean up orphaned files after abandoned/failed course saves; replacement cleanup should happen only after successful course persistence. No backend implementation is included in this frontend change.
