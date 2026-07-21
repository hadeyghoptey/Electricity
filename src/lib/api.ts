export function apiUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_API_URL || "";
  return `${base}${path}`;
}

export async function apiFetch(path: string, options?: RequestInit): Promise<Response> {
  const res = await fetch(apiUrl(path), options);
  if (!res.ok) throw new Error(`API error: ${res.statusText}`);
  return res;
}
