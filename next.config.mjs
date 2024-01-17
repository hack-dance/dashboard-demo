/** @type {import('next').NextConfig} */

const nextConfig = {
  transpilePackages: ["three"],
  images: {
    domains: ["i.ytimg.com", "/", "image.mux.com"]
  },
  reactStrictMode: true,
  pageExtensions: ["md", "tsx", "ts", "jsx", "js", "md", "mdx"],
  experimental: {
    mdxRs: false
  }
}

export default nextConfig
