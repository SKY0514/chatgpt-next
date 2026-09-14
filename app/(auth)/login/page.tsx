import LoginForm from "@/components/auth/LoginForm";

const LoginPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) => {
  const { from } = await searchParams;
  return <LoginForm from={from} />;
};

export default LoginPage;
