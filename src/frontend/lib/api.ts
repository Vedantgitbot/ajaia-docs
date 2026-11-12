export class ApiError extends Error {
  status: number;
  details?: unknown;
  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

type ErrorBody = { error?: { message?: string; details?: unknown } } | null;

export async function api<T = unknown>(
  path: string,
  init: RequestInit & { json?: unknown } = {},
): Promise<T> {
  const { json, headers, ...rest } = init;
  const isForm = rest.body instanceof FormData;

  const res = await fetch(`/api${path}`, {
    ...rest,
    credentials: "include",
    headers: {
      ...(json !== undefined && !isForm ? { "Content-Type": "application/json" } : {}),
      ...headers,
    },
    body: json !== undefined ? JSON.stringify(json) : rest.body,
  });

  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }

  if (!res.ok) {
    const err = (data as ErrorBody)?.error;
    throw new ApiError(res.status, err?.message ?? res.statusText ?? "Request failed", err?.details);
  }
  return data as T;
}
