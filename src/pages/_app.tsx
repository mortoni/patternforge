import type { AppProps } from "next/app";
import { SettingsProvider } from "@/features/settings/context/settings-context";

export default function LegacyPagesApp({ Component, pageProps }: AppProps) {
  return (
    <SettingsProvider>
      <Component {...pageProps} />
    </SettingsProvider>
  );
}
