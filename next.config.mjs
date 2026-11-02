/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  images: {
    formats: ['image/avif', 'image/webp'],
    localPatterns: [{ pathname: '/uploads/**' }, { pathname: '/images/**' }, { pathname: '/imgs/**' }],
  },
  serverExternalPackages: ['@prisma/client', '@prisma/adapter-mariadb', 'mariadb', 'sharp'],
  async redirects() {
    return [
      { source: '/men', destination: '/category/men', permanent: true },
      { source: '/women', destination: '/category/women', permanent: true },
      { source: '/kids', destination: '/category/kids', permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        ],
      },
    ];
  },
};

export default nextConfig;
