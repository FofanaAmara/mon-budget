import {createContext,useContext} from 'react';
export const PreviewIdentity=createContext({name:'Camille Martin',email:'camille@example.test'});
export const authClient={useSession:()=>({data:{user:useContext(PreviewIdentity)}}),signOut:async()=>({data:{}})};
