/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        net: false,
        tls: false,
        fs: false,
        dns: false,
        child_process: false,
        'utf-8-validate': false,
        bufferutil: false,
      };
    }
    return config;
  },
  images: {
    unoptimized: true,
  }
};

module.exports = nextConfig; 