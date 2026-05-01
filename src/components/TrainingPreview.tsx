"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

type TrainingPreviewTheme = "dark" | "light";

interface TrainingPreviewProps {
  theme?: TrainingPreviewTheme;
  className?: string;
}

const IMAGE_BY_THEME: Record<TrainingPreviewTheme, string> = {
  dark: "/images/training-board-dark.png",
  light: "/images/training-board-light.png",
};

export default function TrainingPreview({
  theme = "dark",
  className,
}: TrainingPreviewProps) {
  const frameClassName =
    theme === "dark"
      ? "border-white/10 bg-white/[0.03]"
      : "border-black/12 bg-black/[0.02]";

  return (
    <div className={cn("relative w-full max-w-[320px] sm:max-w-[360px]", className)}>
      <div
        className={cn(
          "rounded-[2rem] border p-2 transition-transform duration-300 hover:scale-[1.015]",
          frameClassName
        )}
      >
        <div className="overflow-hidden rounded-[1.5rem]">
          <Image
            src={IMAGE_BY_THEME[theme]}
            alt={`Pattern Forge training preview (${theme} theme)`}
            width={390}
            height={844}
            priority
            className="h-auto w-full"
          />
        </div>
      </div>
    </div>
  );
}
