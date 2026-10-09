/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      // The Vitrine moved back onto the homepage; keep old links working.
      { source: "/vitrine", destination: "/#vitrine", permanent: false },
    ];
  },
};

export default nextConfig;
