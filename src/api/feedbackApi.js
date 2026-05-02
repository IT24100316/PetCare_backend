import axiosInstance from './axiosInstance';

export const getAverageRatings = async () => {
  const response = await axiosInstance.get('/feedbacks/average');
  return response.data;
};

export const getAllFeedback = async (serviceType) => {
  const url = serviceType ? `/feedbacks?serviceType=${serviceType}` : '/feedbacks';
  const response = await axiosInstance.get(url);
  return response.data;
};

export const submitFeedback = async (data) => {
  const response = await axiosInstance.post('/feedbacks', data);
  return response.data;
};
export const deleteFeedback = async (id) => {
  const response = await axiosInstance.delete(`/feedbacks/${id}`);
  return response.data;
};

export const updateFeedback = async (id, data) => {
  const response = await axiosInstance.put(`/feedbacks/${id}`, data);
  return response.data;
};
