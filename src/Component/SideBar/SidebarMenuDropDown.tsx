import React from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { SidebarMenuDropDownType } from "@/Type/SideBarType";
import { Javascript } from "@/Constant";
import { ListGroup, ListGroupItem } from "reactstrap";
import { useTranslation } from "react-i18next";
const SidebarMenuDropDown = ({ setLinkActive, linkActive, items, handleOpen, active, level, setActive, activeMenuTitle, setActiveMenuTitle }: SidebarMenuDropDownType) => {
  const { t } = useTranslation();

  const router = useRouter();
  const pathname = usePathname();
  const layoutParam = useSearchParams().get("layout");
  return items?.map((element, index) => {
    const isLinkActive = element.path && pathname === element.path && activeMenuTitle === element.title;
    const isSubmenuOpen = element.pathSlice && active?.includes(element.pathSlice);
    return (
    <ListGroupItem className='dropdown' key={index}>
      <a
        onClick={() => {
          if (element.children && element.type == "sub") {
            handleOpen(element.pathSlice, level);
          } else {
            if (element.path?.split("/")[1] === "pages") {
              router.push(element.path);
            } else if (element.path && element.path !== "#") {
              setActiveMenuTitle(element.title);
              setLinkActive(element.path.split("/")[element.path.split("/").length - 1]);
              router.push(`${element.path}`);
            }
          }
        }}
        className={`${isLinkActive || isSubmenuOpen ? "active" : ""} ${level == 0 ? `nav-link menu-title` : ""}`}
        id='nav-link'
      >
        {level === 0 ? (
          <>
            {element.icon}
            <span>{t(element.title)}</span>
            <div className='according-menu'>{element.type == "sub" && <i className={`fa  ${isSubmenuOpen ? "fa-angle-down" : "fa-angle-right"}`}></i>}</div>
          </>
        ) : (
          <>
            {element.icon && <span className='submenu-icon'>{element.icon}</span>}
            <span>{t(element.title)}</span>
            <div className='according-menu'>
              <i className={element.type == "sub" ? `fa  ${isSubmenuOpen ? "fa-angle-down" : "fa-angle-right"}` : ""}></i>
            </div>
          </>
        )}
      </a>

      {element.children && (
        <ListGroup style={{ marginLeft: "arrowStyle" }} className={`nav-submenu ${layoutParam == "compact-sidebar" ? "pt-4" : ""}  menu-content list-group ${isSubmenuOpen ? "d-block" : "d-none"} `}>
          <SidebarMenuDropDown linkActive={linkActive} setLinkActive={setLinkActive} items={element.children} setActive={setActive} handleOpen={handleOpen} active={active} level={level + 1} activeMenuTitle={activeMenuTitle} setActiveMenuTitle={setActiveMenuTitle} />
        </ListGroup>
      )}
    </ListGroupItem>
  );
  });
};

export default SidebarMenuDropDown;
