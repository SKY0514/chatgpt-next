import { BASE_URL } from "@/constants/routes";
import Image from "next/image";
import Link from "next/link";

const Logo = () => {
  return (
    <Link href={BASE_URL} className="flex items-center gap-2">
      <Image src="/logo.png" alt="logo" width={40} height={40} />
      <h1 className="text-2xl font-bold">Chat GPT</h1>
    </Link>
  );
};

export default Logo;
