/**
 * iOS home-screen / standalone PWA viewport bootstrap.
 *
 * Must run synchronously in `<head>` before first paint.
 *
 * - `viewport-fit=cover` + `black-translucent` (see `src/app/layout.tsx`) extend
 *   content under the status bar; `env(safe-area-inset-*)` reserves that space.
 * - In standalone mode, `100dvh` / `100svh` are ~safe-area-top too short on cold
 *   start (WebKit #254868). `100vh` equals the full screen when there is no URL bar.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/CSS/env
 * @see https://bugs.webkit.org/show_bug.cgi?id=254868
 */
export const PWA_VIEWPORT_BOOTSTRAP = `(function(){try{var n=window.navigator;var standalone=n.standalone===true||(window.matchMedia&&window.matchMedia("(display-mode: standalone)").matches);if(standalone){document.documentElement.style.setProperty("--app-height","100vh");document.documentElement.classList.add("pf-standalone")}}catch(e){}})();`;
