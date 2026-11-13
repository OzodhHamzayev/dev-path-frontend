import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  CheckCircle2,
  Clock,
  Eye,
  FilePenLine,
  Save,
} from "lucide-react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  categories,
  coverColors,
  levels,
  useCourseStore,
  type ManagedCourse,
} from "../courses/CourseStore";
import { CourseVisual } from "../components/CourseVisual";
import { createCourse, updateCourseInApi, uploadCourseImage, validateCourseImage } from "../api/courses";
import { AdminLayout } from "./AdminLayout";

type Values = {
  imageUrl: string;
  title: string;
  description: string;
  instructor: string;
  category: string;
  level: string;
  price: string;
  hours: string;
  tech: string;
  color: string;
  status: "draft" | "published";
};
const defaults: Values = {
  imageUrl: "",
  title: "",
  description: "",
  instructor: "",
  category: "Web Development",
  level: "Beginner",
  price: "0",
  hours: "",
  tech: "",
  color: "purple",
  status: "draft",
};

function fromCourse(course?: ManagedCourse): Values {
  return course
    ? {
        imageUrl: course.imageUrl || "",
        title: course.title,
        description: course.description,
        instructor: course.instructor,
        category: course.category,
        level: course.level,
        price: String(course.price),
        hours: String(course.hours),
        tech: course.tech,
        color: course.color,
        status: course.status,
      }
    : defaults;
}

export function CourseEditor() {
  const { id } = useParams();
  const { courses } = useCourseStore();
  const course = courses.find((c) => c.id === id);
  if (id && !course)
    return (
      <AdminLayout>
        <div className="admin-empty">
          <FilePenLine size={35} />
          <h1>This course isn’t here anymore.</h1>
          <p>It may have been deleted. Return to your library to continue.</p>
          <Link className="button primary" to="/admin">
            Back to courses
          </Link>
        </div>
      </AdminLayout>
    );
  return <EditorForm key={id ?? "new"} course={course} />;
}

