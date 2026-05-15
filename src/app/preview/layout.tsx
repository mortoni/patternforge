import type { ReactNode } from "react";

/** Shared chrome for marketing previews under `/preview/*`. */
export default function PreviewLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh w-full overflow-x-hidden bg-background">{children}</div>
  );
}
