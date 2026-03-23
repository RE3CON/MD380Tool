import type { NextConfig } from "next";

const isGitHubPages = process.env.GITHUB_PAGES === 'true';

const nextConfig: NextConfig = {
  // GitHub Pages configuration
  ...(isGitHubPages && {
    basePath: '/MD380Tool',
    trailingSlash: true,
    output: 'export',
    images: {
      unoptimized: true,
    },
  }),
};

export default nextConfig;
