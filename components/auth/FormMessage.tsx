type Props = {
  message: string;
};

const FormMessage = ({ message }: Props) => {
  return <p className="text-sm text-red-600 mt-1 mr-1">{message}</p>;
};

export default FormMessage;
