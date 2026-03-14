export function normalizeBaseUrl(input, fallback) {
  const raw = (input || "").trim();
  if (!raw) {
    return fallback;
  }
  return raw.replace(/\/+$/, "");
}

export function isHttpsUrl(url) {
  return /^https:\/\//i.test(url);
}

export function resolveRuntimeBaseUrl(extra, prodKey, devKey, prodFallback, devFallback, isDev = __DEV__) {
  if (isDev) {
    return normalizeBaseUrl(extra[devKey], devFallback);
  }
  return normalizeBaseUrl(extra[prodKey], prodFallback);
}

export function toAbsoluteUrl(base, path) {
  if (!path) {
    return base;
  }
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  if (path.startsWith("/")) {
    const root = base.replace(/\/api\/v1$/, "");
    return `${root}${path}`;
  }
  return `${base}/${path.replace(/^\/+/, "")}`;
}

