import { addons, type API } from "storybook/manager-api";
import { create } from "storybook/theming";

const INTRODUCTION_DOCS_STORY_ID = "introduction--docs";

const theme = create({
  base: "dark",
  brandTitle: "PatternForge",
  brandUrl: "https://chessforge.app",
  brandTarget: "_self",

  colorPrimary: "#94a3b8",
  colorSecondary: "#cbd5e1",

  appBg: "#0f1419",
  appContentBg: "#141a21",
  appBorderColor: "#2a3441",
  appBorderRadius: 8,

  fontBase: '"Inter", system-ui, sans-serif',
  fontCode: "monospace",

  textColor: "#e2e8f0",
  textInverseColor: "#0f1419",
  textMutedColor: "#94a3b8",

  barTextColor: "#cbd5e1",
  barSelectedColor: "#f8fafc",
  barHoverColor: "#e2e8f0",
  barBg: "#0f1419",

  inputBg: "#1a222c",
  inputBorder: "#2a3441",
  inputTextColor: "#e2e8f0",
  inputBorderRadius: 6,
});

addons.setConfig({
  theme,
  sidebar: {
    showRoots: true,
  },
});

function isBareStorybookEntryUrl(): boolean {
  const path = new URLSearchParams(window.location.search).get("path");
  return path == null || path === "" || path === "/";
}

addons.register("patternforge/default-landing", (api: API) => {
  void addons.ready().then(() => {
    let frames = 0;
    const maxFrames = 600;

    const tick = (): void => {
      frames += 1;
      if (!isBareStorybookEntryUrl()) return;

      const index = api.getIndex();
      if (index?.entries?.[INTRODUCTION_DOCS_STORY_ID]) {
        api.selectStory(INTRODUCTION_DOCS_STORY_ID, undefined, { viewMode: "docs" });
        return;
      }

      if (frames < maxFrames) {
        requestAnimationFrame(tick);
      }
    };

    requestAnimationFrame(tick);
  });
});
