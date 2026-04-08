/**
 * Gọi API đã bảo vệ JWT — Bearer token lấy từ sessionStorage (theo tab).
 */
import { getToken as readSessionToken } from './authStorage.js';

export function getToken() {
  return readSessionToken();
}

export async function apiFetch(path, options = {}) {
  const token = getToken();
  const headers = {
    ...(options.headers || {}),
    ...(options.body && typeof options.body === 'string' ? { 'Content-Type': 'application/json' } : {}),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const r = await fetch(path, { ...options, headers });
  return r;
}

export async function apiJson(path, options = {}) {
  const r = await apiFetch(path, options);
  const text = await r.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!r.ok) {
    const err = new Error(typeof data === 'object' && data?.message ? data.message : r.statusText);
    err.status = r.status;
    err.body = data;
    throw err;
  }
  return data;
}

export function apiJsonBody(method, path, body) {
  return apiJson(path, {
    method,
    body: body != null ? JSON.stringify(body) : undefined,
  });
}
