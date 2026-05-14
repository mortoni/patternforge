import { addons, type API } from "storybook/manager-api";

/**
 * Landing docs id for the handbook (`src/stories/docs/Introduction.mdx`, `<Meta title="Introduction" />`).
 * Regenerate via `pnpm build-storybook` and `storybook-static/index.json` if the title changes.
 */
const INTRODUCTION_DOCS_STORY_ID = "introduction--docs";

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
