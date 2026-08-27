/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // permitir origens de desenvolvimento locais/containers para carregar _next/* durante o dev
  allowedDevOrigins: [
    '*.monkeycode-ai.live',
    'http://localhost:3000',
    'http://0.0.0.0:3000',
    'http://172.17.3.4:3000'
  ]
};

export default nextConfig;
