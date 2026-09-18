import Header from "@/components/auth/Header";
import { ReactNode } from "react";

const AuthLayout = ({ children }: { children: ReactNode }) => {
  return (
    <div className="flex h-dvh flex-col overflow-x-hidden bg-[#FAF8FF]">
      <Header />
      <div className="flex flex-1 items-center justify-center px-4">
        {children}
      </div>
    </div>
  );
};

export default AuthLayout;
