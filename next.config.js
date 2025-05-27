/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Suprimir warnings de APIs dinâmicas até que o Clerk seja totalmente compatível com Next.js 15
    dynamicIO: false,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "vercel.com",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/github",
        destination: "https://github.com/steven-tey/precedent",
        permanent: false,
      },
    ];
  },
  // Configuração para permitir requisições cross-origin do IP do servidor
  async headers() {
    return [
      {
        source: "/_next/:path*",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: "http://5.161.64.137:3003",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
