import React from "react";

const Header = () => {
  return (
    <header className="w-full px-6 py-5 flex items-center gap-x-2">
      <div className="flex size-8 items-center justify-center rounded-lg bg-primary">
        <img src="/header-icon.svg" alt="header-logo" />
      </div>
      <span className="text-[18px] font-bold">Threadly</span>
    </header>
  );
};

export default Header;
