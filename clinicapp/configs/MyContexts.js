import { createContext, useState } from "react";


export const MyUserContext = createContext();
export const MyDispatchContext = createContext();
export const MyContextProvider = ({ children }) => {
    const [user, setUser] = useState(null);

    return (
        <MyUserContext.Provider value={user}>
            <MyDispatchContext.Provider value={setUser}>
                {children}
            </MyDispatchContext.Provider>
        </MyUserContext.Provider>
    );
};