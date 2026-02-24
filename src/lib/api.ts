import { auth } from "@/lib/firebase";
import { normalizeApiError } from "@/lib/api-utils";

export interface ApiErrorPayload {
  code: string;
  message: string;
}

export class ApiError extends Error {
  status: number;
  code: string;

  constructor(status: number, payload: ApiErrorPayload) {
    super(payload.message);
    this.status = status;
    this.code = payload.code;
  }
}

export interface MeResponse {
  uid: string;
  email: string;
  name: string | null;
  image: string | null;
  favoriteMovie: string | null;
}

export interface GoogleAuthResponse {
  success: boolean;
  firstTime: boolean;
  user: MeResponse;
}

export interface UpdateMovieRequest {
  favoriteMovie: string;
}

export interface UpdateMovieResponse {
  favoriteMovie: string;
}

export interface FactResponse {
  fact: string;
  createdAt: string;
  source: "cache" | "generated";
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { 
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const contentType = response.headers.get("content-type") ?? "";
  const hasJson = contentType.includes("application/json");

  if (!response.ok) {
    const parsed = hasJson ? ((await response.json()) as Partial<ApiErrorPayload>) : undefined;
    const payload = normalizeApiError(response.status, parsed);
    throw new ApiError(response.status, { code: payload.code, message: payload.message });
  }

  if (!hasJson) {
    throw new ApiError(500, {
      code: "INVALID_RESPONSE",
      message: "Expected JSON response from server",
    });
  }

  return (await response.json()) as T;
}

export function apiGet<T>(url: string): Promise<T> {
  return request<T>(url, { method: "GET" });
}

export function apiPut<TResponse, TBody>(url: string, body: TBody): Promise<TResponse> {
  return request<TResponse>(url, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export function apiPost<TResponse, TBody = Record<string, never>>(
  url: string,
  body?: TBody,
): Promise<TResponse> {
  return request<TResponse>(url, {
    method: "POST",
    body: body ? JSON.stringify(body) : undefined,
  });
}
