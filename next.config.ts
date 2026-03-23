import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // GitHub Pages configuration
  basePath: '/MD380Tool',
  
  // Trailing slash for GitHub Pages
  trailingSlash: true,
  
  // Output static files for GitHub Pages
  output: 'export',
  
  // Image optimization - disable for static export
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
