import {createContext,useContext} from 'react';
export const PreviewSpace=createContext(null);
export function useFinancialSpace(){return useContext(PreviewSpace);}
export function useOptionalFinancialSpace(){return useContext(PreviewSpace);}
export function useSpaceDraft(){/* Existing mockups keep their simulated draft handling. */}

export function useSpaceDraftValues(){/* Simulated preview draft protection remains in ShellAdditions. */}
