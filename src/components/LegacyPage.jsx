import { useEffect, useMemo } from "react";

export function pageMarkup(source) {
  return new DOMParser().parseFromString(source,"text/html").body.innerHTML;
}

export default function LegacyPage({source,title,bodyClass,loadPage}) {
  const markup = useMemo(() => pageMarkup(source),[source]);

  useEffect(() => {
    const previousTitle = document.title;
    const previousClass = document.body.className;
    document.title = title;
    document.body.className = bodyClass || "";
    let current = true;
    loadPage().catch(error => {
      console.error(`AUTOX ${title} page setup failed.`,error);
      if (current) document.dispatchEvent(new CustomEvent("autox:page-error",{detail:{page:title}}));
    });
    return () => {
      current = false;
      document.title = previousTitle;
      document.body.className = previousClass;
    };
  },[bodyClass,loadPage,title]);

  return <div className="legacy-page" dangerouslySetInnerHTML={{__html:markup}} />;
}
