"use client";

import { verifySession } from "@/actions/sessions";
import { useUserStore } from "@/stores/user";
import { ReactNode, useEffect } from "react";

const UserProvider = ({ children }: { children: ReactNode }) => {
  const updateUser = useUserStore((state) => state.updateUser);

  useEffect(() => {
    const setUser = async () => {
      const user = await verifySession();

      if (user) {
        updateUser(user);
      }
    };

    setUser();
  }, []);
  return <>{children}</>;
};

export default UserProvider;
