import Link from "next/link";
import { APP_NAME } from "@/lib/constants";
import { Button } from "@/components/ui/button";

export default function MarketingPage() {
  return (
    <div className="space-y-8 text-center">
      <h1 className="text-3xl font-semibold tracking-tight text-[var(--foreground)]">
        {APP_NAME}
      </h1>
      <p className="mx-auto max-w-md text-[var(--muted-foreground)]">
        Local-first chess tactics training. Train at your own pace, on your
        device.
      </p>
      <Button asChild size="lg">
        <Link href="/app">Get started</Link>
      </Button>
    </div>
  );
}
