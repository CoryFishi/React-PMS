import { createContext, useContext, useRef, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

const HistoryContext = createContext(null);

export const HistoryProvider = ({ children }) => {
  const location = useLocation();
  const prevPathRef = useRef(null);
  const [prevPath, setPrevPath] = useState(null);

  useEffect(() => {
    setPrevPath(prevPathRef.current);
    prevPathRef.current = location.pathname;
  }, [location]);

  return (
    <HistoryContext.Provider value={{ prevPath }}>
      {children}
    </HistoryContext.Provider>
  );
};

export const usePreviousPath = () => useContext(HistoryContext);
