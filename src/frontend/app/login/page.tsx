"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";
import type { User } from "@/lib/types";
import { Button } from "@/components/ui/button";

const DEMO = [
  { label: "Alice", email: "alice@example.com" },
  { label: "Bob", email: "bob@example.com" },
  { label: "Carol", email: "carol@example.com" },
];

const inputCls =
  "w-full rounded border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api<User>("/auth/me")
      .then(() => router.replace("/"))
      .catch(() => {});
  }, [router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await api<User>(`/auth/${mode}`, {
        method: "POST",
        json: mode === "register" ? { name, email, password } : { email, password },
      });
      router.replace("/");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-4">
      <div>
        <h1 className="text-2xl font-semibold">Ajaia Docs</h1>
        <p className="text-sm text-neutral-500">
          {mode === "login" ? "Sign in to continue" : "Create an account"}
        </p>
      </div>

      <form onSubmit={submit} className="flex flex-col gap-3">
        {mode === "register" && (
          <input
            className={inputCls}
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        )}
        <input
          className={inputCls}
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          className={inputCls}
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <Button type="submit" disabled={busy}>
          {busy ? "Please wait…" : mode === "login" ? "Sign in" : "Register"}
        </Button>
      </form>

      <button
        type="button"
        className="text-left text-sm text-neutral-600 underline"
        onClick={() => setMode(mode === "login" ? "register" : "login")}
      >
        {mode === "login" ? "No account? Register" : "Have an account? Sign in"}
      </button>

      {mode === "login" && (
        <div className="flex flex-col gap-2 border-t pt-4">
          <p className="text-xs text-neutral-500">Demo users (password: password123)</p>
          <div className="flex gap-2">
            {DEMO.map((d) => (
              <Button
                key={d.label}
                type="button"
                variant="outline"
                onClick={() => {
                  setEmail(d.email);
                  setPassword("password123");
                }}
              >
                {d.label}
              </Button>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
