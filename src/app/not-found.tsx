import Link from "next/link";
import Nav from "@/components/Nav";
export default function NotFound(){return <><Nav/><main className="shell page"><div className="empty"><h1>That page wandered off.</h1><p>We couldn't find the page you're looking for.</p><Link className="btn primary" href="/">Back to Pairly</Link></div></main></>;}
