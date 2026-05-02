import axiosInstance from './axiosInstance';

export const getMedicalRecords = async (petId) => {
  const response = await axiosInstance.get(`/medical-records/pet/${petId}`);
  return response.data;
};

export const addMedicalRecord = async (data) => {
  const response = await axiosInstance.post('/medical-records', data);
  return response.data;
};

export const updateMedicalRecord = async (id, data) => {
  const response = await axiosInstance.put(`/medical-records/${id}`, data);
  return response.data;
};

export const deleteMedicalRecord = async (id) => {
  const response = await axiosInstance.delete(`/medical-records/${id}`);
  return response.data;
};
