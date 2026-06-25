import React, { createContext, useState, useEffect, useContext } from 'react';
import { getToken, getUser, removeToken, removeUser, login as apiLogin, register as apiRegister, saveUser } from './useAuth';
import { setInvalidSessionHandler } from './sessionEvents';

interface UserInfo {
    id: string;
    email: string;
    role: string;
    name?: string;
}

interface AuthContextType {
    isAuthenticated: boolean;
    user: UserInfo | null;
    isAdmin: boolean;
    isLoading: boolean;
    login: (email: string, pass: string) => Promise<void>;
    register: (email: string, pass: string, name?: string) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState<UserInfo | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        checkAuth();
        setInvalidSessionHandler(() => {
            setIsAuthenticated(false);
            setUser(null);
        });

        return () => setInvalidSessionHandler(null);
    }, []);

    const checkAuth = async () => {
        try {
            const token = await getToken();
            const savedUser = await getUser();
            setIsAuthenticated(!!token);
            setUser(savedUser);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (email: string, pass: string) => {
        const data = await apiLogin(email, pass);
        setIsAuthenticated(true);
        if (data.user) {
            setUser(data.user);
            await saveUser(data.user);
        }
    };

    const register = async (email: string, pass: string, name?: string) => {
        await apiRegister(email, pass, name);
    };

    const logout = async () => {
        await removeToken();
        await removeUser();
        setIsAuthenticated(false);
        setUser(null);
    };

    return (
        <AuthContext.Provider
            value={{
                isAuthenticated,
                user,
                isAdmin: user?.role === 'ADMIN',
                isLoading,
                login,
                register,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuthContext = () => useContext(AuthContext);
