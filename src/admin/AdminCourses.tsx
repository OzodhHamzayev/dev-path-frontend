import { useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CheckCircle2,
  CircleDollarSign,
  FilePenLine,
  FolderOpen,
  Plus,
  Search,
  SlidersHorizontal,
  Trash2,
  X,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { deleteCourseFromApi } from "../api/courses";
import { useCourseStore, type ManagedCourse } from "../courses/CourseStore";
import { CourseVisual } from "../components/CourseVisual";
import { AdminLayout } from "./AdminLayout";
import { DeleteCourseDialog } from "./DeleteCourseDialog";

const PAGE_SIZE = 6;
export function AdminCourses({
  onDeleteCourse,
}: {
  onDeleteCourse: (id: string) => void;
}) {
  const {
    courses,
    saveCourse,
    deleteCourse,
    storageError,
    loadError,
    isLoading,
    refreshCourses,
  } = useCourseStore();
  const location = useLocation();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("default");
  const [page, setPage] = useState(1);
  const [deleting, setDeleting] = useState<ManagedCourse | null>(null);
  const [notice, setNotice] = useState(() => {
    const createdTitle = location.state?.createdTitle;
    if (typeof createdTitle === "string")
      return `“${createdTitle}” was created successfully.`;
    const updatedTitle = location.state?.updatedTitle;
    if (typeof updatedTitle === "string")
      return `“${updatedTitle}” was updated successfully.`;
    const localUpdatedTitle = location.state?.localUpdatedTitle;
    return typeof localUpdatedTitle === "string"
      ? `“${localUpdatedTitle}” was updated in this browser demo.`
      : "";
  });
  const [deleteError, setDeleteError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const filtered = useMemo(() => {
    const result = courses.filter(
      (c) =>
        `${c.title} ${c.instructor} ${c.tech}`
          .toLowerCase()
          .includes(query.trim().toLowerCase()) &&
        (status === "all" || c.status === status) &&
        (category === "all" || c.category === category),
    );
    if (sort === "title") result.sort((a, b) => a.title.localeCompare(b.title));
    if (sort === "price") result.sort((a, b) => a.price - b.price);
    return result;
  }, [courses, query, status, category, sort]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const rows = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );
  const published = courses.filter((c) => c.status === "published").length;
  const hasFilters = !!query || status !== "all" || category !== "all";
  function reset() {
    setQuery("");
    setStatus("all");
    setCategory("all");
    setSort("default");
    setPage(1);
  }
  async function confirmDelete() {
    if (!deleting) return;
    setIsDeleting(true);
    setDeleteError("");
    try {
      const databaseId =
        deleting.backendId ?? (/^\d+$/.test(deleting.id) ? deleting.id : null);
      // The starter courses from data.ts use IDs such as "react" and do not
      // exist in PostgreSQL. Only courses with a numeric database ID should
      // call the backend delete route.
      if (databaseId) await deleteCourseFromApi(databaseId);
      if (!deleteCourse(deleting.id)) {
        setDeleteError(
          databaseId
            ? "The backend deleted the course, but the browser copy could not be updated. Reload the page to refresh it."
            : "The demo course could not be removed from browser storage. Check browser storage and try again.",
        );
        return;
      }
      onDeleteCourse(deleting.id);
      setNotice(`“${deleting.title}” was deleted.`);
      setDeleting(null);
    } catch (error) {
      setDeleteError(
        error instanceof Error
          ? error.message
          : "The course could not be deleted.",
      );
    } finally {
      setIsDeleting(false);
    }
  }
  return (
    <AdminLayout>
      <div className="admin-page-heading">
        <div>
          <div className="eyebrow">A SPACE FOR WHAT’S NEXT</div>
          <h1>Your course library.</h1>
          <p>Create meaningful lessons. Help curious minds find their path.</p>
        </div>
        <Link className="button primary" to="/admin/courses/new">
          <Plus size={17} />
          Create course
        </Link>
      </div>
      <div className="admin-stats">
        {[
          {
            label: "Total courses",
            value: courses.length,
            note: "Your growing library",
            icon: BookOpen,
            tone: "lavender",
          },
          {
            label: "Published",
            value: published,
            note: "Ready for discovery",
            icon: CheckCircle2,
            tone: "teal",
          },
          {
            label: "Drafts",
            value: courses.length - published,
            note: "A little work in progress",
            icon: FilePenLine,
            tone: "lavender",
          },
          {
            label: "Free courses",
            value: courses.filter((c) => c.price === 0).length,
            note: "An open door to learning",
            icon: CircleDollarSign,
            tone: "teal",
          },
        ].map((s) => (
          <div className="admin-stat" key={s.label}>
            <div>
              <span>{s.label}</span>
              <strong>{s.value}</strong>
              <small>{s.note}</small>
            </div>
            <span className={`preview-icon ${s.tone}`}>
              <s.icon size={20} />
            </span>
          </div>
        ))}
      </div>
      {notice && (
        <div role="status" className="admin-notice">
          <CheckCircle2 size={17} />
          {notice}
          <button
            className="icon-button"
            aria-label="Dismiss notification"
            onClick={() => setNotice("")}
          >
            <X size={16} />
          </button>
        </div>
      )}
      {storageError && !deleting && (
        <p role="alert" className="admin-error">
          {storageError}
        </p>
      )}
      {loadError && !deleting && (
        <div role="alert" className="admin-error">
          {loadError}{" "}
          <button type="button" onClick={() => void refreshCourses()}>
            Try again
          </button>
        </div>
      )}
      <section className="admin-library" aria-labelledby="library-title">
        <div className="admin-library-heading">
          <div>
            <h2 id="library-title">
              All courses <span>{courses.length}</span>
            </h2>
            <p>A little organization. A lot of possibility.</p>
          </div>
          <span className="admin-library-caption">
            <FolderOpen size={15} />
            Your content, thoughtfully arranged
          </span>
        </div>
        <div className="admin-toolbar">
          <div className="admin-search">
            <Search size={17} />
            <input
              aria-label="Search admin courses"
              placeholder="Search courses or instructors…"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
            />
            {query && (
              <button
                className="icon-button"
                aria-label="Clear course search"
                onClick={() => {
                  setQuery("");
                  setPage(1);
                }}
              >
                <X size={15} />
              </button>
            )}
          </div>
          <div className="admin-toolbar-filters">
            <SlidersHorizontal size={16} />
            <select
              aria-label="Filter by course status"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
            >
              <option value="all">All statuses</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
            <select
              aria-label="Filter admin courses by category"
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(1);
              }}
            >
              <option value="all">All categories</option>
              {[...new Set(courses.map((c) => c.category))].sort().map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            <select
              aria-label="Sort admin courses"
              value={sort}
              onChange={(e) => {
                setSort(e.target.value);
                setPage(1);
              }}
            >
              <option value="default">Library order</option>
              <option value="title">Title A–Z</option>
              <option value="price">Price: low to high</option>
            </select>
          </div>
        </div>
        {hasFilters && (
          <div className="admin-filter-summary">
            <span>
              {filtered.length} matching{" "}
              {filtered.length === 1 ? "course" : "courses"}
            </span>
            <button onClick={reset}>
              Reset filters <X size={12} />
            </button>
          </div>
        )}
        {isLoading ? (
          <div className="admin-empty" aria-live="polite">
            <span>
              <BookOpen size={28} />
            </span>
            <h3>Loading courses…</h3>
            <p>Getting the latest course list from the backend.</p>
          </div>
        ) : rows.length ? (
          <>
            <div className="admin-table-scroll">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th scope="col">
                      Course <ArrowDown size={12} />
                    </th>
                    <th scope="col">Instructor</th>
                    <th scope="col">Status</th>
                    <th scope="col">Price</th>
                    <th scope="col">
                      <span className="sr-only">Course actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <div className="admin-course-cell">
                          <CourseVisual
                            imageUrl={c.imageUrl}
                            title={c.title}
                            tech={c.tech}
                            color={c.color}
                            compact
                          />
                          <div>
                            <Link
                              className="admin-course-name"
                              to={`/admin/courses/${c.id}/edit`}
                            >
                              {c.title}
                            </Link>
                            <span>
                              {c.category}
                              <i />
                              {c.level}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="admin-instructor">
                          <span className={`avatar ${c.color}`}>
                            {c.initials}
                          </span>
                          {c.instructor}
                        </div>
                      </td>
                      <td>
                        <button
                          className={`admin-status ${c.status}`}
                          aria-label={`${c.status === "published" ? "Unpublish" : "Publish"} ${c.title}`}
                          title="Click to change visibility"
                          onClick={() => {
                            const next =
                              c.status === "published" ? "draft" : "published";
                            if (saveCourse({ ...c, status: next }))
                              setNotice(
                                `“${c.title}” ${next === "published" ? "published" : "moved to drafts"}.`,
                              );
                          }}
                        >
                          <i />
                          {c.status === "published" ? "Published" : "Draft"}
                        </button>
                      </td>
                      <td>
                        <span
                          className={
                            c.price === 0 ? "admin-free" : "admin-price"
                          }
                        >
                          {c.price === 0 ? "Free" : `$${c.price.toFixed(2)}`}
                        </span>
                      </td>
                      <td>
                        <div className="admin-row-actions">
                          {c.status === "published" && (
                            <Link
                              className="icon-button"
                              to={`/courses/${c.id}`}
                              aria-label={`View ${c.title}`}
                              title="View course"
                            >
                              <ArrowUpRight size={17} />
                            </Link>
                          )}
                          <Link
                            className="icon-button"
                            to={`/admin/courses/${c.id}/edit`}
                            aria-label={`Edit ${c.title}`}
                            title="Edit course"
                          >
                            <FilePenLine size={16} />
                          </Link>
                          <button
                            className="icon-button admin-delete-action"
                            aria-label={`Delete ${c.title}`}
                            title="Delete course"
                            onClick={() => {
                              setDeleteError("");
                              setDeleting(c);
                            }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="admin-pagination">
              <span>
                Showing {(currentPage - 1) * PAGE_SIZE + 1}–
                {Math.min(currentPage * PAGE_SIZE, filtered.length)} of{" "}
                {filtered.length} courses
              </span>
              <div>
                <button
                  className="icon-button"
                  aria-label="Previous page"
                  disabled={currentPage === 1}
                  onClick={() => setPage(currentPage - 1)}
                >
                  <ArrowLeft size={16} />
                </button>
                {Array.from({ length: pageCount }, (_, i) => i + 1)
                  .filter(
                    (n) =>
                      n === 1 ||
                      n === pageCount ||
                      Math.abs(n - currentPage) <= 1,
                  )
                  .map((n, index, list) => (
                    <span key={n}>
                      {index > 0 && n - list[index - 1] > 1 && (
                        <span className="admin-page-ellipsis">…</span>
                      )}
                      <button
                        aria-label={`Page ${n}`}
                        aria-current={currentPage === n ? "page" : undefined}
                        className={`admin-page-number ${currentPage === n ? "active" : ""}`}
                        onClick={() => setPage(n)}
                      >
                        {n}
                      </button>
                    </span>
                  ))}
                <button
                  className="icon-button"
                  aria-label="Next page"
                  disabled={currentPage === pageCount}
                  onClick={() => setPage(currentPage + 1)}
                >
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="admin-empty">
            <span>
              <Search size={28} />
            </span>
            <h3>
              {courses.length
                ? "A little off the path?"
                : "Every library starts with one course."}
            </h3>
            <p>
              {courses.length
                ? "No courses match these filters. Try another search or start fresh."
                : "Create your first course and give someone a new place to begin."}
            </p>
            {hasFilters ? (
              <button className="button secondary" onClick={reset}>
                Reset filters
              </button>
            ) : (
              <Link className="button primary" to="/admin/courses/new">
                <Plus size={16} />
                Create your first course
              </Link>
            )}
          </div>
        )}
      </section>
      <div className="admin-bottom-note">
        <span>Thoughtfully built. Always learning.</span>
        <Link to="/courses">
          See the student experience <ArrowUpRight size={14} />
        </Link>
      </div>
      {deleting && (
        <DeleteCourseDialog
          title={deleting.title}
          error={deleteError}
          deleting={isDeleting}
          onCancel={() => {
            if (!isDeleting) setDeleting(null);
          }}
          onDelete={confirmDelete}
        />
      )}
    </AdminLayout>
  );
}
