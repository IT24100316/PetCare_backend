import axiosInstance from './axiosInstance';

export const getBoardingAvailability = async (startDate, endDate) => {
  const response = await axiosInstance.get(`/bookings/boarding/available?startDate=${startDate}&endDate=${endDate}`);
  return response.data;
};

export const getPetBookedDates = async (petId) => {
  const response = await axiosInstance.get(`/bookings/boarding/pet-dates?petId=${petId}`);
  return response.data;
};

export const createBoardingBooking = async (petId, boardingDates) => {
  const response = await axiosInstance.post('/bookings/boarding/book', { petId, boardingDates });
  return response.data;
};

export const updateBookingStatus = async (id, status) => {
  const response = await axiosInstance.put(`/bookings/boarding/${id}/status`, { status });
  return response.data;
};

export const getAllBoardingBookings = async () => {
  const response = await axiosInstance.get('/bookings/boarding');
  return response.data;
};
