import { Link } from "react-router-dom";
import { usePreferences } from "../preferences";
import { localizedPath } from "../routing";

export function NotFoundPage() {
  const { locale } = usePreferences();
  return <div className="page-width not-found"><span>404</span><h1>This page missed the handoff.</h1><p>Let’s get you back to the useful part.</p><Link className="button button-dark" to={localizedPath(locale)}>Go home</Link></div>;
}
