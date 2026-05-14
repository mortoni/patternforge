"use client";

import Image from "next/image";
import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

type TrainingPreviewTheme = "dark" | "light";

/** `hero`: ~60vh-tall frame (responsive). `card`: compact width-based preview. */
type TrainingPreviewLayout = "hero" | "card";

interface TrainingPreviewProps {
  theme?: TrainingPreviewTheme;
  /** Defaults to `hero` (marketing landing). */
  layout?: TrainingPreviewLayout;
  className?: string;
}

const IMAGE_BY_THEME: Record<TrainingPreviewTheme, string> = {
  dark: "/images/training-board-dark.png",
  light: "/images/training-board-light.png",
};

const IMG_W = 390;
const IMG_H = 844;

/** ~60% viewport height; width follows aspect ratio; viewport width caps height so the frame never overflows horizontally. */
const heroShellStyle: CSSProperties = {
  aspectRatio: `${IMG_W} / ${IMG_H}`,
  height:
    "max(17.5rem, min(60dvh, calc(min(94vw, calc(100dvw - 1.5rem)) * (844 / 390))))",
  width: "auto",
  maxWidth: "100%",
};

export default function TrainingPreview({
  theme = "dark",
  layout = "hero",
  className,
}: TrainingPreviewProps) {
  const frameClassName =
    theme === "dark"
      ? "border-white/10 bg-white/[0.03]"
      : "border-black/12 bg-black/[0.02]";

  if (layout === "card") {
    return (
      <div className={cn("relative w-full max-w-sm min-w-0 justify-center", className)}>
        <div
          className={cn(
            "w-full rounded-[2rem] border p-2 transition-transform duration-300 hover:scale-[1.015]",
            frameClassName
          )}
        >
          <div className="overflow-hidden rounded-[1.5rem]">
            <Image
              src={IMAGE_BY_THEME[theme]}
              alt={`Pattern Forge training preview (${theme} theme)`}
              width={IMG_W}
              height={IMG_H}
              className="h-auto w-full"
              sizes="(max-width: 640px) 88vw, 20rem"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative flex min-h-0 shrink-0 justify-center", className)}>
      <div
        style={heroShellStyle}
        className={cn(
          "box-border overflow-hidden rounded-[2rem] border p-2 transition-transform duration-300 hover:scale-[1.015]",
          frameClassName
        )}
      >
        <div
          className={cn(
            "relative h-full overflow-hidden rounded-[1.5rem]",
            theme === "dark" ? "bg-black/30" : "bg-neutral-200/90"
          )}
        >
          <Image
            src={IMAGE_BY_THEME[theme]}
            alt={`Pattern Forge training preview (${theme} theme)`}
            width={IMG_W}
            height={IMG_H}
            className="h-full w-full object-contain object-center"
            sizes="(max-width: 768px) 90vw, (max-width: 1280px) 50vw, 480px"
            priority
          />
        </div>
      </div>
    </div>
  );
}
