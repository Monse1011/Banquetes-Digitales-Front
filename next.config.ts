import type { NextConfig } from "next";

// El back no habilita CORS y autentica con la cookie HttpOnly `auth_token`,
// así que todas las llamadas a /api pasan por este rewrite (mismo origen).
const backendUrl = process.env.BACKEND_URL ?? "http://localhost:3000";

const nextConfig: NextConfig = {
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${backendUrl}/api/:path*` }];
  },
};

export default nextConfig;
