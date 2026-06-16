import { getProfile } from "@/lib/auth";
import NavbarClient from "./NavbarClient";

// Server component: the profile is fetched on the server (deduped via React.cache),
// so the navbar renders fully formed with no client-side round-trip or flicker.
export default async function Navbar() {
  const profile = await getProfile();
  return <NavbarClient profile={profile} />;
}
