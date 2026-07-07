/** @type {import('next').NextConfig} */

// For GitHub Pages: set NEXT_PUBLIC_BASE_PATH to "/your-repo-name" (leave empty for a
// user/organization page served at the domain root or when running locally).
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ""

const nextConfig = {
  // Static HTML export so the whole app can be hosted on GitHub Pages.
  output: "export",
  basePath,
  assetPrefix: basePath || undefined,
  trailingSlash: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
