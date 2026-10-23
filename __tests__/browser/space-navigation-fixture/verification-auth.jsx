import { createContext, useContext } from 'react';
export const VerificationSession = createContext(null);
export const authClient = { useSession: () => useContext(VerificationSession) };
