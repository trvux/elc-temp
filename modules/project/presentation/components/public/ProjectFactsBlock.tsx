import { buildFactRows, hasTypedFacts } from "../../../domain/facts-display";
import type { ProjectWithCategory } from "../../../domain/types";

// The standard "Thông tin dự án" block, generated from typed columns so every
// project shows the same labels in the same order (it replaces the hand-typed
// table inside the article body, which differed on 6 label variants). Renders
// nothing until the project has typed facts, so projects that still carry the
// old in-body table are not duplicated.
export function ProjectFactsBlock({ project }: { project: ProjectWithCategory }) {
  if (!hasTypedFacts(project.facts)) return null;
  const rows = buildFactRows(project);
  if (rows.length === 0) return null;

  return (
    <section aria-labelledby="project-facts-heading" className="mb-8">
      <h2 id="project-facts-heading" className="type-heading mb-4">
        Thông tin dự án
      </h2>
      <dl className="grid grid-cols-1 sm:grid-cols-[minmax(0,12rem)_1fr] gap-x-6 gap-y-3 border-y border-border/60 py-4">
        {rows.map((r) => (
          <div key={r.label} className="contents">
            <dt className="type-body-sm text-muted-foreground">{r.label}</dt>
            <dd className="type-body">{r.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
