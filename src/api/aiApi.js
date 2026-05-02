import axiosInstance from './axiosInstance';

export const analyzeSymptoms = async (symptoms, petName, petSpecies) => {
  const response = await axiosInstance.post('/ai/analyze-symptoms', {
    symptoms,
    petName,
    petSpecies,
  });
  return response.data;
};
