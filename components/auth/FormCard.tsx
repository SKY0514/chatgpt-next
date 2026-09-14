import { ReactNode } from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import Link from "next/link";

type Props = {
  title: string;
  footer: { label: string; href: string };
  children: ReactNode;
};
const FormCard = ({ title, footer, children }: Props) => {
  return (
    <Card className="w-125 flex flex-col items-center border">
      <CardHeader className="w-full text-center">
        <CardTitle className="font-bold text-xl">{title}</CardTitle>
      </CardHeader>
      <CardContent className="w-[90%]">{children}</CardContent>
      <CardFooter className="bg-inherit border-none">
        <Link className="text-sm text-sky-700" href={footer.href}>
          {footer.label}
        </Link>
      </CardFooter>
    </Card>
  );
};

export default FormCard;
