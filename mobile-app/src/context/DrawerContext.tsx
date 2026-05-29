import { createContext } from 'react';

export interface DrawerContextType {
  openDrawer: () => void;
  closeDrawer: () => void;
  isDrawerOpen: boolean;
}

export const DrawerContext = createContext<DrawerContextType>({
  openDrawer: () => {},
  closeDrawer: () => {},
  isDrawerOpen: false,
});
