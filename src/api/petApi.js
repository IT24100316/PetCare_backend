import axiosInstance from './axiosInstance';
import * as SecureStore from 'expo-secure-store';

export const getPets = async () => {
  const response = await axiosInstance.get('/pets');
  return response.data;
};

export const addPet = async (petData) => {
  const response = await axiosInstance.post('/pets', petData);
  return response.data;
};

export const deletePet = async (id) => {
  const response = await axiosInstance.delete(`/pets/${id}`);
  return response.data;
};

export const updatePet = async (id, petData) => {
  const response = await axiosInstance.put(`/pets/${id}`, petData);
  return response.data;
};

export const getPetById = async (id) => {
  const response = await axiosInstance.get(`/pets/${id}`);
  return response.data;
};

export const uploadImage = async (imageUri) => {
  const formData = new FormData();
  formData.append('image', {
    uri: imageUri,
    name: 'photo.jpg',
    type: 'image/jpeg',
  });
  
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

  const data = await response.json();
  return data.imageUrl;
};
