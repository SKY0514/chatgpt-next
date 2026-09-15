import MobileMenu from "./MobileMenu";
import ModelSelect from "./ModelSelect";

const Header = () => {
  return (
    <header className="flex items-center p-2">
      {/* 모바일 메뉴 영역 */}
      <MobileMenu />
      {/* 모델 선택 영역 */}
      <ModelSelect />
    </header>
  );
};

export default Header;
