import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { PWA_VIEWPORT_BOOTSTRAP } from "./pwa-viewport-bootstrap";

describe("PWA_VIEWPORT_BOOTSTRAP", () => {
  let originalNavigator: Navigator;

  beforeEach(() => {
    originalNavigator = window.navigator;
    document.documentElement.classList.remove("pf-standalone");
    document.documentElement.style.removeProperty("--app-height");
  });

  afterEach(() => {
    Object.defineProperty(window, "navigator", {
      configurable: true,
      value: originalNavigator,
    });
    document.documentElement.classList.remove("pf-standalone");
    document.documentElement.style.removeProperty("--app-height");
  });

  function runBootstrap(standalone: boolean) {
    Object.defineProperty(window, "navigator", {
      configurable: true,
      value: { ...originalNavigator, standalone },
    });
    // eslint-disable-next-line no-eval -- bootstrap is an inline IIFE string for `<head>`
    eval(PWA_VIEWPORT_BOOTSTRAP);
  }

  it("sets full-screen height in iOS standalone mode", () => {
    runBootstrap(true);

    expect(document.documentElement.classList.contains("pf-standalone")).toBe(
      true
    );
    expect(
      document.documentElement.style.getPropertyValue("--app-height")
    ).toBe("100vh");
  });

  it("does not override height in regular browser mode", () => {
    runBootstrap(false);

    expect(document.documentElement.classList.contains("pf-standalone")).toBe(
      false
    );
    expect(
      document.documentElement.style.getPropertyValue("--app-height")
    ).toBe("");
  });
});
