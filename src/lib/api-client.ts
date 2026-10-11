export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: "Something went wrong" }));
    throw new ApiError(body.error ?? "Something went wrong", res.status);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export const fetcher = <T>(url: string) => apiFetch<T>(url);
