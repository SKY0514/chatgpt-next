"use client";

import { deleteSession } from "@/actions/sessions";
import { Button } from "../ui/button";

const LogoutButton = () => {
  return <Button onClick={() => deleteSession()}>로그아웃</Button>;
};

export default LogoutButton;
