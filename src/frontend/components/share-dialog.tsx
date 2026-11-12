"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";
import type { Share, ShareRole } from "@/lib/types";
import { Button } from "@/components/ui/button";

const inputCls =
  "rounded border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900";

export function ShareDialog({ docId, onClose }: { docId: string; onClose: () => void }) {
  const [shares, setShares] = useState<Share[] | null>(null);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<ShareRole>("editor");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = await api<Share[]>(`/documents/${docId}/shares`);
      setShares(Array.isArray(r) ? r : []);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not load shares");
      setShares([]);
    }
  }, [docId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await api(`/documents/${docId}/shares`, { method: "POST", json: { email, role } });
      setEmail("");
      toast.success("Shared");
      await load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not share");
    } finally {
      setBusy(false);
    }
  }

  async function remove(userId: string) {
    try {
      await api(`/documents/${docId}/shares/${userId}`, { method: "DELETE" });
      await load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not remove");
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded bg-white p-5 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Share document</h2>
          <button type="button" aria-label="Close" onClick={onClose} className="px-2 text-xl">
            ×
          </button>
        </div>

        <form onSubmit={add} className="flex gap-2">
          <input
            className={`${inputCls} min-w-0 flex-1`}
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <select
            className={inputCls}
            value={role}
            onChange={(e) => setRole(e.target.value as ShareRole)}
          >
            <option value="editor">Editor</option>
            <option value="viewer">Viewer</option>
          </select>
          <Button type="submit" disabled={busy}>
            Share
          </Button>
        </form>

        <h3 className="mb-2 mt-5 text-xs font-semibold uppercase tracking-wide text-neutral-500">
          People with access
        </h3>
        {shares === null ? (
          <p className="text-sm text-neutral-500">Loading…</p>
        ) : shares.length === 0 ? (
          <p className="text-sm text-neutral-500">Not shared with anyone yet.</p>
        ) : (
          <ul className="divide-y rounded border border-neutral-200">
            {shares.map((s) => (
              <li key={s.user.id} className="flex items-center justify-between gap-2 px-3 py-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{s.user.name}</p>
                  <p className="truncate text-xs text-neutral-500">
                    {s.user.email} · {s.role}
                  </p>
                </div>
                <Button type="button" variant="outline" onClick={() => void remove(s.user.id)}>
                  Remove
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
