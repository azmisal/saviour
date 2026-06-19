'use client';

import React, {
    createContext,
    useContext,
    useEffect,
    useState,
} from 'react';

import axios from 'axios';

import endPoints from '@/constants/ApiEndPoints';

import { useCrypto } from './CryptoContext';

type User = {
    id: string;
    email: string;
    name?: string;
};

type AuthContextType = {
    user: User | null;

    isLoading: boolean;

    isAuthenticated: boolean;

    setUser: (user: User | null) => void;

    checkAuth: () => Promise<boolean>;

    refreshAuth: () => Promise<boolean>;

    login: (
        formData: {
            email: string;
            password: string;
        }
    ) => Promise<boolean>;

    signup: (
        name: string,
        email: string,
        password: string
    ) => Promise<void>;

    logout: () => Promise<void>;
};

const AuthContext =
    createContext<AuthContextType | null>(null);

export function AuthProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    const [user, setUser] =
        useState<User | null>(null);

    const [isLoading, setIsLoading] =
        useState(true);

    const isAuthenticated = !!user;

    const {
        initCrypto,
        restoreCrypto,
        clearCrypto,
    } = useCrypto();

    /**
     * APP START
     */
    useEffect(() => {
        (async () => {
            try {
                setIsLoading(true);

                let ok = await checkAuth();
                if (!ok) {
                    ok = await refreshAuth();
                }
                if (ok) {
                    const cryptoOk =
                        await restoreCrypto();
                    if (!cryptoOk) {
                        await logout();
                        return;
                    }
                }
            } finally {
                setIsLoading(false);
            }
        })();
    }, []);

    /**
     * CHECK AUTH
     */
    const checkAuth =
        async (): Promise<boolean> => {
            try {
                const res = await axios.get(
                    `${process.env.NEXT_PUBLIC_API_BASE_URL}/${endPoints.auth.authCheck}`,
                    {
                        withCredentials: true,
                    }
                );

                if (res.status !== 200) {
                    setUser(null);

                    return false;
                }

                setUser(res.data.user);

                return true;
            } catch {
                setUser(null);

                return false;
            }
        };

    /**
     * REFRESH AUTH
     */
    const refreshAuth =
        async (): Promise<boolean> => {
            try {
                const res = await axios.post(
                    `${process.env.NEXT_PUBLIC_API_BASE_URL}${endPoints.auth.refreshToken}`,
                    {},
                    {
                        withCredentials: true,
                    }
                );

                if (res.status !== 200) {
                    setUser(null);

                    return false;
                }

                setUser(res.data.user);

                return true;
            } catch {
                setUser(null);

                return false;
            }
        };

    /**
     * LOGIN
     */
    const login = async (formData: {
        email: string;
        password: string;
    }) => {
        try {
            const res = await axios.post(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}${endPoints.auth.login}`,
                {
                    email: formData.email,
                    password: formData.password,
                },
                {
                    withCredentials: true,
                }
            );

            if (res.status !== 200) {
                throw new Error(
                    res.data.message ||
                    'Login failed'
                );
            }

            const { user, salt } = res.data;

            setUser(user);

            /**
             * CREATE + SAVE ENCRYPTION KEY
             */
            await initCrypto(
                formData.password,
                salt
            );

            return true;
        } catch (err) {
            throw err;
        }
    };

    /**
     * SIGNUP
     */
    const signup = async (
        name: string,
        email: string,
        password: string
    ) => {
        try {
            const res = await axios.post(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}${endPoints.auth.signup}`,
                {
                    name,
                    email,
                    password,
                },
                {
                    withCredentials: true,
                }
            );

            if (res.status !== 200) {
                throw new Error(
                    res.data.message ||
                    'Signup failed'
                );
            }

            window.location.href = '/login';
        } catch (err) {
            throw err;
        }
    };

    /**
     * LOGOUT
     */
    const logout = async () => {
        try {
            await axios.post(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}${endPoints.auth.logout}`,
                {},
                {
                    withCredentials: true,
                }
            );
        } catch (err) {
            console.error(err);
        }

        setUser(null);

        await clearCrypto();

        window.location.href = '/login';
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isLoading,
                isAuthenticated,

                setUser,

                checkAuth,
                refreshAuth,

                login,
                signup,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);

    if (!ctx) {
        throw new Error(
            'useAuth must be used inside AuthProvider'
        );
    }

    return ctx;
}
