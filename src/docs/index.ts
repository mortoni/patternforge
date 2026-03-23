import Introduction from "./introduction.mdx";
import Philosophy from "./philosophy.mdx";
import WoodpeckerMethod from "./woodpecker-method.mdx";
import Lifecycle from "./lifecycle.mdx";
import Architecture from "./architecture.mdx";
import DataModel from "./data-model.mdx";
import Decisions from "./decisions.mdx";
import Roadmap from "./roadmap.mdx";

export const docsContent = {
  introduction: Introduction,
  philosophy: Philosophy,
  "woodpecker-method": WoodpeckerMethod,
  lifecycle: Lifecycle,
  architecture: Architecture,
  "data-model": DataModel,
  decisions: Decisions,
  roadmap: Roadmap,
} as const;
