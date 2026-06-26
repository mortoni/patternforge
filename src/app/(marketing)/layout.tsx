export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="pf-min-app-height bg-background text-foreground">
      {children}
    </div>
  );
}
