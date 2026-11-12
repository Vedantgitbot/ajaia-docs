import { cn } from "@/lib/utils";

const styles: Record<string, string> = {
  owner: "bg-neutral-900 text-white",
  editor: "bg-blue-100 text-blue-800",
  viewer: "bg-neutral-100 text-neutral-700",
};

export function Badge({ role, className }: { role: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-block rounded px-2 py-0.5 text-xs font-medium capitalize",
        styles[role] ?? styles.viewer,
        className,
      )}
    >
      {role}
    </span>
  );
}
