export type Access = "owner" | "editor" | "viewer";
export type ShareRole = "editor" | "viewer";

export type User = { id: string; email: string; name: string };

export type DocSummary = {
  id: string;
  title: string;
  owner: { name: string; email: string };
  updated_at: string;
  access: Access;
};

export type DocDetail = DocSummary & {
  content: Record<string, unknown>;
  version: number;
};

export type Share = {
  user: { id: string; name: string; email: string };
  role: ShareRole;
};
