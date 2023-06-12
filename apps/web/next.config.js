/** @type {import('next').NextConfig} */
const nextConfig = {
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
