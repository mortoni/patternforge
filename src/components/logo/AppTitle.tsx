import { cn } from "@/lib/utils";

export interface AppTitleProps {
  className?: string;
}

/**
 * The default 0.35em tracking suits wide surfaces (marketing header). Narrow
 * contexts such as the app sidebar must pass a tighter `tracking-*`, or the
 * wordmark truncates mid-word ("PATTERN FO…").
 */
export default function AppTitle({ className }: AppTitleProps) {
  return (
    <span
      className={cn(
        "inline-block whitespace-nowrap text-sm font-light uppercase tracking-[0.35em]",
        "text-foreground dark:text-[#CFCFCF]",
        className
      )}
    >
      PATTERN FORGE
    </span>
  );
}
