import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { getCoursesFromApi } from "../api/courses";
import type { Course } from "../data";

export type ManagedCourse = Course & {
  status: "published" | "draft";
  backendId?: string;
};
export const COURSE_STORAGE_KEY = "devpath-courses-v2";
export const categories = [
  "Web Development",
  "Programming",
  "Design",
  "Data Science",
  "Tools & DevOps",
];
export const levels = ["Beginner", "Intermediate", "Advanced"];
export const coverColors = ["blue", "sage", "purple", "gold", "coral"];

function isCourse(value: unknown): value is ManagedCourse {
  if (!value || typeof value !== "object") return false;
  const c = value as Record<string, unknown>;
  return (
    [
      "id",
      "title",
      "category",
      "level",
      "instructor",
      "initials",
      "color",
      "tech",
      "description",
    ].every((key) => typeof c[key] === "string") &&
    ["price", "rating", "students", "hours"].every(
      (key) => typeof c[key] === "number" && Number.isFinite(c[key]),
    ) &&
    (c.status === "published" || c.status === "draft")
  );
}

function parseCourses(raw: string | null): ManagedCourse[] | null {
  if (raw === null) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (!Array.isArray(value) || !value.every(isCourse)) return null;
    if (new Set(value.map((c) => c.id)).size !== value.length) return null;
    return value;
  } catch {
    return null;
  }
}

type CourseStore = {
  courses: ManagedCourse[];
  storageError: string;
  loadError: string;
  isLoading: boolean;
  refreshCourses: () => Promise<void>;
  saveCourse: (course: ManagedCourse) => boolean;
  cacheCreatedCourse: (course: ManagedCourse) => void;
  deleteCourse: (id: string) => boolean;
};
const Context = createContext<CourseStore | null>(null);

export function CourseProvider({ children }: { children: ReactNode }) {
  const [courses, setCourses] = useState<ManagedCourse[]>(() => {
    try {
      return parseCourses(localStorage.getItem(COURSE_STORAGE_KEY)) ?? [];
    } catch {
      return [];
    }
  });
  const [storageError, setStorageError] = useState("");
  const [loadError, setLoadError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      setIsLoading(true);
      try {
        const backendCourses = await getCoursesFromApi();
        if (!active) return;
        setCourses(backendCourses);
        setLoadError("");
        try {
          localStorage.setItem(
            COURSE_STORAGE_KEY,
            JSON.stringify(backendCourses),
          );
          setStorageError("");
        } catch {
          setStorageError(
            "Courses loaded, but the browser cache could not be updated.",
          );
        }
      } catch (error) {
        if (active)
          setLoadError(
            error instanceof Error
              ? error.message
              : "Courses could not be loaded.",
          );
      } finally {
        if (active) setIsLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    function reloadAfterLogin() {
      void refreshCourses();
    }
    window.addEventListener("devpath-auth-changed", reloadAfterLogin);
    return () =>
      window.removeEventListener("devpath-auth-changed", reloadAfterLogin);
  }, []);

  useEffect(() => {
    function sync(event: StorageEvent) {
      if (event.key !== COURSE_STORAGE_KEY && event.key !== null) return;
      const parsed = parseCourses(event.newValue);
      if (parsed) setCourses(parsed);
      else if (event.newValue === null) setCourses([]);
    }
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  function persist(next: ManagedCourse[]) {
    try {
      localStorage.setItem(COURSE_STORAGE_KEY, JSON.stringify(next));
      setCourses(next);
      setStorageError("");
      return true;
    } catch {
      setStorageError(
        "Changes could not be saved. Allow browser storage or free up space, then try again.",
      );
      return false;
    }
  }

  function saveCourse(course: ManagedCourse) {
    const exists = courses.some((c) => c.id === course.id);
    return persist(
      exists
        ? courses.map((c) => (c.id === course.id ? course : c))
        : [course, ...courses],
    );
  }

  function cacheCreatedCourse(course: ManagedCourse) {
    const next = [course, ...courses.filter((c) => c.id !== course.id)];
    // A successful POST must not be repeated if the optional browser cache fails.
    try {
      localStorage.setItem(COURSE_STORAGE_KEY, JSON.stringify(next));
      setStorageError("");
    } catch {
      setStorageError(
        "The course was created on the backend, but its browser copy could not be saved. Do not submit it again; check browser storage.",
      );
    }
    setCourses(next);
  }

  async function refreshCourses() {
    setIsLoading(true);
    try {
      const backendCourses = await getCoursesFromApi();
      persist(backendCourses);
      setLoadError("");
    } catch (error) {
      setLoadError(
        error instanceof Error ? error.message : "Courses could not be loaded.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Context.Provider
      value={{
        courses,
        storageError,
        loadError,
        isLoading,
        refreshCourses,
        saveCourse,
        cacheCreatedCourse,
        deleteCourse: (id) => persist(courses.filter((c) => c.id !== id)),
      }}
    >
      {children}
    </Context.Provider>
  );
}

export function useCourseStore() {
  const store = useContext(Context);
  if (!store) throw new Error("CourseProvider is required");
  return store;
}

export function usePublishedCourses() {
  return useCourseStore().courses.filter((c) => c.status === "published");
}
