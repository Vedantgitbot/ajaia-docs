import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { DocSummary } from "@/lib/types";

function fmt(iso: string) {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? "" : d.toLocaleString();
}

export function DocList({
  title,
  docs,
  emptyText,
  shared = false,
}: {
  title: string;
  docs: DocSummary[];
  emptyText: string;
  shared?: boolean;
}) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
        {title} ({docs.length})
      </h2>
      {docs.length === 0 ? (
        <p className="rounded border border-dashed border-neutral-300 px-4 py-6 text-sm text-neutral-500">
          {emptyText}
        </p>
      ) : (
        <ul className="divide-y rounded border border-neutral-200">
          {docs.map((d) => (
            <li key={d.id}>
              <Link
                href={`/docs/${d.id}`}
                className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-neutral-50"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{d.title || "Untitled"}</p>
                  <p className="text-xs text-neutral-500">
                    {shared ? `Owner: ${d.owner.name} · ` : ""}
                    Updated {fmt(d.updated_at)}
                  </p>
                </div>
                {shared && <Badge role={d.access} />}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
