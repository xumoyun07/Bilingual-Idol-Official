import { Compass, Home } from "lucide-react";
import { useLocation } from "wouter";

export default function NotFound() {
  const [, setLocation] = useLocation();
  return <main className="compass-page compass-grid grid min-h-screen place-items-center p-5"><section className="compass-card w-full max-w-xl p-8 text-center sm:p-12"><span className="mx-auto grid h-14 w-14 place-items-center rounded-xl bg-[#e7f0eb] text-[#397563]"><Compass size={25} /></span><p className="compass-kicker mt-7">Route marker 404</p><h1 className="compass-display mt-4 text-5xl">This route is not on the map.</h1><p className="mx-auto mt-4 max-w-md text-sm leading-7 text-[#53657a]">The page may have moved or no longer be available. Return to the website to continue.</p><button onClick={() => setLocation("/")} className="compass-btn-primary mt-8"><Home size={16} /> Go Home</button></section></main>;
}
