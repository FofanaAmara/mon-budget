import {useRouter} from './navigation.jsx';
export default function Link({href,children,prefetch,replace,scroll,...rest}) {const router=useRouter(); const url=typeof href==='string'?href:href.pathname;return <a {...rest} href={url} onClick={e=>{rest.onClick?.(e);if(!e.defaultPrevented&&!e.metaKey&&!e.ctrlKey){e.preventDefault();router.push(url);}}}>{children}</a>;}