function EditorForm({ course }: { course?: ManagedCourse }) {
  const location = useLocation();
  const [values, setValues] = useState<Values>(() => fromCourse(course));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const submitting = useRef(false);
  const [imageFile, setImageFile] = useState<File>();
  const [imagePreview, setImagePreview] = useState("");
  const imageInput = useRef<HTMLInputElement>(null);
  const uploadedImage = useRef<{ file: File; url: string } | undefined>(undefined);
  useEffect(() => {
    if (!imageFile) { setImagePreview(""); return; }
    const url = URL.createObjectURL(imageFile);
    setImagePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);
  const [notice, setNotice] = useState(
    location.state?.created ? "Your course was created on the backend." : "",
  );
  const formRef = useRef<HTMLFormElement>(null);
  const { saveCourse, cacheCreatedCourse, storageError } = useCourseStore();
  const nav = useNavigate();
  const dirty = !!imageFile || JSON.stringify(values) !== JSON.stringify(fromCourse(course));
  useEffect(() => {
    if (!dirty) return;
    function confirmExit(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = "";
    }
    window.addEventListener("beforeunload", confirmExit);
    return () => window.removeEventListener("beforeunload", confirmExit);
  }, [dirty]);

  function change<K extends keyof Values>(key: K, value: Values[K]) {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((e) => ({ ...e, [key]: "", submit: "" }));
    setNotice("");
  }
  async function save(event: FormEvent) {
    event.preventDefault();
    if (submitting.current) return;
    const next: Record<string, string> = {};
    if (errors.image) next.image = errors.image;
    if (values.title.trim().length < 3)
      next.title = "Give your course a title of at least 3 characters.";
    if (values.description.trim().length < 20)
      next.description =
        "Add at least 20 characters to explain what learners will discover.";
    if (values.instructor.trim().length < 2)
      next.instructor = "Enter the instructor’s name.";
    if (values.tech.trim().length < 2)
      next.tech = "Enter a subject, such as React, Python, or SQL.";
    if (!categories.includes(values.category))
      next.category = "Choose a category.";
    if (!levels.includes(values.level))
      next.level = "Choose a difficulty level.";
    if (
      !values.price.trim() ||
      !Number.isFinite(Number(values.price)) ||
      Number(values.price) < 0 ||
      Number(values.price) > 10000 ||
      Math.abs(
        Number(values.price) * 100 - Math.round(Number(values.price) * 100),
      ) > 0.000001
    )
      next.price =
        "Enter a price from $0 to $10,000 with at most two decimals.";
    if (!course && !next.price && !Number.isInteger(Number(values.price)))
      next.price =
        "The current backend accepts whole-dollar prices. Enter a whole number.";
    if (
      !values.hours.trim() ||
      !Number.isFinite(Number(values.hours)) ||
      Number(values.hours) < 0.5 ||
      Number(values.hours) > 500
    )
      next.hours = "Enter a duration between 0.5 and 500 hours.";
    if (!course && !next.hours && !Number.isInteger(Number(values.hours)))
      next.hours = "The current backend accepts a whole number of hours.";
    setErrors(next);
    if (Object.keys(next).length) {
      requestAnimationFrame(() =>
        formRef.current
          ?.querySelector<HTMLElement>("[aria-invalid='true']")
          ?.focus(),
      );
      return;
    }
    const initials = values.instructor
      .trim()
      .split(/\s+/)
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
    const updated: ManagedCourse = {
      id: course?.id ?? crypto.randomUUID(),
      title: values.title.trim(),
      description: values.description.trim(),
      instructor: values.instructor.trim(),
      initials,
      category: values.category,
      level: values.level,
      price: Number(values.price),
      hours: Number(values.hours),
      tech: values.tech.trim(),
      color: values.color,
      status: values.status,
      rating: course?.rating ?? 0,
      students: course?.students ?? 0,
      backendId: course?.backendId,
      imageUrl: values.imageUrl || undefined,
    };

    // Keep a successful upload for retries if the later course request fails.
    submitting.current = true;
    setIsSaving(true);
    try {
      if (imageFile) {
        const url = uploadedImage.current?.file === imageFile
          ? uploadedImage.current.url : await uploadCourseImage(imageFile);
        uploadedImage.current = { file: imageFile, url };
        updated.imageUrl = url;
      }
    } catch (error) {
      setErrors({ submit: error instanceof Error ? error.message : "The image could not be uploaded." });
      submitting.current = false;
      setIsSaving(false);
      return;
    }

    if (!course) {
      submitting.current = true;
      setIsSaving(true);
      try {
        const created = await createCourse(updated);
        cacheCreatedCourse(created);
        nav("/admin", {
          replace: true,
          state: { createdTitle: created.title },
        });
      } catch (error) {
        setErrors({
          submit:
            error instanceof Error
              ? error.message
              : "The course could not be created.",
        });
      } finally {
        submitting.current = false;
        setIsSaving(false);
      }
      return;
    }

    submitting.current = true;
    setIsSaving(true);
    try {
      const databaseId =
        course.backendId ?? (/^\d+$/.test(course.id) ? course.id : null);
      if (databaseId) await updateCourseInApi(databaseId, updated);
      if (saveCourse(updated)) {
        nav("/admin", {
          replace: true,
          state: databaseId
            ? { updatedTitle: updated.title }
            : { localUpdatedTitle: updated.title },
        });
      }
    } catch (error) {
      setErrors({
        submit:
          error instanceof Error
            ? error.message
            : "The course could not be updated.",
      });
    } finally {
      submitting.current = false;
      setIsSaving(false);
    }
  }
  function inputProps(key: keyof Values) {
    return {
      id: `course-${key}`,
      "aria-invalid": !!errors[key],
      "aria-describedby": errors[key] ? `${key}-error` : undefined,
    };
  }
  return (
    <AdminLayout>
      <Link className="text-link admin-editor-back" to="/admin">
        <ArrowLeft size={15} />
        Back to course library
      </Link>
      <div className="admin-page-heading">
        <div>
          <div className="eyebrow">
            {course
              ? "MAKE A GOOD THING EVEN BETTER"
              : "SOMETHING GREAT STARTS HERE"}
          </div>
          <h1>
            {course ? "Refine your course." : "Create a little possibility."}
          </h1>
          <p>
            {course
              ? "Thoughtful updates make a better learning experience."
              : "Turn what you know into someone else’s next chapter."}
          </p>
        </div>
        <span className={`admin-status ${values.status}`}>
          <i />
          {values.status === "published" ? "Published" : "Draft"}
        </span>
      </div>
      <div className="admin-preview-notice">
        <span className="admin-preview-dot" />
        <p>
          {course
            ? course.backendId || /^\d+$/.test(course.id)
              ? "Saving changes updates this course through the backend. Subject and visibility remain in the browser copy until the backend supports them."
              : "This starter course exists only in the browser, so changes stay in this demo workspace. Database courses are updated through the backend."
            : "Create course sends your details to the backend. Subject and draft/published visibility are kept in this browser until the backend supports them."}
        </p>
      </div>
      {(notice || storageError) && (
        <div
          role={storageError ? "alert" : "status"}
          className={storageError ? "admin-error" : "admin-notice"}
        >
          {!storageError && <CheckCircle2 size={17} />}
          {storageError || notice}
        </div>
      )}
      {errors.submit && (
        <p className="admin-error" role="alert">
          {errors.submit}
        </p>
      )}
      <form
        ref={formRef}
        onSubmit={save}
        noValidate
        className="admin-editor-grid"
      >
        <fieldset
          className="admin-editor-fields"
          disabled={isSaving}
          aria-busy={isSaving}
        >
          <section
            className="admin-form-section"
            aria-labelledby="basics-title"
          >
            <div className="admin-form-section-heading">
              <span>01</span>
              <div>
                <h2 id="basics-title">The essentials</h2>
                <p>Help learners see what’s waiting for them.</p>
              </div>
            </div>
            <Field label="Course title" field="title" error={errors.title}>
              <input
                {...inputProps("title")}
                maxLength={100}
                placeholder="e.g. Build APIs with Go"
                value={values.title}
                onChange={(e) => change("title", e.target.value)}
              />
            </Field>
            <Field
              label="Course description"
              field="description"
              error={errors.description}
            >
              <textarea
                {...inputProps("description")}
                rows={5}
                maxLength={2000}
                placeholder="What will learners build, understand, or be able to do?"
                value={values.description}
                onChange={(e) => change("description", e.target.value)}
              />
              <span className="admin-field-hint">
                A clear, friendly overview.{" "}
                <span>{values.description.length}/2000</span>
              </span>
            </Field>
            <div className="admin-field-pair">
              <Field label="Category" field="category" error={errors.category}>
                <select
                  {...inputProps("category")}
                  value={values.category}
                  onChange={(e) => change("category", e.target.value)}
                >
                  {categories.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </Field>
              <Field
                label="Difficulty level"
                field="level"
                error={errors.level}
              >
                <select
                  {...inputProps("level")}
                  value={values.level}
                  onChange={(e) => change("level", e.target.value)}
                >
                  {levels.map((l) => (
                    <option key={l}>{l}</option>
                  ))}
                </select>
              </Field>
            </div>
          </section>
          <section
            className="admin-form-section"
            aria-labelledby="details-title"
          >
            <div className="admin-form-section-heading">
              <span>02</span>
              <div>
                <h2 id="details-title">A few helpful details</h2>
                <p>The practical things that help people choose.</p>
              </div>
            </div>
            <div className="admin-field-pair">
              <Field
                label="Instructor name"
                field="instructor"
                error={errors.instructor}
              >
                <input
                  {...inputProps("instructor")}
                  maxLength={80}
                  placeholder="e.g. Alex Morgan"
                  value={values.instructor}
                  onChange={(e) => change("instructor", e.target.value)}
                />
              </Field>
              <Field
                label="Subject / technology"
                field="tech"
                error={errors.tech}
              >
                <input
                  {...inputProps("tech")}
                  maxLength={30}
                  placeholder="e.g. Go, React, Python"
                  value={values.tech}
                  onChange={(e) => change("tech", e.target.value)}
                />
              </Field>
            </div>
            <div className="admin-field-pair">
              <Field label="Price (USD)" field="price" error={errors.price}>
                <input
                  {...inputProps("price")}
                  type="number"
                  inputMode="decimal"
                  min="0"
                  max="10000"
                  step={course ? "0.01" : "1"}
                  value={values.price}
                  onChange={(e) => change("price", e.target.value)}
                />
                <span className="admin-field-hint">
                  Set to 0 for a free course.
                </span>
              </Field>
              <Field
                label="Duration (hours)"
                field="hours"
                error={errors.hours}
              >
                <input
                  {...inputProps("hours")}
                  type="number"
                  inputMode="decimal"
                  min={course ? "0.5" : "1"}
                  max="500"
                  step={course ? "any" : "1"}
                  placeholder="e.g. 12"
                  value={values.hours}
                  onChange={(e) => change("hours", e.target.value)}
                />
              </Field>
            </div>
          </section>
          <section
            className="admin-form-section"
            aria-labelledby="appearance-title"
          >
            <div className="admin-form-section-heading">
              <span>03</span>
              <div>
                <h2 id="appearance-title">Make it feel like your course</h2>
                <p>A little personality, with room to breathe.</p>
              </div>
            </div>
            <Field label="Course image" field="image" error={errors.image}>
              <input
                id="course-image"
                ref={imageInput}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                aria-invalid={!!errors.image}
                aria-describedby="course-image-hint image-error"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  const error = validateCourseImage(file);
                  setErrors((previous) => ({ ...previous, image: error, submit: "" }));
                  if (error) { event.target.value = ""; return; }
                  setImageFile(file);
                  uploadedImage.current = undefined;
                  setNotice("");
                }}
              />
              <span id="course-image-hint" className="admin-field-hint">
                JPG, PNG or WebP, up to 5 MB. Choose a new image to replace the current cover.
              </span>
              {imageFile && <span className="admin-field-hint">Selected: {imageFile.name}</span>}
              {(imageFile || errors.image) && (
                <button type="button" className="text-link" onClick={() => {
                  setImageFile(undefined);
                  uploadedImage.current = undefined;
                  if (imageInput.current) imageInput.current.value = "";
                  setErrors((previous) => ({ ...previous, image: "", submit: "" }));
                }}>Discard selected image</button>
              )}
            </Field>
            <fieldset className="admin-color-field">
              <legend>Cover color</legend>
              <div>
                {coverColors.map((color) => (
                  <button
                    type="button"
                    key={color}
                    aria-label={`${color} cover`}
                    aria-pressed={values.color === color}
                    className={`admin-color-option ${color} ${values.color === color ? "selected" : ""}`}
                    onClick={() => change("color", color)}
                  >
                    {values.color === color && <Check size={18} />}
                  </button>
                ))}
              </div>
            </fieldset>
            <Field label="Visibility" field="status">
              <select
                id="course-status"
                value={values.status}
                onChange={(e) =>
                  change("status", e.target.value as Values["status"])
                }
              >
                <option value="draft">
                  Draft — only in the admin workspace
                </option>
                <option value="published">
                  Published — visible in the catalog
                </option>
              </select>
              <span className="admin-field-hint">
                You can change this any time from your course library.
              </span>
            </Field>
          </section>
          <div className="admin-form-footer">
            <Link
              className="button secondary"
              to="/admin"
              aria-disabled={isSaving}
              onClick={(e) => {
                if (isSaving) e.preventDefault();
              }}
            >
              Cancel
            </Link>
            <button
              className="button primary"
              type="submit"
              disabled={isSaving}
            >
              <Save size={16} />
              {isSaving
                ? course
                  ? "Saving changes…"
                  : "Creating course…"
                : course
                  ? "Save changes"
                  : "Create course"}
            </button>
          </div>
        </fieldset>
        <aside className="admin-preview-column">
          <div className="admin-preview-title">
            <Eye size={15} />
            <span>LIVE PREVIEW</span>
          </div>
          <div className="admin-course-preview">
            <CourseVisual
              imageUrl={imagePreview || values.imageUrl}
              title={values.title || "Your course"}
              tech={values.tech}
              color={values.color}
            />
            <div>
              <span className="eyebrow">{values.category}</span>
              <h3>{values.title.trim() || "Your next great course"}</h3>
              <p>
                {values.description.trim() ||
                  "A welcoming introduction to what your learners will discover."}
              </p>
              <div className="admin-preview-instructor">
                <span className={`avatar ${values.color}`}>
                  {values.instructor
                    .trim()
                    .split(/\s+/)
                    .filter(Boolean)
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase() || "?"}
                </span>
                {values.instructor.trim() || "Your instructor"}
              </div>
              <div className="admin-preview-meta">
                <span>
                  <Clock size={13} />
                  {values.hours || "—"} hours
                </span>
                <span>{values.level}</span>
              </div>
              <div className="admin-preview-price">
                <strong>
                  {Number(values.price) > 0
                    ? `$${Number(values.price).toFixed(2)}`
                    : "Free"}
                </strong>
                <span>
                  View course <ArrowUpRight size={14} />
                </span>
              </div>
            </div>
          </div>
          <div className="admin-editor-tip">
            <span>✦</span>
            <h3>Clarity is a kindness.</h3>
            <p>
              A specific title and a thoughtful description help the right
              learners find you.
            </p>
          </div>
        </aside>
      </form>
    </AdminLayout>
  );
}

function Field({
  label,
  field,
  error,
  children,
}: {
  label: string;
  field: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="admin-field">
      <label htmlFor={`course-${field}`}>{label}</label>
      {children}
      {error && (
        <small className="admin-field-error" id={`${field}-error`}>
          {error}
        </small>
      )}
    </div>
  );
}
