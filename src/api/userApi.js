import axiosInstance from './axiosInstance';
import * as SecureStore from 'expo-secure-store';

export const getProfile = async () => {
  const response = await axiosInstance.get('/users/profile');
  return response.data;
};

export const updateProfile = async (data) => {
  const response = await axiosInstance.put('/users/profile', data);
  return response.data;
};

export const changePassword = async (data) => {
  const response = await axiosInstance.put('/users/change-password', data);
  return response.data;
};

export const uploadImage = async (formData) => {
  const token = await SecureStore.getItemAsync('userToken');
  const response = await fetch(`${axiosInstance.defaults.baseURL}/upload/image`, {
    method: 'POST',
    body: formData,
    headers: {
      Authorization: `Bearer ${token}`,
      // Fetch will automatically set the Content-Type with the correct boundary
    },
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Upload failed: ${errorData}`);
  }

  return response.json();
};
