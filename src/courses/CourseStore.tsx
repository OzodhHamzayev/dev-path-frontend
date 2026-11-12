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
const AUTH_ROLE_KEY = "devpath-auth-role";

function hasAdminSession() {
  try {
    return sessionStorage.getItem(AUTH_ROLE_KEY) === "admin";
  } catch {
    return false;
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
  const [courses, setCourses] = useState<ManagedCourse[]>([]);
  const [storageError, setStorageError] = useState("");
  const [loadError, setLoadError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    if (!hasAdminSession()) {
      setIsLoading(false);
      return () => {
        active = false;
      };
    }
    async function load() {
      setIsLoading(true);
      try {
        const backendCourses = await getCoursesFromApi();
        if (!active) return;
        setCourses(backendCourses);
        setLoadError("");
        setStorageError("");
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
      if (hasAdminSession()) void refreshCourses();
    }
    window.addEventListener("devpath-auth-changed", reloadAfterLogin);
    return () =>
      window.removeEventListener("devpath-auth-changed", reloadAfterLogin);
  }, []);

  function saveCourse(course: ManagedCourse) {
    const exists = courses.some((c) => c.id === course.id);
    setCourses(
      exists
        ? courses.map((c) => (c.id === course.id ? course : c))
        : [course, ...courses],
    );
    return true;
  }

  function cacheCreatedCourse(course: ManagedCourse) {
    const next = [course, ...courses.filter((c) => c.id !== course.id)];
    setCourses(next);
  }

  async function refreshCourses() {
    setIsLoading(true);
    try {
      const backendCourses = await getCoursesFromApi();
      setCourses(backendCourses);
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
        deleteCourse: (id) => {
          setCourses((current) => current.filter((course) => course.id !== id));
          return true;
        },
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
