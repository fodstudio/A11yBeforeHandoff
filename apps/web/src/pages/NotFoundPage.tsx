import { Link } from "react-router-dom";

export function NotFoundPage() {
  return <div className="page-width not-found"><span>404</span><h1>This page missed the handoff.</h1><p>Let’s get you back to the useful part.</p><Link className="button button-dark" to="/">Go home</Link></div>;
}
