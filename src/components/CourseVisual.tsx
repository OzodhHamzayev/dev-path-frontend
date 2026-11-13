import { useState } from "react";
import { Code2 } from "lucide-react";

export function CourseVisual({
  title,
  tech,
  color,
  compact = false,
  imageUrl,
}: {
  title: string;
  tech: string;
  color: string;
  compact?: boolean;
  imageUrl?: string;
}) {
  const [failedUrl, setFailedUrl] = useState<string>();
  if (imageUrl && imageUrl !== failedUrl) return (
    <div className={`admin-course-visual ${color} ${compact ? "is-compact" : ""}`}>
      <img className="course-cover-image" src={imageUrl} alt={`${title} cover`} onError={() => setFailedUrl(imageUrl)} />
    </div>
  );
  return (
    <div
      className={`admin-course-visual ${color} ${compact ? "is-compact" : ""}`}
      aria-label={`${title} cover`}
    >
      <span className="admin-visual-grid" />
      <span className="admin-visual-orbit" />
      <Code2 size={compact ? 24 : 64} aria-hidden="true" />
      {!compact && <span>{tech || "Your next chapter"}</span>}
    </div>
  );
}
