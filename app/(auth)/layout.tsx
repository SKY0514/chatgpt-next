import Header from "@/components/auth/Header";
import { ReactNode } from "react";

const AuthLayout = ({ children }: { children: ReactNode }) => {
  return (
    <div className="h-dvh bg-[#FAF8FF] flex flex-col">
      <Header />
      <div className="flex flex-1 justify-center items-center">{children}</div>
    </div>
  );
};

export default AuthLayout;
