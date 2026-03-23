import type { NextConfig } from "next";

const isGitHubPages = process.env.GITHUB_PAGES === 'true';

const nextConfig: NextConfig = {
  // GitHub Pages configuration
  basePath: isGitHubPages ? '/MD380Tool' : '',
  
  // Trailing slash for GitHub Pages
  trailingSlash: isGitHubPages,
  
  // Output static files for GitHub Pages (optional - set GITHUB_PAGES=true to enable)
  ...(isGitHubPages && {
    output: 'export',
    images: {
      unoptimized: true,
    },
  }),
  
  // Ensure proper asset prefix for GitHub Pages
  assetPrefix: isGitHubPages ? 'https://re3con.github.io/MD380Tool/' : undefined,
  
  // PWA support via headers
  async headers() {
    return [
      {
        source: '/manifest.json',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
