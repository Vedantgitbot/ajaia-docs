"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";
import type { DocDetail } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Toolbar } from "@/components/toolbar";
import { ShareDialog } from "@/components/share-dialog";

type SaveState = "saved" | "saving" | "error";
type Pending = { title?: string; content?: Record<string, unknown> };

function EditorView({ doc }: { doc: DocDetail }) {
  const router = useRouter();
  const readOnly = doc.access === "viewer";
  const [title, setTitle] = useState(doc.title);
  const [status, setStatus] = useState<SaveState>("saved");
  const [conflict, setConflict] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  const version = useRef(doc.version);
  const pending = useRef<Pending>({});
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inflight = useRef(false);
  const conflictRef = useRef(false);

  async function flush(): Promise<void> {
    if (inflight.current || conflictRef.current) return;
    const body = pending.current;
    if (body.title === undefined && body.content === undefined) return;
    pending.current = {};
    inflight.current = true;
    setStatus("saving");
    try {
      const updated = await api<DocDetail>(`/documents/${doc.id}`, {
        method: "PATCH",
        json: { version: version.current, ...body },
      });
      version.current = updated.version;
      inflight.current = false;
      if (pending.current.title !== undefined || pending.current.content !== undefined) {
        await flush();
      } else {
        setStatus("saved");
      }
    } catch (err) {
      inflight.current = false;
      if (err instanceof ApiError && err.status === 409) {
        conflictRef.current = true;
        setConflict(true);
        setStatus("error");
        return;
      }
      pending.current = { ...body, ...pending.current };
      setStatus("error");
      toast.error(err instanceof ApiError ? err.message : "Save failed");
    }
  }

  function schedule() {
    if (readOnly) return;
    if (timer.current) clearTimeout(timer.current);
    setStatus("saving");
    timer.current = setTimeout(() => void flush(), 1000);
  }

  const hasContent = doc.content && Object.keys(doc.content).length > 0;
  const editor = useEditor({
    extensions: [StarterKit],
    content: hasContent ? doc.content : undefined,
    editable: !readOnly,
    immediatelyRender: false,
    editorProps: { attributes: { class: "tiptap-content" } },
    onUpdate: ({ editor: ed }) => {
      pending.current.content = ed.getJSON();
      schedule();
    },
  });

  function onTitle(v: string) {
    setTitle(v);
    pending.current.title = v;
    schedule();
  }

  async function goBack() {
    if (timer.current) clearTimeout(timer.current);
    await flush();
    router.push("/");
  }

  async function remove() {
    if (!window.confirm("Delete this document? This cannot be undone.")) return;
    try {
      await api(`/documents/${doc.id}`, { method: "DELETE" });
      router.push("/");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not delete");
    }
  }

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-6">
      <div className="flex items-center justify-between gap-2">
        <Button variant="outline" onClick={() => void goBack()}>
          ← Documents
        </Button>
        <div className="flex items-center gap-3">
          {readOnly ? (
            <Badge role="viewer" />
          ) : (
            <span className="text-sm text-neutral-500" aria-live="polite">
              {status === "saving" ? "Saving…" : status === "saved" ? "Saved" : "Not saved"}
            </span>
          )}
          {doc.access === "owner" && (
            <>
              <Button onClick={() => setShareOpen(true)}>Share</Button>
              <Button variant="outline" onClick={() => void remove()}>
                Delete
              </Button>
            </>
          )}
        </div>
      </div>

      {conflict && (
        <div className="flex items-center justify-between rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <span>Changed elsewhere, reload</span>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Reload
          </Button>
        </div>
      )}

      <input
        className="w-full border-b border-transparent px-1 py-1 text-3xl font-semibold outline-none hover:border-neutral-200 focus:border-neutral-400 disabled:bg-transparent"
        value={title}
        placeholder="Untitled"
        readOnly={readOnly}
        disabled={readOnly}
        onChange={(e) => onTitle(e.target.value)}
        onBlur={() => {
          if (!readOnly && title.trim() === "") onTitle("Untitled");
        }}
        aria-label="Document title"
      />

      {!readOnly && editor && <Toolbar editor={editor} />}
      <div className="rounded border border-neutral-200 p-4">
        <EditorContent editor={editor} />
      </div>

      {shareOpen && <ShareDialog docId={doc.id} onClose={() => setShareOpen(false)} />}
    </main>
  );
}

export default function DocPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [doc, setDoc] = useState<DocDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<DocDetail>(`/documents/${id}`)
      .then(setDoc)
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) {
          router.replace("/login");
          return;
        }
        setError(err instanceof ApiError ? err.message : "Could not load document");
      });
  }, [id, router]);

  if (error) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-8">
        <p className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
        <Button variant="outline" className="mt-4" onClick={() => router.push("/")}>
          ← Documents
        </Button>
      </main>
    );
  }
  if (!doc) {
    return <p className="mx-auto max-w-3xl px-4 py-8 text-sm text-neutral-500">Loading…</p>;
  }
  return <EditorView doc={doc} />;
}
