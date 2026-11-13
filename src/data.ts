export type Course = {
  imageUrl?: string;
  id: string;
  title: string;
  category: string;
  level: string;
  price: number;
  rating: number;
  students: number;
  hours: number;
  instructor: string;
  initials: string;
  color: string;
  tech: string;
  description: string;
};
export const courses: Course[] = [
  {
    id: "react",
    title: "React: From Zero to Production",
    category: "Web Development",
    level: "Intermediate",
    price: 49,
    rating: 4.9,
    students: 12480,
    hours: 24,
    instructor: "Sarah Chen",
    initials: "SC",
    color: "blue",
    tech: "React",
    description:
      "Build beautiful, production-ready applications with modern React. Master components, hooks, state, and the patterns that bring it all together.",
  },
  {
    id: "python",
    title: "Python for the Real World",
    category: "Programming",
    level: "Beginner",
    price: 39,
    rating: 4.9,
    students: 18620,
    hours: 18,
    instructor: "Alex Morgan",
    initials: "AM",
    color: "sage",
    tech: "Python",
    description:
      "Turn your curiosity into working code. Learn Python by building useful tools, automating everyday tasks, and solving real problems.",
  },
  {
    id: "ui",
    title: "UI Design for Developers",
    category: "Design",
    level: "Beginner",
    price: 45,
    rating: 4.8,
    students: 8240,
    hours: 16,
    instructor: "Emma Wilson",
    initials: "EW",
    color: "purple",
    tech: "UI / UX",
    description:
      "Develop an eye for great interfaces. Explore typography, color, spacing, and accessible design through practical projects.",
  },
  {
    id: "javascript",
    title: "JavaScript: The Complete Path",
    category: "Web Development",
    level: "Beginner",
    price: 0,
    rating: 4.8,
    students: 24300,
    hours: 28,
    instructor: "Daniel Park",
    initials: "DP",
    color: "gold",
    tech: "JavaScript",
    description:
      "Build a strong foundation in the language of the web, from your first variable to asynchronous applications.",
  },
  {
    id: "node",
    title: "Build APIs with Node.js",
    category: "Web Development",
    level: "Intermediate",
    price: 59,
    rating: 4.7,
    students: 7600,
    hours: 22,
    instructor: "James Okafor",
    initials: "JO",
    color: "sage",
    tech: "Node.js",
    description:
      "Understand server-side JavaScript and design reliable APIs with practical, guided projects.",
  },
  {
    id: "typescript",
    title: "Confident TypeScript",
    category: "Programming",
    level: "Intermediate",
    price: 35,
    rating: 4.9,
    students: 9100,
    hours: 12,
    instructor: "Sarah Chen",
    initials: "SC",
    color: "blue",
    tech: "TypeScript",
    description:
      "Write expressive, maintainable code with types, generics, and the tools professional teams use.",
  },
  {
    id: "data",
    title: "Data Science with Python",
    category: "Data Science",
    level: "Intermediate",
    price: 69,
    rating: 4.8,
    students: 11300,
    hours: 32,
    instructor: "Priya Patel",
    initials: "PP",
    color: "purple",
    tech: "Data Science",
    description:
      "Find meaningful stories in data using pandas, visualization, and hands-on analysis.",
  },
  {
    id: "git",
    title: "Git & GitHub Essentials",
    category: "Tools & DevOps",
    level: "Beginner",
    price: 0,
    rating: 4.8,
    students: 16700,
    hours: 6,
    instructor: "Alex Morgan",
    initials: "AM",
    color: "coral",
    tech: "Git",
    description:
      "Version your projects with confidence and collaborate with a clear, practical Git workflow.",
  },
  {
    id: "css",
    title: "Modern CSS & Responsive Layouts",
    category: "Web Development",
    level: "Beginner",
    price: 29,
    rating: 4.7,
    students: 13500,
    hours: 14,
    instructor: "Emma Wilson",
    initials: "EW",
    color: "purple",
    tech: "CSS",
    description:
      "Create layouts that feel at home on every screen using Grid, Flexbox, and modern CSS.",
  },
  {
    id: "algorithms",
    title: "Algorithms & Problem Solving",
    category: "Programming",
    level: "Advanced",
    price: 79,
    rating: 4.9,
    students: 6400,
    hours: 36,
    instructor: "Daniel Park",
    initials: "DP",
    color: "gold",
    tech: "Algorithms",
    description:
      "Build a toolkit for solving complex problems with efficient data structures and algorithms.",
  },
  {
    id: "docker",
    title: "Docker for Everyday Development",
    category: "Tools & DevOps",
    level: "Intermediate",
    price: 39,
    rating: 4.6,
    students: 5200,
    hours: 10,
    instructor: "James Okafor",
    initials: "JO",
    color: "blue",
    tech: "Docker",
    description:
      "Package your applications and build consistent development environments with containers.",
  },
  {
    id: "sql",
    title: "SQL: Make Data Work for You",
    category: "Data Science",
    level: "Beginner",
    price: 0,
    rating: 4.8,
    students: 15200,
    hours: 12,
    instructor: "Priya Patel",
    initials: "PP",
    color: "sage",
    tech: "SQL",
    description:
      "Ask better questions of your data with practical queries, joins, and database fundamentals.",
  },
];
export const sections = [
  {
    title: "Getting started",
    lessons: [
      "Welcome to your learning path",
      "Setting up your workspace",
      "Your first working project",
    ],
  },
  {
    title: "The foundations",
    lessons: [
      "Understanding the core concepts",
      "Working with real-world data",
      "Practice: build something useful",
    ],
  },
  {
    title: "Putting it into practice",
    lessons: [
      "Patterns that scale",
      "Project: bring it all together",
      "Your next steps",
    ],
  },
];
export const lessons = sections.flatMap((s) => s.lessons);
