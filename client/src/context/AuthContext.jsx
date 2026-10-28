import React, { createContext, useState, useContext } from 'react';
import api from '../api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [userInfo, setUserInfo] = useState(
        localStorage.getItem('userInfo')
            ? JSON.parse(localStorage.getItem('userInfo'))
            : null
    );

    const login = async (email, password) => {
        const { data } = await api.post('/auth/login', { email, password });
        setUserInfo(data);
        localStorage.setItem('userInfo', JSON.stringify(data));
        return data;
    };

    const register = async (name, email, password, role) => {
        const { data } = await api.post('/auth/register', { name, email, password, role });
        setUserInfo(data);
        localStorage.setItem('userInfo', JSON.stringify(data));
        return data;
    };

    const requestCitizenOtp = async (phone) => {
        const { data } = await api.post('/auth/citizen/request-otp', { phone });
        return data;
    };

    const verifyCitizenOtp = async (phone, otp) => {
        const { data } = await api.post('/auth/citizen/verify-otp', { phone, otp });
        const userPayload = data.user ? { ...data.user, token: data.token } : data;
        setUserInfo(userPayload);
        localStorage.setItem('userInfo', JSON.stringify(userPayload));
        return userPayload;
    };

    const loginCitizenDemo = async () => {
        const { data } = await api.post('/auth/demo-citizen');
        const userPayload = data.user ? { ...data.user, token: data.token } : data;
        setUserInfo(userPayload);
        localStorage.setItem('userInfo', JSON.stringify(userPayload));
        return userPayload;
    };

    const logout = () => {
        setUserInfo(null);
        localStorage.removeItem('userInfo');
    };

    return (
        <AuthContext.Provider
            value={{
                userInfo,
                login,
                register,
                requestCitizenOtp,
                verifyCitizenOtp,
                loginCitizenDemo,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
