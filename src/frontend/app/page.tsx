"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";
import type { DocDetail, DocSummary, User } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { DocList } from "@/components/doc-list";

export default function Dashboard() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [user, setUser] = useState<User | null>(null);
  const [docs, setDocs] = useState<DocSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [me, list] = await Promise.all([
        api<User>("/auth/me"),
        api<DocSummary[]>("/documents"),
      ]);
      setUser(me);
      setDocs(list);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        router.replace("/login");
        return;
      }
      setError(err instanceof ApiError ? err.message : "Could not load documents");
    }
  }, [router]);

  useEffect(() => {
    void load();
  }, [load]);

  async function createDoc() {
    setBusy(true);
    try {
      const doc = await api<DocDetail>("/documents", {
        method: "POST",
        json: { title: "Untitled" },
      });
      router.push(`/docs/${doc.id}`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not create document");
      setBusy(false);
    }
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    setBusy(true);
    try {
      const doc = await api<DocDetail>("/uploads", { method: "POST", body: fd });
      router.push(`/docs/${doc.id}`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Upload failed");
      setBusy(false);
    }
  }

  async function logout() {
    try {
      await api("/auth/logout", { method: "POST" });
    } catch {
      /* ignore */
    }
    router.replace("/login");
  }

  const owned = docs?.filter((d) => d.access === "owner") ?? [];
  const shared = docs?.filter((d) => d.access !== "owner") ?? [];

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Ajaia Docs</h1>
          {user && <p className="text-sm text-neutral-500">{user.name} · {user.email}</p>}
        </div>
        <Button variant="outline" onClick={logout}>
          Sign out
        </Button>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={createDoc} disabled={busy}>
          New Document
        </Button>
        <Button variant="outline" onClick={() => fileRef.current?.click()} disabled={busy}>
          Upload
        </Button>
        <span className="text-xs text-neutral-500">Supported: .txt, .md</span>
        <input
          ref={fileRef}
          type="file"
          accept=".txt,.md"
          className="hidden"
          onChange={onFile}
        />
      </div>

      {error ? (
        <div className="flex items-center justify-between rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <span>{error}</span>
          <Button variant="outline" onClick={() => void load()}>
            Retry
          </Button>
        </div>
      ) : docs === null ? (
        <p className="text-sm text-neutral-500">Loading…</p>
      ) : (
        <>
          <DocList
            title="Owned by me"
            docs={owned}
            emptyText="You haven't created any documents yet. Click New Document to start."
          />
          <DocList
            title="Shared with me"
            docs={shared}
            shared
            emptyText="Nothing has been shared with you yet."
          />
        </>
      )}
    </main>
  );
}
