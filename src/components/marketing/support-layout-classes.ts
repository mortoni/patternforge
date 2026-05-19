/** Shared layout tokens for /support and /support/success on mobile and PWA. */

export const supportPageArticleClass =
  "min-w-0 overflow-x-hidden pb-[max(4rem,env(safe-area-inset-bottom))]";

export const supportSectionStackClass = "mt-12 space-y-10 sm:mt-14 sm:space-y-12";

export const supportDonationGridClass =
  "grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4";

export const supportDonationCardClass =
  "group flex min-h-[8.25rem] touch-manipulation flex-col justify-between rounded-lg border border-border/80 bg-card/50 p-4 text-left transition-colors hover:border-border hover:bg-muted/25 active:bg-muted/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:min-h-[7.25rem] sm:p-5";

export const supportTouchTargetClass = "min-h-11 touch-manipulation";

export const cryptoDonationCardClass =
  "min-w-0 overflow-hidden rounded-lg border border-border/80 bg-card/35 p-4 sm:p-5";

export const cryptoAddressBoxClass =
  "mt-4 overflow-hidden rounded-md border border-border/60 bg-muted/20 px-3 py-2.5";

export const cryptoAddressTextClass =
  "break-all font-mono text-[11px] leading-relaxed text-foreground/90 [overflow-wrap:anywhere] sm:text-xs";

export const cryptoQrContainerClass =
  "mx-auto w-[min(100%,8.75rem)] shrink-0 sm:mx-0 sm:w-[7.25rem]";

export const cryptoQrFrameClass =
  "rounded-md border border-border/70 bg-white p-2 sm:p-2.5";

export const supportSuccessActionsClass =
  "mt-10 flex w-full flex-col gap-3 sm:max-w-none sm:flex-row sm:items-center";

export const supportInlineLinkClass =
  "inline-flex min-h-11 touch-manipulation items-center font-medium text-foreground underline decoration-border underline-offset-4 transition-colors hover:decoration-foreground";
