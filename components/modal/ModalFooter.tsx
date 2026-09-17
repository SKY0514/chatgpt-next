import { Button } from "../ui/button";

type Props = {
  onCancel: () => void;
  onConfirm: () => void;
};

const ModalFooter = ({ onCancel, onConfirm }: Props) => {
  return (
    <div className="space-x-2">
      <Button variant="destructive" onClick={onConfirm}>
        삭제
      </Button>
      <Button onClick={onCancel}>취소</Button>
    </div>
  );
};

export default ModalFooter;
