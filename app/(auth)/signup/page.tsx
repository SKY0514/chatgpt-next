import SignUpForm from "@/components/auth/SignUpForm";

const SignUpPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) => {
  const { from } = await searchParams;
  return <SignUpForm from={from} />;
};

export default SignUpPage;
