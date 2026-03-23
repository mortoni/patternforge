import { notFound } from "next/navigation";
import DocsPage from "@/pages/docs/DocsPage";
import { docsContent } from "@/docs";

const validSlugs = [
  "introduction",
  "philosophy",
  "woodpecker-method",
  "lifecycle",
  "architecture",
  "data-model",
  "decisions",
  "roadmap",
] as const;

type Slug = (typeof validSlugs)[number];

function getDocContent(slug: string): React.ReactNode {
  if (!validSlugs.includes(slug as Slug)) {
    notFound();
  }

  const Content = docsContent[slug as keyof typeof docsContent];
  if (!Content) {
    notFound();
  }

  return <Content />;
}

export default async function DocPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const content = getDocContent(slug);

  return <DocsPage>{content}</DocsPage>;
}

export async function generateStaticParams() {
  return validSlugs.map((slug) => ({ slug }));
}
