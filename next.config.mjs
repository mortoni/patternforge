import createMDX from "@next/mdx";

/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ["ts", "tsx", "js", "jsx", "md", "mdx"],
  experimental: {
    mdxRs: false,
  },
};

const withMDX = createMDX({
  options: {
    // String form: Turbopack requires serializable MDX loader options. The
    // loader resolves `remark-gfm` at compile time. GFM tables compile through
    // `_components.table`, so `useMDXComponents` styling applies (raw `<table>`
    // JSX does not).
    remarkPlugins: ["remark-gfm"],
    rehypePlugins: [],
  },
});

export default withMDX(nextConfig);
