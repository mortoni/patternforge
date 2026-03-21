import { cn } from "@/lib/utils";
import {
  LOGO_SRC_ON_DARK_BG,
  LOGO_SRC_ON_LIGHT_BG,
} from "@/components/logo/logo-sources";

export interface LogoProps {
  size?: number | string;
  className?: string;
}

function sizeToCss(size: number | string): string {
  return typeof size === "number" ? `${size}px` : size;
}

const imgClass =
  "h-full w-full object-contain select-none pointer-events-none";

export default function Logo({ size = 120, className }: LogoProps) {
  const dimension = sizeToCss(size);

  return (
    <div
      aria-hidden
      className={cn("relative inline-block shrink-0", className)}
      style={{ width: dimension, height: dimension }}
    >
      <img
        src={LOGO_SRC_ON_LIGHT_BG}
        alt=""
        className={cn(imgClass, "dark:hidden")}
        draggable={false}
      />
      <img
        src={LOGO_SRC_ON_DARK_BG}
        alt=""
        className={cn(imgClass, "hidden dark:block")}
        draggable={false}
      />
    </div>
  );
}
