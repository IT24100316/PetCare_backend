const express = require('express');
const {
  getBoardingAvailability,
  getBoardingServices,
  getPetBookedDates,
  createBoardingBooking,
  updateBoardingBooking,
  cancelBooking,
  getAllBoardingBookings,
  updateBookingStatus,
  getBoardingSummary,
} = require('../controllers/boardingController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

// Manager / Admin routes
router.get('/', authorizeRoles('BoardingManager', 'Admin'), getAllBoardingBookings);
router.get('/summary', authorizeRoles('BoardingManager', 'Admin'), getBoardingSummary);
router.put('/:id/status', authorizeRoles('BoardingManager', 'Admin'), updateBookingStatus);

// User routes
router.get('/services', getBoardingServices);
router.get('/available', getBoardingAvailability);
router.get('/pet-dates', getPetBookedDates);
router.post('/book', createBoardingBooking);
router.patch('/:id/update', updateBoardingBooking);
router.delete('/:id', cancelBooking);

module.exports = router;
