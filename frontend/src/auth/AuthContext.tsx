import React, { createContext, useState, useEffect, useContext } from 'react';
import { getToken, removeToken, login as apiLogin, register as apiRegister, saveToken } from './useAuth';

interface AuthContextType {
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, pass: string) => Promise<void>;
    register: (email: string, pass: string) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const token = await getToken();
            setIsAuthenticated(!!token);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (email: string, pass: string) => {
        const data = await apiLogin(email, pass);
        setIsAuthenticated(true);
    };

    const register = async (email: string, pass: string) => {
        await apiRegister(email, pass);
        // Optionally auto-login or ask user to login
        // For now, let's just return and let the UI decide
    };

    const logout = async () => {
        await removeToken();
        setIsAuthenticated(false);
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, isLoading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuthContext = () => useContext(AuthContext);
