import Image from "next/image";

const Empty = () => {
  return (
    <div className="flex flex-col items-center justify-center size-full space-y-1.5">
      <Image src="/logo.png" alt="logo" width={50} height={50} />
      <h3 className="text-xl  md:text-2xl font-bold">무엇을 도와드릴까요?</h3>
    </div>
  );
};

export default Empty;
