import {createContext,useContext} from 'react';
export const PreviewNavigation=createContext(null);
export function useRouter(){return useContext(PreviewNavigation).router;}
export function usePathname(){return useContext(PreviewNavigation).pathname;}
export function useSearchParams(){return useContext(PreviewNavigation).search;}
export function redirect(url){window.dispatchEvent(new CustomEvent('preview:navigate',{detail:url}));}
