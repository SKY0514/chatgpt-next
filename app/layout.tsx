import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import Modal from "@/components/modal/Modal";
import QueryProvider from "@/providers/QueryProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Threadly - 팀 워크스페이스 기반 협업형 AI 챗봇",
  description:
    "팀원들과 AI 대화를 함께 보고, 답변에 코멘트를 남기고, 역할 기반으로 권한을 관리하세요. 워크스페이스 단위로 AI 사용량도 한눈에 확인할 수 있습니다.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <QueryProvider>
          <Modal />
          <Toaster />
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}
