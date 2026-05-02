import axiosInstance from './axiosInstance';

export const getMyBookings = async () => {
  const response = await axiosInstance.get('/bookings/my-bookings');
  return response.data;
};

/** Cancel a booking (enforces 2-hour rule & instant slot rule on backend) */
export const cancelBooking = async (serviceType, bookingId) => {
  const slugMap = { Vet: 'vet', Grooming: 'grooming', Boarding: 'boarding' };
  const slug = slugMap[serviceType] || 'vet';
  const response = await axiosInstance.delete(`/bookings/${slug}/${bookingId}`);
  return response.data;
};

/** Remove a cancelled/rejected booking entry from the user's history (local UI hide via DELETE) */
export const deleteBookingFromHistory = async (serviceType, bookingId) => {
  const slugMap = { Vet: 'vet', Grooming: 'grooming', Boarding: 'boarding' };
  const slug = slugMap[serviceType] || 'vet';
  const response = await axiosInstance.delete(`/bookings/${slug}/${bookingId}/history`);
  return response.data;
};
