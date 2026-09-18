import { ReactNode } from "react";
import Image from "next/image";
import { Card, CardContent, CardFooter, CardHeader } from "../ui/card";
import Link from "next/link";

type Props = {
  title: string;
  subtitle?: string;
  footer: { label: string; linkLabel: string; href: string };
  children: ReactNode;
};

const FormCard = ({ title, subtitle, footer, children }: Props) => {
  return (
    <div className="relative w-full max-w-115">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-12 -left-12 size-64 rounded-full bg-primary/10 blur-[32px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-10 -bottom-10 size-64 rounded-full bg-secondary/10 blur-[32px]"
      />
      <Card className="relative flex w-full flex-col items-center gap-6 rounded-2xl p-6 has-data-[slot=card-footer]:pb-6 shadow-[0px_20px_25px_-5px_rgba(210,217,244,0.4),0px_8px_10px_-6px_rgba(210,217,244,0.4)] ring-0 sm:p-10 sm:has-data-[slot=card-footer]:pb-10">
        <CardHeader className="flex w-full flex-col items-center gap-1 text-center">
          <div className="mb-3 flex size-14 items-center justify-center rounded-2xl bg-linear-to-b from-secondary to-primary shadow-[0px_4px_6px_-1px_rgba(70,72,212,0.2),0px_2px_4px_-2px_rgba(70,72,212,0.2)]">
            <Image
              src="/threadly-bot.png"
              alt="login icon"
              width={36}
              height={36}
              className="size-9"
            />
          </div>
          <p className="text-[22px] font-extrabold tracking-[-0.55px] text-foreground">
            {title}
          </p>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
        </CardHeader>
        <CardContent className="w-full px-0">{children}</CardContent>
        <CardFooter className="gap-x-2 bg-inherit p-0 text-[13px] text-muted-foreground border-none">
          <span>{footer.label}</span>
          <Link className="font-medium text-primary" href={footer.href}>
            {footer.linkLabel}
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
};

export default FormCard;
