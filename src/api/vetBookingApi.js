import axiosInstance from './axiosInstance';

export const getAvailableSlots = async (date) => {
  const response = await axiosInstance.get(`/bookings/vet/available?date=${date}`);
  return response.data;
};

export const lockSlot = async (date, timeSlot) => {
  const response = await axiosInstance.post('/bookings/vet/lock', { date, timeSlot });
  return response.data;
};

export const confirmBooking = async (bookingId, petId) => {
  const response = await axiosInstance.post('/bookings/vet/confirm', { bookingId, petId });
  return response.data;
};
export const getVetBookings = async () => {
  const response = await axiosInstance.get('/bookings/vet');
  return response.data;
};

export const updateBookingStatus = async (id, status) => {
  const response = await axiosInstance.put(`/bookings/vet/${id}/status`, { status });
  return response.data;
};

export const cancelVetBooking = async (id) => {
  const response = await axiosInstance.delete(`/bookings/vet/${id}`);
  return response.data;
};
