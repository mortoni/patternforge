import createMDX from "@next/mdx";

/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ["ts", "tsx", "js", "jsx", "md", "mdx"],
  experimental: {
    mdxRs: false,
  },
  async redirects() {
    return [
      {
        source: "/app/training-2",
        destination: "/app/training",
        permanent: true,
      },
      {
        source: "/app/training-2/session-summary",
        destination: "/app/training/session-summary",
        permanent: true,
      },
    ];
  },
};

const withMDX = createMDX({
  options: {
    remarkPlugins: [],
    rehypePlugins: [],
  },
});

export default withMDX(nextConfig);
