import React, { useState, createContext, useContext, useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  NavLink,
  useNavigate,
  useParams,
  useLocation,
} from "react-router-dom";
import {
  ArrowUpRight,
  ArrowRight,
  ArrowLeft,
  BookOpen,
  Bookmark,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Code2,
  Command,
  Flame,
  GraduationCap,
  LayoutDashboard,
  Menu,
  Play,
  Search,
  Star,
  Users,
  X,
  Eye,
  EyeOff,
  Terminal,
  Layers,
  Palette,
  Database,
  GitBranch,
  SlidersHorizontal,
  LogOut,
  Sun,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  ShieldCheck,
  Quote,
} from "lucide-react";
import { sections, lessons, type Course } from "./data";
import { CourseProvider, usePublishedCourses } from "./courses/CourseStore";
import { AdminCourses } from "./admin/AdminCourses";
import { CourseEditor } from "./admin/CourseEditor";
import "./styles.css";
type State = {
  saved: string[];
  enrolled: string[];
  progress: Record<string, number[]>;
  user: string;
  theme: string;
};
const initial: State = {
  saved: [],
  enrolled: [],
  progress: {},
  user: "",
  theme: "midnight",
};
function readState(): State {
  try {
    const s = JSON.parse(localStorage.getItem("devpath") || "null");
    return s &&
      Array.isArray(s.saved) &&
      Array.isArray(s.enrolled) &&
      typeof s.progress === "object"
      ? { ...initial, ...s }
      : initial;
  } catch {
    return initial;
  }
}
const Context = createContext<{
  state: State;
  set: React.Dispatch<React.SetStateAction<State>>;
  toast: (s: string) => void;
}>({ state: initial, set: () => {}, toast: () => {} });
const useApp = () => useContext(Context);
export function App() {
  return (
    <CourseProvider>
      <AppContent />
    </CourseProvider>
  );
}
function AppContent() {
  const [state, set] = useState(readState);
  const [message, toast] = useState("");
  const location = useLocation();
  useEffect(() => {
    localStorage.setItem("devpath", JSON.stringify(state));
    document.documentElement.dataset.theme = state.theme;
  }, [state]);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);
  useEffect(() => {
    if (message) {
      const t = setTimeout(() => toast(""), 3200);
      return () => clearTimeout(t);
    }
  }, [message]);
  return (
    <Context.Provider value={{ state, set, toast }}>
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/courses" element={<Catalog />} />
          <Route path="/courses/:id" element={<Details />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/learn/:id/:lesson" element={<Workspace />} />
          <Route path="/signin" element={<Auth key="signin" />} />
          <Route path="/signup" element={<Auth key="signup" signup />} />
          <Route
            path="/admin"
            element={
              <AdminCourses
                onDeleteCourse={(id) => {
                  set((s) => {
                    const progress = { ...s.progress };
                    delete progress[id];
                    return {
                      ...s,
                      saved: s.saved.filter((x) => x !== id),
                      enrolled: s.enrolled.filter((x) => x !== id),
                      progress,
                    };
                  });
                }}
              />
            }
          />
          <Route path="/admin/courses/new" element={<CourseEditor />} />
          <Route path="/admin/courses/:id/edit" element={<CourseEditor />} />
          <Route
            path="*"
            element={
              <div className="container empty">
                <h1>A little off the path.</h1>
                <p>We couldn't find this page.</p>
                <Link className="button primary" to="/">
                  Back to home
                </Link>
              </div>
            }
          />
        </Routes>
      </main>
      {!location.pathname.startsWith("/learn") &&
        !location.pathname.startsWith("/admin") && <Footer />}
      {message && (
        <div role="status" className="toast">
          <CheckCircle2 size={19} />
          {message}
        </div>
      )}
    </Context.Provider>
  );
}
function Logo() {
  return (
    <Link to="/" className="logo" aria-label="DevPath home">
      <span className="logo-icon">
        <Code2 size={23} />
      </span>
      Dev<span>Path</span>
      <i />
    </Link>
  );
}
function Header() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const { state, set, toast } = useApp();
  const nav = useNavigate();
  const location = useLocation();
  useEffect(() => setOpen(false), [location.pathname, location.search]);
  return (
    <header className="header">
      <div className="nav-wrap">
        <Logo />
        <nav className="desktop-nav">
          <NavLink to="/courses">Explore Courses</NavLink>
          <NavLink to="/dashboard">My Learning</NavLink>
          <NavLink to="/admin">Admin</NavLink>
        </nav>
        <form
          className="nav-search"
          onSubmit={(e) => {
            e.preventDefault();
            nav("/courses?q=" + encodeURIComponent(q));
          }}
        >
          <Search size={16} />
          <input
            aria-label="Search courses"
            placeholder="What do you want to learn?"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <kbd>↵</kbd>
        </form>
        <div className="nav-actions">
          <button
            className="icon-button theme-button"
            aria-label="Switch between midnight and dusk dark themes"
            title="Change dark ambiance"
            onClick={() => {
              set((s) => ({
                ...s,
                theme: s.theme === "midnight" ? "dusk" : "midnight",
              }));
              toast("Dark ambiance updated");
            }}
          >
            {state.theme === "midnight" ? (
              <Moon size={18} />
            ) : (
              <Sun size={18} />
            )}
          </button>
          {state.user ? (
            <Link className="account" to="/dashboard">
              {state.user.slice(0, 1).toUpperCase()}
            </Link>
          ) : (
            <>
              <Link className="sign-in" to="/signin">
                Log in
              </Link>
              <Link className="button primary small" to="/signup">
                Get started <ArrowUpRight size={15} />
              </Link>
            </>
          )}
          <button
            className="icon-button mobile-toggle"
            aria-label="Toggle navigation"
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>
      {open && (
        <nav className="mobile-nav">
          <Link to="/courses">Explore Courses</Link>
          <Link to="/dashboard">My Learning</Link>
          <Link to="/admin">Admin workspace</Link>
          <Link to="/signin">Demo sign in</Link>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              nav("/courses?q=" + encodeURIComponent(q));
            }}
          >
            <input
              aria-label="Search mobile courses"
              placeholder="Search courses…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <button aria-label="Search">
              <Search size={19} />
            </button>
          </form>
        </nav>
      )}
    </header>
  );
}
function Artwork({
  course,
  compact = false,
}: {
  course: Course;
  compact?: boolean;
}) {
  return (
    <div
      className={`artwork ${course.color} ${compact ? "compact" : ""}`}
      aria-label={`${course.tech} course illustration`}
    >
      <span className="art-grid" />
      <span className="art-orbit orbit-one" />
      <span className="art-orbit orbit-two" />
      <div className="art-code">
        {course.tech === "React" ? (
          <svg viewBox="0 0 100 90" aria-hidden="true">
            <g fill="none" stroke="currentColor" strokeWidth="3">
              <ellipse cx="50" cy="45" rx="44" ry="16" />
              <ellipse
                cx="50"
                cy="45"
                rx="44"
                ry="16"
                transform="rotate(60 50 45)"
              />
              <ellipse
                cx="50"
                cy="45"
                rx="44"
                ry="16"
                transform="rotate(120 50 45)"
              />
            </g>
            <circle fill="currentColor" cx="50" cy="45" r="6" />
          </svg>
        ) : course.tech === "Python" ? (
          <svg viewBox="0 0 100 90" aria-hidden="true">
            <path
              fill="currentColor"
              d="M48 7c-23 0-25 5-25 18v10h29v5H15C1 40 1 74 15 74h10V59c0-12 9-17 20-17h18c9 0 14-5 14-14V20C77 9 68 7 48 7zm-11 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8z"
            />
            <path
              fill="currentColor"
              opacity=".55"
              d="M52 83c23 0 25-5 25-18V55H48v-5h37c14 0 14-34 0-34H75v15c0 12-9 17-20 17H37c-9 0-14 5-14 14v8c0 11 9 13 29 13zm11-8a4 4 0 1 1 0-8 4 4 0 0 1 0 8z"
            />
          </svg>
        ) : course.tech === "UI / UX" ? (
          <div className="design-art">
            <div>
              <i />
              <i />
              <i />
            </div>
            <span />
            <b />
            <em />
          </div>
        ) : (
          <span className="tech-type">
            {course.tech === "JavaScript" ? (
              "JS"
            ) : course.tech === "TypeScript" ? (
              "TS"
            ) : course.tech === "Git" ? (
              <GitBranch size={65} />
            ) : course.tech === "SQL" ? (
              <Database size={65} />
            ) : course.tech === "CSS" ? (
              "CSS"
            ) : course.tech === "Node.js" ? (
              <Code2 size={68} />
            ) : course.tech === "Docker" ? (
              <Layers size={65} />
            ) : course.tech === "Algorithms" ? (
              "{ }"
            ) : (
              <Database size={65} />
            )}
          </span>
        )}
      </div>
      <span className="art-label">{course.tech}</span>
      <span className="art-corner">&lt;/&gt;</span>
    </div>
  );
}
function SaveButton({ id }: { id: string }) {
  const { state, set, toast } = useApp();
  const saved = state.saved.includes(id);
  return (
    <button
      className={`save-button ${saved ? "is-saved" : ""}`}
      aria-label={saved ? "Unsave course" : "Save course"}
      aria-pressed={saved}
      onClick={() => {
        set((s) => ({
          ...s,
          saved: saved ? s.saved.filter((x) => x !== id) : [...s.saved, id],
        }));
        toast(
          saved
            ? "Course removed from saved"
            : "Course saved to your learning dashboard",
        );
      }}
    >
      <Bookmark size={17} fill={saved ? "currentColor" : "none"} />
    </button>
  );
}
function CourseCard({ course: c }: { course: Course }) {
  return (
    <article className="course-card">
      <div className="course-cover">
        <Link to={"/courses/" + c.id} tabIndex={-1}>
          <Artwork course={c} />
        </Link>
        <span className="level-tag">{c.level}</span>
        <SaveButton id={c.id} />
      </div>
      <div className="course-body">
        <span className="eyebrow course-category">{c.category}</span>
        <Link to={"/courses/" + c.id}>
          <h3>{c.title}</h3>
        </Link>
        <div className="instructor">
          <span className={`avatar ${c.color}`}>{c.initials}</span>
          {c.instructor}
        </div>
        <div className="course-metadata">
          <span>
            <Star size={13} className="star" fill="currentColor" />
            <b>{c.rating.toFixed(1)}</b>
            <small>({(c.students / 1000).toFixed(1)}k)</small>
          </span>
          <span>
            <Clock size={13} />
            {c.hours} hours
          </span>
        </div>
        <div className="course-bottom">
          <strong>
            {c.price ? "$" + c.price : <span className="free">Free</span>}
          </strong>
          <Link to={"/courses/" + c.id}>
            View course <ArrowUpRight size={15} />
          </Link>
        </div>
      </div>
    </article>
  );
}
function Home() {
  const courses = usePublishedCourses();
  return (
    <>
      <section className="hero container">
        <div className="hero-copy">
          <div className="hero-badge">
            <span /> A little progress, every day.
          </div>
          <h1>
            Build skills.
            <br />
            Create your <span>future.</span>
            <svg viewBox="0 0 280 18" aria-hidden="true">
              <path d="M4 12 Q140 -2 275 9" />
            </svg>
          </h1>
          <p>
            Your next chapter starts with a new skill. Learn to code,
            <br className="desktop-break" /> build real projects, and grow at
            your own pace.
          </p>
          <div className="hero-ctas">
            <Link className="button primary" to="/courses">
              Explore Courses <ArrowRight size={17} />
            </Link>
            <Link className="button quiet" to="/courses?price=free">
              <Play size={15} /> Start learning for free
            </Link>
          </div>
          <div className="social-proof">
            <div className="avatar-stack">
              <img
                src="https://i.pravatar.cc/64?img=47"
                alt=""
                onError={(e) => (e.currentTarget.style.display = "none")}
              />
              <img
                src="https://i.pravatar.cc/64?img=12"
                alt=""
                onError={(e) => (e.currentTarget.style.display = "none")}
              />
              <img
                src="https://i.pravatar.cc/64?img=49"
                alt=""
                onError={(e) => (e.currentTarget.style.display = "none")}
              />
              <span>J</span>
            </div>
            <div>
              <div className="proof-stars">
                ★★★★★ <b>4.9/5</b>
              </div>
              <small>Join 25,000+ curious minds</small>
            </div>
          </div>
        </div>
        <DashboardPreview />
      </section>
      <section className="trust-strip">
        <div className="container trust-inner">
          <span>
            Big ideas start with
            <br />
            <b>the right foundations.</b>
          </span>
          <div>
            <Code2 />
            Web development
          </div>
          <div>
            <Terminal />
            Programming
          </div>
          <div>
            <Palette />
            UI & UX design
          </div>
          <div>
            <Database />
            Data science
          </div>
        </div>
      </section>
      <section className="container section featured">
        <div className="section-heading">
          <div>
            <div className="eyebrow">YOUR NEXT CHAPTER</div>
            <h2>A great place to start.</h2>
            <p>Handpicked courses to turn your curiosity into capability.</p>
          </div>
          <Link className="text-link" to="/courses">
            Explore all courses <ArrowRight size={16} />
          </Link>
        </div>
        <div className="course-grid featured-grid">
          {courses.slice(0, 3).map((c) => (
            <CourseCard key={c.id} course={c} />
          ))}
        </div>
      </section>
      <section className="container section categories-section">
        <div className="section-heading">
          <div>
            <div className="eyebrow">FIND YOUR DIRECTION</div>
            <h2>One platform. So many possibilities.</h2>
            <p>Follow your interests. We’ll help you find your path.</p>
          </div>
        </div>
        <div className="category-grid">
          {[
            { name: "Web Development", icon: Code2, count: 5, color: "blue" },
            { name: "Programming", icon: Terminal, count: 3, color: "sage" },
            { name: "Design", icon: Palette, count: 1, color: "purple" },
            { name: "Data Science", icon: Database, count: 2, color: "gold" },
          ].map((c) => (
            <Link
              key={c.name}
              to={"/courses?category=" + encodeURIComponent(c.name)}
              className="category-card"
            >
              <span className={`category-icon ${c.color}`}>
                <c.icon size={23} />
              </span>
              <h3>{c.name}</h3>
              <p>
                {courses.filter((course) => course.category === c.name).length}{" "}
                thoughtfully crafted courses
              </p>
              <ArrowUpRight size={17} />
            </Link>
          ))}
        </div>
      </section>
      <section className="why-section">
        <div className="container why-inner">
          <div>
            <div className="eyebrow">LESS OVERWHELM. MORE MOMENTUM.</div>
            <h2>
              Learning that fits
              <br />
              the way you live.
            </h2>
            <p>
              No rush. No rabbit holes. Just a clear path from
              <br />
              “I’m curious” to “I built that.”
            </p>
            <Link className="text-link" to="/courses">
              Find your first course <ArrowRight size={16} />
            </Link>
          </div>
          <div className="benefit-grid">
            {[
              {
                icon: Command,
                title: "Learn by doing",
                text: "Real projects, practical skills. Build things you’ll be proud to share.",
              },
              {
                icon: Clock,
                title: "Your pace, your space",
                text: "A little each day or a weekend deep dive. Make learning yours.",
              },
              {
                icon: GraduationCap,
                title: "Guidance that gets it",
                text: "Learn from experienced developers who remember being beginners.",
              },
              {
                icon: GitBranch,
                title: "A path, not a pile",
                text: "Thoughtful, structured lessons. Always know what comes next.",
              },
            ].map((b) => (
              <div key={b.title}>
                <b.icon size={23} />
                <h3>{b.title}</h3>
                <p>{b.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="container section testimonials">
        <div className="section-heading centered">
          <div>
            <div className="eyebrow">REAL PEOPLE. REAL PROGRESS.</div>
            <h2>Every journey starts somewhere.</h2>
            <p>A few words from people who took that first step.</p>
          </div>
        </div>
        <div className="testimonial-grid">
          {[
            {
              name: "Jamie Rodriguez",
              role: "Frontend developer",
              initials: "JR",
              text: "For the first time, the pieces actually clicked. I went from following tutorials to building my own projects with confidence.",
            },
            {
              name: "Aisha Khan",
              role: "Career switcher",
              initials: "AK",
              text: "I learn after work, in small pockets of time. DevPath makes it feel manageable. Six months later, I landed my first developer role.",
            },
            {
              name: "Michael Lee",
              role: "Lifelong learner",
              initials: "ML",
              text: "Thoughtful explanations, real-world examples, and no unnecessary noise. This is exactly how I wish I had started learning.",
            },
          ].map((t) => (
            <article className="testimonial" key={t.name}>
              <div className="proof-stars">★★★★★</div>
              <blockquote>“{t.text}”</blockquote>
              <div className="instructor">
                <span className="avatar purple">{t.initials}</span>
                <div>
                  <strong>{t.name}</strong>
                  <small>{t.role}</small>
                </div>
                <Quote size={23} />
              </div>
            </article>
          ))}
        </div>
      </section>
      <section className="container final-cta">
        <span className="small-code">
          <Code2 size={28} />
        </span>
        <h2>Your future self will thank you.</h2>
        <p>One lesson. One project. One step closer to where you want to be.</p>
        <Link className="button primary" to="/courses">
          Find your path <ArrowRight size={17} />
        </Link>
        <small>No experience needed. Just a little curiosity.</small>
      </section>
    </>
  );
}
function DashboardPreview() {
  const courses = usePublishedCourses();
  const previewCourse =
    courses.find((course) => course.id === "react") ?? courses[0];
  return (
    <div className="preview-scene">
      <div className="floating-label float-top">
        <span className="sage-icon">
          <Check size={15} />
        </span>{" "}
        A little better than yesterday.
      </div>
      <div className="dashboard-preview">
        <div className="preview-top">
          <span className="preview-dots">
            <i />
            <i />
            <i />
          </span>
          <span>YOUR LEARNING SPACE</span>
          <span>⌘</span>
        </div>
        <div className="preview-main">
          <div className="preview-greeting">
            <span>LET’S KEEP THE MOMENTUM</span>
            <h3>
              Welcome back, Alex <span>✦</span>
            </h3>
            <p>Good things come from showing up.</p>
          </div>
          <div className="preview-stats">
            <div>
              <span className="preview-icon lavender">
                <BookOpen size={17} />
              </span>
              <b>
                3 <small>Courses in progress</small>
              </b>
            </div>
            <div>
              <span className="preview-icon teal">
                <Clock size={17} />
              </span>
              <b>
                12.5 <small>Hours of learning</small>
              </b>
            </div>
          </div>
          <div className="preview-label">
            PICK UP WHERE YOU LEFT OFF <span>•••</span>
          </div>
          <div className="preview-course">
            <div className="mini-react">⚛</div>
            <div>
              <span>{previewCourse?.category ?? "YOUR NEXT CHAPTER"}</span>
              <h4>{previewCourse?.title ?? "Discover your next course"}</h4>
              <p>
                {previewCourse?.id === "react"
                  ? "Next up: Understanding React Hooks"
                  : "A little progress, one lesson at a time."}
              </p>
            </div>
          </div>
          <div className="preview-progress">
            <span>
              Making great progress <b>68%</b>
            </span>
            <div>
              <i />
            </div>
          </div>
          <Link
            className="preview-continue"
            to={previewCourse ? `/courses/${previewCourse.id}` : "/courses"}
          >
            Continue learning <ArrowRight size={14} />
          </Link>
          <div className="preview-footer">
            <Flame size={16} /> 7-day learning streak{" "}
            <span>Keep it going!</span>
          </div>
        </div>
      </div>
      <div className="floating-label float-bottom">
        <span className="celebration">✦</span>
        <div>
          <b>Small steps. Real progress.</b>
          <small>Your next breakthrough is a lesson away.</small>
        </div>
      </div>
      <span className="scene-spark spark-one">✦</span>
      <span className="scene-spark spark-two">+</span>
    </div>
  );
}
function Catalog() {
  const courses = usePublishedCourses();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const [q, setQ] = useState(params.get("q") || "");
  const [category, setCategory] = useState(params.get("category") || "all");
  const [level, setLevel] = useState("all");
  const [price, setPrice] = useState(params.get("price") || "all");
  const [sort, setSort] = useState("popular");
  useEffect(() => {
    const p = new URLSearchParams(location.search);
    setQ(p.get("q") || "");
    setCategory(p.get("category") || "all");
    setPrice(p.get("price") || "all");
  }, [location.search]);
  const filtered = courses
    .filter(
      (c) =>
        c.title.toLowerCase().includes(q.toLowerCase()) &&
        (category === "all" || c.category === category) &&
        (level === "all" || c.level === level) &&
        (price === "all" || (price === "free" ? c.price === 0 : c.price > 0)),
    )
    .sort((a, b) =>
      sort === "rating"
        ? b.rating - a.rating
        : sort === "price"
          ? a.price - b.price
          : b.students - a.students,
    );
  function reset() {
    setQ("");
    setCategory("all");
    setLevel("all");
    setPrice("all");
    setSort("popular");
  }
  return (
    <div className="container catalog page">
      <div className="eyebrow">CURIOSITY LOOKS GOOD ON YOU</div>
      <h1>Find your next possibility.</h1>
      <p className="page-intro">
        Practical skills. Real projects. A path that’s yours.
      </p>
      <div className="catalog-search">
        <Search size={21} />
        <input
          aria-label="Search by course title"
          placeholder="What would you like to learn?"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        {q && (
          <button aria-label="Clear search" onClick={() => setQ("")}>
            <X size={18} />
          </button>
        )}
      </div>
      <div className="filters">
        <span className="filter-label">
          <SlidersHorizontal size={17} /> Filters
        </span>
        <label>
          <span className="sr-only">Category</span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="all">All categories</option>
            {[...new Set(courses.map((c) => c.category))].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <label>
          <span className="sr-only">Difficulty</span>
          <select value={level} onChange={(e) => setLevel(e.target.value)}>
            <option value="all">All levels</option>
            {["Beginner", "Intermediate", "Advanced"].map((l) => (
              <option key={l}>{l}</option>
            ))}
          </select>
        </label>
        <label>
          <span className="sr-only">Price</span>
          <select value={price} onChange={(e) => setPrice(e.target.value)}>
            <option value="all">Any price</option>
            <option value="free">Free courses</option>
            <option value="paid">Paid courses</option>
          </select>
        </label>
        <button className="reset-button" onClick={reset}>
          Reset filters
        </button>
      </div>
      <div className="results-bar">
        <span>
          <b>{filtered.length}</b> courses to move you forward
        </span>
        <label>
          Sort by{" "}
          <select
            aria-label="Sort courses"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="popular">Most popular</option>
            <option value="rating">Highest rated</option>
            <option value="price">Price: low to high</option>
          </select>
        </label>
      </div>
      {filtered.length ? (
        <div className="course-grid">
          {filtered.map((c) => (
            <CourseCard key={c.id} course={c} />
          ))}
        </div>
      ) : (
        <div className="empty">
          <Search size={34} />
          <h2>No courses on this path yet.</h2>
          <p>Try a different search or make your filters a little broader.</p>
          <button className="button primary" onClick={reset}>
            Reset filters
          </button>
        </div>
      )}
    </div>
  );
}
function progressFor(state: State, id: string) {
  return Math.round(((state.progress[id]?.length || 0) / lessons.length) * 100);
}
function continuePath(state: State, id: string) {
  const done = state.progress[id] || [];
  return `/learn/${id}/${Math.max(
    0,
    lessons.findIndex((_, i) => !done.includes(i)),
  )}`;
}
function Enroll({ course: c }: { course: Course }) {
  const { state, set, toast } = useApp();
  const enrolled = state.enrolled.includes(c.id);
  return enrolled ? (
    <Link className="button primary full" to={continuePath(state, c.id)}>
      Continue Learning <ArrowRight size={17} />
    </Link>
  ) : (
    <button
      className="button primary full"
      onClick={() => {
        set((s) => ({ ...s, enrolled: [...s.enrolled, c.id] }));
        toast("You’re enrolled! Your next chapter starts now.");
      }}
    >
      {c.price ? "Enroll in this course" : "Start learning for free"}{" "}
      <ArrowRight size={17} />
    </button>
  );
}
function Details() {
  const courses = usePublishedCourses();
  const { id } = useParams();
  const c = courses.find((c) => c.id === id);
  const { state } = useApp();
  if (!c) return <NotFound />;
  return (
    <>
      <div className="container page details">
        <div className="breadcrumb">
          <Link to="/courses">Courses</Link>
          <ChevronRight size={14} />
          <span>{c.category}</span>
        </div>
        <div className="details-grid">
          <div>
            <span className="eyebrow">
              {c.category} · {c.level}
            </span>
            <h1>{c.title}</h1>
            <p className="detail-description">{c.description}</p>
            <div className="detail-meta">
              <span>
                <Star size={16} className="star" fill="currentColor" />{" "}
                {c.rating}{" "}
                <small>
                  ({Math.round(c.students / 10).toLocaleString()} reviews)
                </small>
              </span>
              <span>
                <Users size={16} />
                {c.students.toLocaleString()} learners
              </span>
            </div>
            <div className="instructor">
              <span className={`avatar ${c.color}`}>{c.initials}</span>Created
              by <b>{c.instructor}</b>
            </div>
            <section className="detail-section outcome-box">
              <h2>What you’ll learn</h2>
              <div className="outcomes">
                {[
                  "Build practical projects from the ground up",
                  "Understand core concepts with confidence",
                  "Apply professional development patterns",
                  "Debug problems and think independently",
                  "Create a project for your portfolio",
                  "Know where to go on your learning journey",
                ].map((t) => (
                  <div key={t}>
                    <Check size={17} />
                    {t}
                  </div>
                ))}
              </div>
            </section>
            <section className="detail-section">
              <h2>A clear path, one lesson at a time.</h2>
              <p>
                3 sections · 9 focused lessons · {c.hours} hours of learning and
                practice
              </p>
              <Curriculum id={c.id} />
            </section>
            <section className="detail-section">
              <h2>Before you begin</h2>
              <p>
                {c.level === "Beginner"
                  ? "No previous experience needed. Bring a computer, a modern browser, and a little curiosity."
                  : c.level === "Intermediate"
                    ? "A basic understanding of programming and comfort using a code editor will help you get the most from this course."
                    : "Experience building projects and a working knowledge of data structures are recommended."}{" "}
                You can work through every lesson at your own pace.
              </p>
            </section>
            <section className="detail-section">
              <h2>Meet your guide</h2>
              <div className="instructor instructor-large">
                <span className={`avatar ${c.color}`}>{c.initials}</span>
                <div>
                  <h3>{c.instructor}</h3>
                  <span>Developer, educator & lifelong learner</span>
                </div>
              </div>
              <p>
                {c.instructor.split(" ")[0]} brings years of hands-on experience
                building software and helping people make sense of code. Expect
                clear explanations, thoughtful challenges, and practical advice.
              </p>
            </section>
            <section className="detail-section">
              <h2>Kind words from learners</h2>
              <div className="review">
                <div className="proof-stars">★★★★★</div>
                <p>
                  “The projects made everything click. I finally understand how
                  the concepts connect, and I have something real to show for
                  it.”
                </p>
                <strong>Jordan M.</strong>
                <small> · Course learner</small>
              </div>
              <div className="review">
                <div className="proof-stars">★★★★★</div>
                <p>
                  “Clear, well-paced lessons that fit around my working day. The
                  practical exercises were my favorite part.”
                </p>
                <strong>Taylor R.</strong>
                <small> · Course learner</small>
              </div>
              <p className="demo-note">
                Course content and reviews are illustrative demo data.
              </p>
            </section>
          </div>
          <aside className="enroll-panel">
            <Artwork course={c} />
            <div className="enroll-body">
              <div className="enroll-price">
                {state.enrolled.includes(c.id) ? (
                  <span className="enrolled-label">
                    <CheckCircle2 size={21} /> You’re enrolled
                  </span>
                ) : (
                  <>
                    <strong>{c.price ? "$" + c.price : "Free"}</strong>
                    <span>One course. Lasting possibilities.</span>
                  </>
                )}
              </div>
              <Enroll course={c} />
              <div className="save-inline">
                <SaveButton id={c.id} />
                <span>
                  {state.saved.includes(c.id)
                    ? "Saved to your collection"
                    : "Save for another day"}
                </span>
              </div>
              <hr />
              <h4>Your course includes</h4>
              <ul className="included">
                <li>
                  <Play size={16} />
                  {c.hours} hours of guided learning
                </li>
                <li>
                  <Code2 size={16} />
                  Hands-on practice projects
                </li>
                <li>
                  <BookOpen size={16} />9 focused lessons and resources
                </li>
                <li>
                  <Clock size={16} />
                  Learn at your own pace
                </li>
                <li>
                  <ShieldCheck size={16} />
                  Lifetime demo access
                </li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
      <section className="container section">
        <div className="section-heading">
          <div>
            <div className="eyebrow">KEEP YOUR CURIOSITY GOING</div>
            <h2>Your next learning adventure.</h2>
          </div>
        </div>
        <div className="course-grid featured-grid">
          {courses
            .filter((x) => x.id !== c.id)
            .slice(0, 3)
            .map((c) => (
              <CourseCard key={c.id} course={c} />
            ))}
        </div>
      </section>
    </>
  );
}
function Curriculum({
  id,
  active,
  workspace = false,
}: {
  id: string;
  active?: number;
  workspace?: boolean;
}) {
  const { state, toast } = useApp();
  return (
    <div className={`curriculum ${workspace ? "workspace-curriculum" : ""}`}>
      {sections.map((section, si) => (
        <details open={workspace || si === 0} key={section.title}>
          <summary>
            <span>
              <b>{String(si + 1).padStart(2, "0")}</b>
              {section.title}
            </span>
            <ChevronDown size={17} />
          </summary>
          <div>
            {section.lessons.map((l, li) => {
              const index = si * 3 + li;
              return (
                <Link
                  key={l}
                  className={`curriculum-lesson ${active === index ? "active" : ""}`}
                  to={
                    state.enrolled.includes(id)
                      ? `/learn/${id}/${index}`
                      : `/courses/${id}`
                  }
                  onClick={(e) => {
                    if (!state.enrolled.includes(id)) {
                      e.preventDefault();
                      toast(
                        "Enroll in this demo course to open its lessons. No payment needed.",
                      );
                    }
                  }}
                >
                  {state.progress[id]?.includes(index) ? (
                    <CheckCircle2 size={16} className="teal-text" />
                  ) : (
                    <Play size={14} />
                  )}
                  <span>{l}</span>
                  <small>{[8, 14, 22, 18, 26, 35, 24, 42, 9][index]}m</small>
                </Link>
              );
            })}
          </div>
        </details>
      ))}
    </div>
  );
}
function Dashboard() {
  const courses = usePublishedCourses();
  const { state, set, toast } = useApp();
  const [navOpen, setNavOpen] = useState(false);
  const [tab, setTab] = useState("overview");
  const enrolled = courses.filter((c) => state.enrolled.includes(c.id));
  const saved = courses.filter((c) => state.saved.includes(c.id));
  const completed = Object.values(state.progress).reduce(
    (n, v) => n + v.length,
    0,
  );
  return (
    <div className="container dashboard-layout page">
      <aside className={`dashboard-nav ${navOpen ? "expanded" : ""}`}>
        <button
          className="dashboard-nav-toggle"
          onClick={() => setNavOpen(!navOpen)}
        >
          <LayoutDashboard size={18} /> Your learning space{" "}
          <ChevronDown size={16} />
        </button>
        <div className="dashboard-nav-content">
          <div className="eyebrow">YOUR WORKSPACE</div>
          {[
            { id: "overview", label: "Overview", icon: LayoutDashboard },
            { id: "courses", label: "My courses", icon: BookOpen },
            { id: "saved", label: "Saved courses", icon: Bookmark },
          ].map((t) => (
            <button
              key={t.id}
              className={tab === t.id ? "active" : ""}
              onClick={() => {
                setTab(t.id);
                setNavOpen(false);
              }}
            >
              <t.icon size={18} />
              {t.label}
              {t.id === "saved" && <small>{saved.length}</small>}
            </button>
          ))}
          <div className="sidebar-note">
            <span>✦</span>
            <h4>Every little step counts.</h4>
            <p>Your future is built one lesson at a time.</p>
            <Link to="/courses">
              Find something new <ArrowRight size={14} />
            </Link>
          </div>
          {state.user && (
            <button
              onClick={() => {
                set((s) => ({ ...s, user: "" }));
                toast("Signed out of your demo session");
              }}
            >
              <LogOut size={17} /> Log out
            </button>
          )}
        </div>
      </aside>
      <div className="dashboard-content">
        <div className="eyebrow">YOUR NEXT CHAPTER IS WAITING</div>
        <h1>
          {tab === "saved"
            ? "Your little collection."
            : tab === "courses"
              ? "Keep the momentum."
              : `Welcome ${state.user ? "back, " + state.user.split(" ")[0] : "to your learning space"}.`}
        </h1>
        <p className="page-intro">
          {tab === "saved"
            ? "Good things to come back to, whenever you’re ready."
            : "A little progress today. A world of possibilities tomorrow."}
        </p>
        {tab === "overview" && (
          <>
            <div className="dashboard-stats">
              {[
                {
                  icon: BookOpen,
                  value: enrolled.length,
                  label: "Courses enrolled",
                },
                {
                  icon: CheckCircle2,
                  value: completed,
                  label: "Lessons completed",
                },
                {
                  icon: Clock,
                  value: (completed * 0.3).toFixed(1),
                  label: "Hours of learning",
                },
              ].map((s) => (
                <div key={s.label}>
                  <span className="preview-icon lavender">
                    <s.icon size={21} />
                  </span>
                  <strong>{s.value}</strong>
                  <small>{s.label}</small>
                </div>
              ))}
            </div>
            <div className="dashboard-section-heading">
              <h2>Pick up where you left off</h2>
              <span>Your pace. Your path.</span>
            </div>
          </>
        )}
        {tab !== "saved" &&
          (enrolled.length ? (
            <div className="enrolled-list">
              {enrolled.map((c) => (
                <article className="enrolled-course" key={c.id}>
                  <Link to={"/courses/" + c.id}>
                    <Artwork course={c} compact />
                  </Link>
                  <div className="enrolled-info">
                    <span className="eyebrow">{c.category}</span>
                    <h3>
                      <Link to={"/courses/" + c.id}>{c.title}</Link>
                    </h3>
                    <div className="progress-label">
                      <span>
                        {state.progress[c.id]?.length || 0} of {lessons.length}{" "}
                        lessons completed
                      </span>
                      <b>{progressFor(state, c.id)}%</b>
                    </div>
                    <div className="progress-track">
                      <i style={{ width: progressFor(state, c.id) + "%" }} />
                    </div>
                    <Link to={continuePath(state, c.id)} className="text-link">
                      {progressFor(state, c.id) === 100
                        ? "Revisit course"
                        : "Continue learning"}{" "}
                      <ArrowRight size={16} />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty dashboard-empty">
              <BookOpen size={32} />
              <h2>Every journey has a first lesson.</h2>
              <p>
                Find a course that sparks your curiosity and make a little time
                for you.
              </p>
              <Link className="button primary" to="/courses">
                Explore courses <ArrowRight size={16} />
              </Link>
            </div>
          ))}
        {tab === "overview" && (
          <div className="activity-panel">
            <div>
              <h3>Your week in learning</h3>
              <p>
                {completed
                  ? "Look at you, making progress."
                  : "A fresh week of possibilities."}
              </p>
            </div>
            <div
              className="activity-chart"
              aria-label={`Weekly activity: ${completed} lessons completed today`}
            >
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d, i) => {
                const today = (new Date().getDay() + 6) % 7;
                return (
                  <div key={d}>
                    <span
                      className={today === i ? "today" : ""}
                      style={{
                        height: `${today === i ? Math.max(4, Math.min(80, completed * 14)) : 4}px`,
                      }}
                    />
                    <small>{d}</small>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {tab !== "courses" && (
          <>
            <div className="dashboard-section-heading">
              <h2>Saved for your next chapter</h2>
              <Link className="text-link" to="/courses">
                Discover more <ArrowRight size={15} />
              </Link>
            </div>
            {saved.length ? (
              <div className="course-grid dashboard-saved">
                {saved.map((c) => (
                  <CourseCard key={c.id} course={c} />
                ))}
              </div>
            ) : (
              <div className="saved-empty">
                <Bookmark size={23} />
                <div>
                  <h3>A home for your “one day” courses.</h3>
                  <p>Tap the bookmark on any course to keep it here.</p>
                </div>
                <Link to="/courses" className="text-link">
                  Find your next course <ArrowRight size={15} />
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
function Workspace() {
  const courses = usePublishedCourses();
  const { id, lesson } = useParams();
  const { state, set, toast } = useApp();
  const [sidebar, setSidebar] = useState(true);
  const c = courses.find((c) => c.id === id);
  const index = Number(lesson);
  const nav = useNavigate();
  if (!c || !Number.isInteger(index) || index < 0 || index >= lessons.length)
    return <NotFound />;
  if (!state.enrolled.includes(c.id))
    return (
      <div className="container empty">
        <BookOpen size={38} />
        <h1>Your next chapter starts here.</h1>
        <p>
          Enroll in {c.title} to open the workspace. Demo enrollment is free.
        </p>
        <div style={{ maxWidth: 320, margin: "24px auto" }}>
          <Enroll course={c} />
        </div>
      </div>
    );
  const done = state.progress[c.id]?.includes(index);
  return (
    <div className={`workspace ${sidebar ? "" : "sidebar-hidden"}`}>
      <aside className="lesson-sidebar">
        <Link className="text-link" to="/dashboard">
          <ArrowLeft size={15} /> Back to my learning
        </Link>
        <h2>{c.title}</h2>
        <div className="progress-label">
          <span>Your progress</span>
          <b>{progressFor(state, c.id)}%</b>
        </div>
        <div className="progress-track">
          <i style={{ width: progressFor(state, c.id) + "%" }} />
        </div>
        <Curriculum id={c.id} workspace active={index} />
      </aside>
      <div className="lesson-main">
        <div className="lesson-toolbar">
          <button
            className="icon-button"
            aria-label={sidebar ? "Hide curriculum" : "Show curriculum"}
            onClick={() => setSidebar(!sidebar)}
          >
            {sidebar ? (
              <PanelLeftClose size={20} />
            ) : (
              <PanelLeftOpen size={20} />
            )}
          </button>
          <span>
            SECTION {Math.floor(index / 3) + 1} · LESSON {index + 1} OF{" "}
            {lessons.length}
          </span>
          <Link to={"/courses/" + c.id}>
            Course overview <ArrowUpRight size={15} />
          </Link>
        </div>
        <div className="lesson-content">
          <div className="eyebrow">
            {c.tech} · {sections[Math.floor(index / 3)].title}
          </div>
          <h1>{lessons[index]}</h1>
          <div className="video-placeholder">
            <div className="video-icon">
              <Play size={30} />
            </div>
            <h3>A space for focused learning.</h3>
            <p>
              This demo uses a written lesson instead of a video.
              <br />
              Everything you need to get started is just below.
            </p>
            <span>
              <BookOpen size={14} /> Reading lesson · 8 min
            </span>
          </div>
          <div className="lesson-article">
            <h2>
              {index === 0
                ? "Small beginnings. Real possibilities."
                : lessons[index]}
            </h2>
            <p>
              Welcome to {c.title}. {c.description} In this lesson, we’ll take
              one idea, make sense of it, and turn it into something you can
              use.
            </p>
            <h3>Start with a clear mental model</h3>
            <p>
              {c.category === "Design"
                ? "A useful interface helps people understand where they are and what they can do next. Begin with a clear visual hierarchy: one primary heading, a supporting explanation, and an obvious next action."
                : c.category === "Data Science"
                  ? "Good data work starts with a question. Decide what you want to understand, inspect the structure of your data, and check for missing values before jumping into analysis."
                  : "Think of a program as a sequence of small, deliberate decisions. Give each piece one clear responsibility. Start with the simplest version that works, then improve it one step at a time."}
            </p>
            <div className="lesson-callout">
              <span>✦</span>
              <div>
                <strong>Make it yours</strong>
                <p>
                  Don’t just read the example. Change a value, predict what will
                  happen, and run it again. The moment you start experimenting
                  is the moment you start learning.
                </p>
              </div>
            </div>
            <h3>A small example to build on</h3>
            <pre>
              <code>
                {c.tech === "Python" || c.id === "data"
                  ? 'def learning_progress(completed, total):\n    return round((completed / total) * 100)\n\nprogress = learning_progress(3, 9)\nprint(f"You are {progress}% of the way there!")'
                  : c.id === "sql"
                    ? "SELECT category, COUNT(*) AS courses\nFROM learning_library\nGROUP BY category\nORDER BY courses DESC;"
                    : 'const learningPath = {\n  goal: "Build something meaningful",\n  completed: 3,\n  total: 9,\n};\n\nconst progress = Math.round(\n  (learningPath.completed / learningPath.total) * 100\n);\n\nconsole.log(`You’re ${progress}% of the way there!`);'}
              </code>
            </pre>
            <h3>Your turn</h3>
            <p>
              {c.id === "sql"
                ? "Add a filter to include only beginner courses, then compare the results."
                : c.tech === "Python" || c.id === "data"
                  ? "Change the completed lesson count to 5. What does the function return? Then add a guard for a total of zero."
                  : "Change the completed count to 5 and calculate the new percentage. Then think about how you would display a different message when all lessons are complete."}{" "}
              Write down what changed and why.
            </p>
            <p>
              Before moving on, explain the idea in your own words. If you can
              teach it simply, you’re building a foundation that lasts.
            </p>
          </div>
          <div className="lesson-complete">
            <div>
              <h3>
                {done
                  ? "A step worth celebrating."
                  : "Ready for the next step?"}
              </h3>
              <p>
                {done
                  ? "This lesson is marked complete. Keep that momentum."
                  : "Take a moment to reflect, then mark this lesson complete."}
              </p>
            </div>
            <button
              className={`button ${done ? "secondary" : "primary"}`}
              onClick={() => {
                set((s) => ({
                  ...s,
                  progress: {
                    ...s.progress,
                    [c.id]: done
                      ? (s.progress[c.id] || []).filter((n) => n !== index)
                      : [...(s.progress[c.id] || []), index],
                  },
                }));
                toast(
                  done
                    ? "Lesson marked incomplete"
                    : "Lesson complete. Small steps, real progress!",
                );
              }}
            >
              <CheckCircle2 size={17} />
              {done ? "Completed · Undo" : "Mark Complete"}
            </button>
          </div>
          <div className="lesson-navigation">
            <button
              className="button secondary"
              disabled={index === 0}
              onClick={() => nav(`/learn/${c.id}/${index - 1}`)}
            >
              <ArrowLeft size={16} /> Previous lesson
            </button>
            {index < lessons.length - 1 ? (
              <button
                className="button primary"
                onClick={() => nav(`/learn/${c.id}/${index + 1}`)}
              >
                Next lesson <ArrowRight size={16} />
              </button>
            ) : (
              <Link className="button primary" to="/dashboard">
                Back to dashboard <ArrowRight size={16} />
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
function Auth({ signup = false }: { signup?: boolean }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { set, toast } = useApp();
  const nav = useNavigate();<form onSubmit={submit} noValidate></form>
  async function submit(e: React.FormEvent) {
  e.preventDefault();

  const next: Record<string, string> = {};

  if (signup && name.trim().length < 2) {
    next.name = "enter your name.";
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    next.email = "enter your email.";
  }

  if (password.length < 8) {
    next.password = "password should be at least 8 characters.";
  }

  setErrors(next);
  if (Object.keys(next).length > 0) return;

if (!signup) {
  try {
    const response = await fetch(
      "http://localhost:8080/api/auth/login",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      }
    );

    if (!response.ok) {
      setErrors({ submit: "Login amalga oshmadi." });
      return;
    }

  set((s) => ({ ...s, user: email.split("@")[0] }));
  setPassword("");
  nav("/dashboard");
  } catch {
    setErrors({ submit: "Backendga ulanib bo‘lmadi." });
  }

  return;
}
  try {
    const response = await fetch(
      "http://localhost:8080/api/auth/register",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email,
          password,
        }),
      }
    );

    if (!response.ok) {
      setErrors({ submit: "an error occured while registering" });
      return;
    }

    setPassword("");
    toast("You have successfully registered. Please log in now.");
    nav("/signin");
  } catch {
    setErrors({ submit: "could not connect to the backend" });
  }
}
  return (
    <section className="auth-page container" key={signup ? "signup" : "signin"}>
      <div className="auth-story">
        <div className="eyebrow">A LITTLE CURIOSITY GOES A LONG WAY</div>
        <h1>
          {signup
            ? "Your next chapter\nstarts with you."
            : "Good to have\nyou back."}
        </h1>
        <p>
          A calm space to learn, build, and become.
          <br />
          One small step at a time.
        </p>
        <div className="auth-art">
          <Code2 size={100} />
          <span>learn. build. become.</span>
        </div>
        <div className="social-proof">
          <span className="avatar purple">
            <Users size={19} />
          </span>
          <p>In good company with 25,000+ learners.</p>
        </div>
      </div>
      <div className="auth-card">
        <span className="category-icon purple">
          <GraduationCap size={25} />
        </span>
        <h2>{signup ? "Find your path." : "Welcome back."}</h2>
        <p>
          {signup
            ? "Try your own learning space."
            : "Pick up where your curiosity left off."}
        </p>
        <form onSubmit={submit} noValidate>
        {errors.submit && (
          <p className="form-error" role="alert">
            {errors.submit}
          </p>
)}
          {signup && (
            <label>
              Your name
              <input
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alex Morgan"
                aria-invalid={!!errors.name}
                aria-describedby="name-error"
              />
              {errors.name && (
                <small className="form-error" id="name-error">
                  {errors.name}
                </small>
              )}
            </label>
          )}
          <label>
            Email address
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              aria-invalid={!!errors.email}
              aria-describedby="email-error"
            />
            {errors.email && (
              <small className="form-error" id="email-error">
                {errors.email}
              </small>
            )}
          </label>
          <label>
            Password
            <div className="password-input">
              <input
                type={visible ? "text" : "password"}
                autoComplete={signup ? "new-password" : "current-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                aria-invalid={!!errors.password}
                aria-describedby="password-error"
              />
              <button
                type="button"
                aria-label={visible ? "Hide password" : "Show password"}
                onClick={() => setVisible(!visible)}
              >
                {visible ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && (
              <small className="form-error" id="password-error">
                {errors.password}
              </small>
            )}
          </label>
          <button className="button primary full" type="submit">
            {signup ? "Sign in" : "Log in"}{" "}
            <ArrowRight size={17} />
          </button>
        </form>
        <p className="auth-switch">
          {signup ? "Already exploring?" : "New around here?"}{" "}
          <Link to={signup ? "/signin" : "/signup"}>
            {signup ? "Log in" : "Sign in"}
          </Link>
        </p>
        <p className="demo-note">
          No payment, email verification, or real credentials needed. Use a
          made-up password.
        </p>
      </div>
    </section>
  );
}
function NotFound() {
  return (
    <div className="container empty">
      <h1>This path hasn’t been built yet.</h1>
      <Link className="button primary" to="/courses">
        Explore courses
      </Link>
    </div>
  );
}
function Footer() {
  return (
    <footer>
      <div className="container footer-top">
        <div>
          <Logo />
          <p>A little progress. A world of possibilities.</p>
        </div>
        <div className="footer-links">
          <Link to="/courses">Explore courses</Link>
          <Link to="/dashboard">My learning</Link>
          <Link to="/signup">
            Start your journey <ArrowUpRight size={14} />
          </Link>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>
          © {new Date().getFullYear()} DevPath. Made for your next chapter.
        </span>
        <span>
          Thoughtfully built. Always learning.{" "}
          <span className="footer-spark">✦</span>
        </span>
      </div>
    </footer>
  );
}
