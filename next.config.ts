import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // C:\Users\User 에 다른 package-lock.json 이 있어 Next가 워크스페이스 루트를
  // 잘못 추론합니다. 이 프로젝트 폴더를 루트로 고정합니다.
  outputFileTracingRoot: path.join(__dirname),
};

export default nextConfig;
