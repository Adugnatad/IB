import { LanguagesData, languageDataType } from "@/Data/HeaderData/Language";
import { useRouter } from "next/navigation";
import { Fragment, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

const LanguageClass = () => {
  const [langdropdown, setLangdropdown] = useState(false);
  const { i18n } = useTranslation();
  const currentLanguage = i18n.resolvedLanguage;
  const [selectedLang, setSelectedLang] = useState<any>({});
  const router = useRouter();
  const [lang, setLang] = useState("en");
  const changeLng = (lng: languageDataType) => {
    setLang(lng.data);
    setSelectedLang(lng);
    i18n.changeLanguage(lng.data);
    router.refresh();
  };

  const LanguageSelection = (language: any) => {
    if (language) {
      setLangdropdown(!language);
    } else {
      setLangdropdown(!language);
    }
  };

  useEffect(() => {
    const defaultLanguage = LanguagesData.find((data) => data.data === currentLanguage) ?? LanguagesData[0];
    setSelectedLang(defaultLanguage);
    setLang(defaultLanguage.data);
    }, [currentLanguage]);
  
  useEffect(() => {
    if (lang === "ae" || lang === "ar") {
      document.body.classList.add("rtl");
      document.body.classList.remove("ltr");
      document.body.classList.remove("box-layout");
      document.documentElement.dir = "rtl";
    } else {
      document.body.classList.add("ltr");
      document.body.classList.remove("rtl");
      document.body.classList.remove("box-layout");
      document.documentElement.dir = "ltr";
    }
  }, [lang])
  
  return (
    <Fragment>
      <li className='onhover-dropdown'>
        <div className={`translate_wrapper ${langdropdown ? "active" : ""}`}>
          <div className='current_lang'>
            <div className='lang d-flex' onClick={() => LanguageSelection(langdropdown)}>
              <span className='lang-txt'>{selectedLang?.language ?? LanguagesData[0].language}</span>
            </div>
          </div>

          <div className={`more_lang onhover-show-div ${langdropdown ? "active" : ""}`}>
            {LanguagesData.map((item, i) => (
              <div key={i} className='lang' onClick={() => changeLng(item)}>
                <div className='lang-txt' data-lng={item.data}>
                  {item.language}
                </div>
              </div>
            ))}
          </div>
        </div>
      </li>
    </Fragment>
  );
};

export default LanguageClass;
