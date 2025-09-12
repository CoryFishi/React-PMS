import axios from "axios";
import { createContext, useState, useEffect } from "react";
const API_KEY = import.meta.env.VITE_API_KEY;

export const UserContext = createContext({});

export function UserContextProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    if (!user) {
      axios
        .get("/profile", {
          headers: {
            "x-api-key": API_KEY,
          },
        })
        .then(({ data }) => {
          setUser(data.user);
          if (data !== null) {
            setIsLoggedIn(true);
          }
          setIsLoading(false);
        })
        .catch((error) => {
          console.error("Error fetching profile:", error);
          setIsLoggedIn(false);
          setIsLoading(false);
        });
    }
  }, []);

  const currentfacility = user?.selectedFacility || null;

  return (
    <UserContext.Provider
      value={{
        user,
        setUser,
        isLoggedIn,
        setIsLoggedIn,
        isLoading,
        currentfacility,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}
