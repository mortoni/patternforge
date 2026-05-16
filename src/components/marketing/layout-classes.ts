/** Shared layout tokens for the marketing home page and chrome. */

export const containerClass =
  "mx-auto w-full max-w-6xl px-3.5 sm:px-5 md:px-6 lg:px-8";

/** Wider hero on desktop: uses most of the viewport up to a generous cap. */
export const heroContainerClass =
  "mx-auto w-full max-w-6xl min-w-0 px-3.5 sm:px-5 md:px-6 lg:max-w-[min(100%,100rem)] lg:px-10 xl:px-14";

export const headerWordmarkClass =
  "text-[11px] tracking-[0.2em] sm:text-xs sm:tracking-[0.28em] md:text-sm md:tracking-[0.35em]";

export const footerWordmarkClass =
  "text-[11px] tracking-[0.2em] sm:text-xs sm:tracking-[0.28em] md:text-sm md:tracking-[0.35em]";

export const navLinkClass =
  "text-sm text-muted-foreground transition-colors hover:text-foreground";

export const footerLinkClass =
  "text-sm text-neutral-600 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100";

export const footerMuted =
  "text-sm leading-relaxed text-neutral-600 dark:text-neutral-400";

export const footerHeading =
  "text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-500";

/** Soft horizontal hairline — reads gentler than `border-b` across full width. */
export const sectionHairline =
  "after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:z-0 after:h-px after:bg-gradient-to-r after:from-transparent after:via-border/35 after:to-transparent dark:after:via-white/10";
