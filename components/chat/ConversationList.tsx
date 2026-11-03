"use client";
import { useOptimistic, useTransition } from "react";
import SidebarItem from "./SidebarItem";
import { useModalStore } from "@/stores/modal";
import ModalFooter from "../modal/ModalFooter";
import { deleteConversation } from "@/actions/conversations";
import { useParams, useRouter } from "next/navigation";
import { BASE_URL } from "@/constants/routes";
import toast from "react-hot-toast";

type Props = {
  list: {
    id: string;
    label: string;
    href: string;
  }[];
};

const ConversationList = ({ list }: Props) => {
  const [optimisticList, removeOptimisticList] = useOptimistic(
    list,
    (state, deletedId: string) => state.filter((item) => item.id !== deletedId),
  );
  const { id: conversationId } = useParams<{ id: string }>();
  const router = useRouter();

  const { openModal, closeModal } = useModalStore((state) => state);

  const [isDeleting, startDeleteTransition] = useTransition();

  const handleClickDeleteButton = (id: string) => {
    openModal({
      title: "정말 삭제하시겠습니까?",
      description: "삭제 후 데이터는 복구하기 어려울 수 있습니다.",
      footer: (
        <ModalFooter
          disabled={isDeleting}
          onCancel={closeModal}
          onConfirm={() => onDelete(id)}
        />
      ),
    });
  };

  const onDelete = (id: string) => {
    startDeleteTransition(async () => {
      removeOptimisticList(id);
      try {
        await deleteConversation(id);

        if (conversationId === id) {
          router.replace(BASE_URL);
        }

        toast.success("삭제에 성공했습니다.");

        closeModal();
      } catch (error) {
        console.error("error:", error);
        toast.error("삭제에 실패했습니다.");
      }
    });
  };

  return (
    <div className="flex flex-col gap-y-0.5">
      {optimisticList.map((item) => (
        <SidebarItem
          key={item.id}
          item={item}
          onDelete={(id) => handleClickDeleteButton(id)}
        />
      ))}
    </div>
  );
};

export default ConversationList;
