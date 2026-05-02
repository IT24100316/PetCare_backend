import axiosInstance from './axiosInstance';

export const getAvailableSlots = async (date) => {
  const response = await axiosInstance.get(`/bookings/grooming/available?date=${date}`);
  return response.data;
};

export const lockSlot = async (date, timeSlot) => {
  const response = await axiosInstance.post('/bookings/grooming/lock', { date, timeSlot });
  return response.data;
};

export const confirmBooking = async (bookingId, petId, extras = {}) => {
  const response = await axiosInstance.post('/bookings/grooming/confirm', {
    bookingId,
    petId,
    subService: extras.subService,
    price: extras.price,
    addOns: extras.addOns,
    petMood: extras.petMood,
    lastGroomingDate: extras.lastGroomingDate,
    notes: extras.notes,
  });
  return response.data;
};

// Update a pending booking (user edits before groomer approval)
export const updateBooking = async (bookingId, updates) => {
  const response = await axiosInstance.patch(`/bookings/grooming/${bookingId}/update`, updates);
  return response.data;
};

export const updateBookingStatus = async (id, status) => {
  const response = await axiosInstance.put(`/bookings/grooming/${id}/status`, { status });
  return response.data;
};

export const getAllGroomingBookings = async () => {
  const response = await axiosInstance.get('/bookings/grooming');
  return response.data;
};
