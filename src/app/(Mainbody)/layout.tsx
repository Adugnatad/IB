"use client";
import Header from "@/Component/Header/Header";
import SideBarSection from "@/Component/SideBar";
import { RootState } from "@/Redux/ReduxStore";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import Footer from "@/Component/Footer";
import { useEffect } from "react";
import { useSession } from "next-auth/react";

export default function RootLayout({ children}: { children: React.ReactNode}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { sideBarType } = useSelector((store: RootState) => store.themeSlice);
  const backgroundColor = useSelector((store: RootState) => store.headerSlice.backGroundChange);
  const pathname = useSearchParams();
  const path = usePathname();

  useEffect(() => {
    if (status !== "loading" && !session) {
      router.replace("/");
    }
  }, [session, status, router]);

  useEffect(() => {
    window.addEventListener("resize", () => {
      if (window.innerWidth < 992) {
        document.getElementById("page-wrapper")?.classList.remove("horizontal-wrapper");
        document.getElementById("page-wrapper")?.classList.add("compact-wrapper");
      } else if (sideBarType != "horizontal-wrapper") {
        document.getElementById("page-wrapper")?.classList.remove("horizontal-wrapper");
        document.getElementById("page-wrapper")?.classList.add("compact-wrapper");
      } else {
        document.getElementById("page-wrapper")?.classList.add("horizontal-wrapper");
        document.getElementById("page-wrapper")?.classList.remove("compact-wrapper");
      }
    });
  }, [sideBarType]);

  if (status === "loading" || !session) {
    return (
      <div className='d-flex justify-content-center align-items-center min-vh-100'>
        <div className='spinner-border text-primary' role='status'>
          <span className='visually-hidden'>Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div id='mainLayout' className={`${backgroundColor}`}>
      <div className={`page-wrapper ${sideBarType} ${pathname.get("layout")}`} id='page-wrapper'>
        <Header />
        <div className='page-body-wrapper horizontal-menu'>
          <SideBarSection />
          <div className='page-body'> {children}</div>
          <Footer />
        </div>
      </div>
    </div>
  );
}
