import { PanelLeft } from "lucide-react";

const SidebarBrand = () => {
  return (
    <div className="flex w-full items-center justify-between px-2 py-0.75">
      {/* 왼쪽 */}
      <div className="flex items-center gap-x-2.5">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#6366f1] drop-shadow-[0px_1px_1px_rgba(0,0,0,0.05)]">
          <img src="/icon-sidebar.svg" alt="sidebar icon" className="size-4" />
        </div>
        <p className="text-[18px] font-extrabold text-[#0f172a]">Threadly</p>
      </div>
      {/* 오른쪽 */}
      <button
        type="button"
        disabled
        title="사이드바 접기 (준비 중)"
        className="flex items-center justify-center p-1"
      >
        <PanelLeft className="size-3.5" color="#64748B" />
      </button>
    </div>
  );
};

export default SidebarBrand;
