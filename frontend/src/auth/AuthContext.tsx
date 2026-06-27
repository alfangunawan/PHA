import React, { createContext, useState, useEffect, useContext } from 'react';
import { getToken, getUser, removeToken, removeUser, login as apiLogin, register as apiRegister, saveUser } from './useAuth';
import { setInvalidSessionHandler } from './sessionEvents';
import { checkGad7Status as apiCheckGad7Status } from '../chat/chatService';
import type { Gad7Status } from '../chat/chatGateUtils';

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
    canAccessAdminPanel: boolean;
    isLoading: boolean;
    gad7LoadingState: 'loading' | 'ready' | 'error';
    gad7Status: Gad7Status;
    refreshGad7Status: () => Promise<Gad7Status>;
    login: (email: string, pass: string) => Promise<void>;
    register: (email: string, pass: string, name?: string) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState<UserInfo | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [gad7LoadingState, setGad7LoadingState] = useState<'loading' | 'ready' | 'error'>('loading');
    const [gad7Status, setGad7Status] = useState<Gad7Status>(null);

    useEffect(() => {
        checkAuth();
        setInvalidSessionHandler(() => {
            setIsAuthenticated(false);
            setUser(null);
            setGad7Status(null);
            setGad7LoadingState('error');
        });

        return () => setInvalidSessionHandler(null);
    }, []);

    // Fetch GAD-7 status whenever user becomes authenticated
    useEffect(() => {
        if (isAuthenticated) {
            refreshGad7Status();
        }
    }, [isAuthenticated]);

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

    const refreshGad7Status = async (): Promise<Gad7Status> => {
        setGad7LoadingState('loading');
        try {
            const status = await apiCheckGad7Status();
            setGad7Status(status);
            setGad7LoadingState('ready');
            return status;
        } catch {
            setGad7Status(null);
            setGad7LoadingState('error');
            return null; // callers fail-open: resolveChatRoute(null) === 'Chat'
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
        await login(email, pass);
    };

    const logout = async () => {
        await removeToken();
        await removeUser();
        setIsAuthenticated(false);
        setUser(null);
        setGad7Status(null);
        setGad7LoadingState('loading');
    };

    const isAdmin = user?.role === 'ADMIN';

    return (
        <AuthContext.Provider
            value={{
                isAuthenticated,
                user,
                isAdmin,
                canAccessAdminPanel: isAdmin,
                isLoading,
                gad7LoadingState,
                gad7Status,
                refreshGad7Status,
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
