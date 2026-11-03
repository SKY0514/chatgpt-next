import { Button } from "../ui/button";

type Props = {
  onCancel: () => void;
  onConfirm: () => void;
  disabled?: boolean;
};

const ModalFooter = ({ onCancel, onConfirm, disabled = false }: Props) => {
  return (
    <div className="space-x-2">
      <Button variant="destructive" onClick={onConfirm} disabled={disabled}>
        삭제
      </Button>
      <Button onClick={onCancel}>취소</Button>
    </div>
  );
};

export default ModalFooter;
