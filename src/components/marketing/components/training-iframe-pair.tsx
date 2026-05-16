import {
  DocumentThemedTrainingPreview,
  LG_PREVIEW_FRAME_STYLE,
  type MarketingShellTone,
} from "@/components/shared/training-preview";
import type { PreviewTrainingParams } from "@/lib/preview/preview-training-url";
import { cn } from "@/lib/utils";

export function TrainingIframePair({
  className,
  title,
  preview,
  phoneShellClassName,
  phoneAspectClassName,
  smAspectHeight,
  smFillContainer,
  compactHeroLayout,
  preventShortEmbedFrame,
  shellTone,
}: {
  className?: string;
  title: string;
  preview: Omit<PreviewTrainingParams, "appearance">;
  /** Overrides the default mobile shell sizing (e.g. hero larger frame). */
  phoneShellClassName?: string;
  /** Overrides default `aspect-[430/932]` when using a non-default `smAspectHeight`. */
  phoneAspectClassName?: string;
  smAspectHeight?: number;
  smFillContainer?: boolean;
  compactHeroLayout?: boolean;
  preventShortEmbedFrame?: boolean;
  shellTone?: MarketingShellTone;
}) {
  const isSm = preview.screen === "sm";
  const isLg = preview.screen === "lg";

  const positioned =
    isSm || isLg ? cn(className, "absolute inset-0") : className;

  const tree = (
    <DocumentThemedTrainingPreview
      className={positioned}
      title={title}
      preview={preview}
      smAspectHeight={smAspectHeight}
      smFillContainer={smFillContainer}
      compactHeroLayout={compactHeroLayout}
      preventShortEmbedFrame={preventShortEmbedFrame}
      shellTone={shellTone}
    />
  );

  if (isSm) {
    return (
      <div
        className={cn(
          phoneAspectClassName ?? "aspect-[430/932]",
          "relative isolate mx-auto w-full shrink-0 max-w-[20rem] lg:w-[20rem]",
          phoneShellClassName
        )}
      >
        {tree}
      </div>
    );
  }

  if (isLg) {
    return (
      <div
        className="relative isolate mx-auto shrink-0"
        style={LG_PREVIEW_FRAME_STYLE}
      >
        {tree}
      </div>
    );
  }

  return tree;
}
