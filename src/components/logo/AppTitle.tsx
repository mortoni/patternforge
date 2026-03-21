import { cn } from "@/lib/utils";

export interface AppTitleProps {
  className?: string;
}

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
