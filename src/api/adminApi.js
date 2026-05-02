import axiosInstance from './axiosInstance';

export const getAllUsers = async () => {
  const response = await axiosInstance.get('/admin/users');
  return response.data;
};

export const blockUser = async (id) => {
  const response = await axiosInstance.put(`/admin/users/${id}/block`);
  return response.data;
};

export const createServiceProvider = async (providerData) => {
  const response = await axiosInstance.post('/admin/providers', providerData);
  return response.data;
};
