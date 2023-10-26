/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    logging: {
      level: 'verbose',
    },
  },
  output: process.env.IS_DOCKER ? 'standalone' : undefined,
  async redirects() {
    return [
      {
        source: '/',
        destination: '/explore',
        permanent: true,
      },
    ]
  },
}

module.exports = nextConfig
