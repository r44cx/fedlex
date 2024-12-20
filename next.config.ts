/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/:path*',
        destination: '/api/laws/list?path=:path*',
      },
    ];
  },
};

module.exports = nextConfig;
