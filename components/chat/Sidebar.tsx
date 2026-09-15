import { BASE_URL, CHAT_ROUTES } from "@/constants/routes";
import Logo from "./Logo";
import { MessageSquare, Plus } from "lucide-react";
import SidebarItem from "./SidebarItem";
import LogoutButton from "./LogoutButton";

const DUMMY_ITEMS = [
  { id: "new", label: "새로운 대화", icon: <Plus />, href: BASE_URL },
  {
    id: "1",
    label:
      "새로운 긴 대화 예시입니다. 새로운 긴 대화 예시입니다. 새로운 긴 대화 예시입니다.",
    icon: <MessageSquare />,
    href: `${CHAT_ROUTES.CONVERSATIONS}/1`,
  },
  {
    id: "2",
    label:
      "Lorem ipsum dolor sit amet consectetur adipisicing elit. Aperiam, nulla qui ea beatae eveniet mollitia consectetur cupiditate id explicabo quae, similique voluptatibus expedita fugiat porro, deleniti ullam! Nulla, neque aspernatur!",
    icon: <MessageSquare />,
    href: `${CHAT_ROUTES.CONVERSATIONS}/2`,
  },
];
const Sidebar = () => {
  return (
    <nav className="h-full p-3 bg-black flex flex-col text-white">
      {/* 로고 영역 + 메뉴 아이템 */}

      <div className="flex-1 overflow-y-auto">
        <Logo />
        <div className="flex flex-col gap-2 mt-10">
          {DUMMY_ITEMS.map((item) => (
            <SidebarItem key={item.id} item={item} />
          ))}
        </div>
      </div>
      {/* 로그아웃 버튼 */}
      <div>
        <LogoutButton />
      </div>
    </nav>
  );
};

export default Sidebar;
