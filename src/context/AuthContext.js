import React, { createContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { login as loginApi, register as registerApi } from '../api/authApi';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const bootstrapAsync = async () => {
      try {
        const userToken = await SecureStore.getItemAsync('userToken');
        const userDataString = await SecureStore.getItemAsync('userData');
        if (userToken && userDataString) {
          setUser(JSON.parse(userDataString));
        }
      } catch (e) {
        console.error('Restoring token failed:', e);
      }
      setIsLoading(false);
    };

    bootstrapAsync();
  }, []);

  const loginUser = async (email, password) => {
    try {
      const data = await loginApi(email, password);
      await SecureStore.setItemAsync('userToken', data.token);
      
      const userData = {
        _id: data._id,
        name: data.name,
        email: data.email,
        role: data.role,
      };
      
      await SecureStore.setItemAsync('userData', JSON.stringify(userData));
      setUser(userData);
      return data;
    } catch (error) {
      throw error;
    }
  };

  const registerUser = async (name, email, password, role, phone) => {
    try {
      const data = await registerApi(name, email, password, role, phone);
      await SecureStore.setItemAsync('userToken', data.token);
      
      const userData = {
        _id: data._id,
        name: data.name,
        email: data.email,
        role: data.role,
      };
      
      await SecureStore.setItemAsync('userData', JSON.stringify(userData));
      setUser(userData);
      return data;
    } catch (error) {
      throw error;
    }
  };

  const logoutUser = async () => {
    try {
      await SecureStore.deleteItemAsync('userToken');
      await SecureStore.deleteItemAsync('userData');
      setUser(null);
    } catch (e) {
      console.error('Logout failed:', e);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, loginUser, logoutUser, registerUser }}>
      {children}
    </AuthContext.Provider>
  );
};
