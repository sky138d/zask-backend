/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // 아래 headers 설정을 추가하세요
  async headers() {
    return [
      {
        // 모든 API 경로에 대해 CORS 허용
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" }, // 모든 도메인 허용
          { key: "Access-Control-Allow-Methods", value: "GET,OPTIONS,PATCH,DELETE,POST,PUT" },
          { key: "Access-Control-Allow-Headers", value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version" },
        ]
      }
    ]
  }
};

module.exports = nextConfig;