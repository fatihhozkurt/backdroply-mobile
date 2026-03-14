import test from "node:test";
import assert from "node:assert/strict";
import {
  isHttpsUrl,
  normalizeBaseUrl,
  resolveRuntimeBaseUrl,
  toAbsoluteUrl
} from "./runtimeUtils.js";

test("normalizeBaseUrl trims and removes trailing slash", () => {
  assert.equal(normalizeBaseUrl(" https://api.example.com/ ", "fallback"), "https://api.example.com");
  assert.equal(normalizeBaseUrl("", "https://fallback"), "https://fallback");
});

test("isHttpsUrl validates only https scheme", () => {
  assert.equal(isHttpsUrl("https://example.com"), true);
  assert.equal(isHttpsUrl("http://example.com"), false);
});

test("resolveRuntimeBaseUrl chooses dev or prod key", () => {
  const extra = { apiBaseUrl: "https://prod/api/v1/", apiBaseUrlDev: "http://dev/api/v1/" };
  assert.equal(
    resolveRuntimeBaseUrl(extra, "apiBaseUrl", "apiBaseUrlDev", "https://prod-fallback", "http://dev-fallback", false),
    "https://prod/api/v1"
  );
  assert.equal(
    resolveRuntimeBaseUrl(extra, "apiBaseUrl", "apiBaseUrlDev", "https://prod-fallback", "http://dev-fallback", true),
    "http://dev/api/v1"
  );
});

test("toAbsoluteUrl resolves absolute, root-relative and relative paths", () => {
  assert.equal(toAbsoluteUrl("https://api.example.com/api/v1", "https://cdn.example.com/file"), "https://cdn.example.com/file");
  assert.equal(toAbsoluteUrl("https://api.example.com/api/v1", "/legal/privacy.html"), "https://api.example.com/legal/privacy.html");
  assert.equal(toAbsoluteUrl("https://api.example.com/api/v1", "media/jobs/1"), "https://api.example.com/api/v1/media/jobs/1");
});

