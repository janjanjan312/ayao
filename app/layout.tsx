import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "阿遥 · 你的旅行决策搭子",
  description: "来自真实笔记，只给你一个答案",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh">
      <body>{children}</body>
    </html>
  );
}
