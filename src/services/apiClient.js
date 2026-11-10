let csrfToken = null;

export async function apiRequest(path, options = {}) {
  const method = (options.method || "GET").toUpperCase();
  const headers = new Headers(options.headers || {});
  headers.set("Accept", "application/json");
  if (options.body !== undefined && !(options.body instanceof FormData)) headers.set("Content-Type", "application/json");
  if (!["GET", "HEAD", "OPTIONS"].includes(method)) {
    if (!csrfToken) {
      const csrf = await fetch("/api/auth/csrf", { credentials: "same-origin" });
      if (!csrf.ok) throw new Error("Could not initialize secure request. Is the API server running?");
      csrfToken = (await csrf.json()).csrfToken;
    }
    headers.set("X-CSRF-Token", csrfToken);
  }
  const response = await fetch(`/api${path}`, { ...options, method, headers, credentials: "same-origin", body: options.body instanceof FormData ? options.body : options.body === undefined ? undefined : JSON.stringify(options.body) });
  const responseBody = response.status === 204 ? null : await response.json().catch(() => null);
  if (response.ok && responseBody?.csrfToken) csrfToken = responseBody.csrfToken;
  if (!response.ok) {
    if (response.status === 403) csrfToken = null;
    const error = new Error(responseBody?.error || "The request could not be completed.");
    error.status = response.status;
    error.details = responseBody?.details || [];
    throw error;
  }
  if (response.status === 204) csrfToken = null;
  return responseBody;
}
