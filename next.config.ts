import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i.ytimg.com',
        port: '',
        pathname: '/**',
      },
      { protocol: 'https', hostname: 'i1.ytimg.com', port: '', pathname: '/**' },
      { protocol: 'https', hostname: 'i2.ytimg.com', port: '', pathname: '/**' },
      { protocol: 'https', hostname: 'i3.ytimg.com', port: '', pathname: '/**' },
      { protocol: 'https', hostname: 'i4.ytimg.com', port: '', pathname: '/**' },
      { protocol: 'https', hostname: 'i5.ytimg.com', port: '', pathname: '/**' },
      { protocol: 'https', hostname: 'i6.ytimg.com', port: '', pathname: '/**' },
      { protocol: 'https', hostname: 'i7.ytimg.com', port: '', pathname: '/**' },
      { protocol: 'https', hostname: 'i8.ytimg.com', port: '', pathname: '/**' },
      { protocol: 'https', hostname: 'i9.ytimg.com', port: '', pathname: '/**' },
      {
        protocol: 'https',
        hostname: 'yt3.ggpht.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
