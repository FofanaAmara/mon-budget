import { createContext, useContext } from "react";
export const Navigation = createContext(null);
export function useRouter() {
  return useContext(Navigation).router;
}
export function usePathname() {
  return useContext(Navigation).pathname;
}
export default function Link({ href, ...props }) {
  return <a {...props} href={href} />;
}
