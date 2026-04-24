const Booking = require('../models/Booking');
const Pet = require('../models/Pet');

const MAX_BOARDING_CAPACITY = 20;
const SERVICE_RATES = {
  Boarding: 2500,
  Sitting: 1800,
};
const ACTIVE_STATUSES = ['Pending', 'Approved'];
const ALLOWED_STATUS_UPDATES = ['Pending', 'Approved', 'Rejected', 'Cancelled'];

const normalizeCareType = (careType = 'Boarding') => {
  if (!SERVICE_RATES[careType]) {
    return null;
  }
  return careType;
};

const parseBoardingDates = (boardingDates) => {
  if (!Array.isArray(boardingDates) || boardingDates.length === 0) {
    return [];
  }

  const uniqueDates = [...new Set(boardingDates)];
  return uniqueDates
    .map(d => {
      const date = new Date(d);
      if (Number.isNaN(date.getTime())) {
        return null;
      }
      date.setUTCHours(12, 0, 0, 0);
      return date;
    })
    .filter(Boolean)
    .sort((a, b) => a - b);
};

const buildDayRange = (date) => {
  const startOfDay = new Date(date);
  startOfDay.setUTCHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setUTCHours(23, 59, 59, 999);
  return { startOfDay, endOfDay };
};

const calculateTotalPrice = (careType, boardingDates) => SERVICE_RATES[careType] * boardingDates.length;

const ensurePetBelongsToUser = async (petId, userId) => {
  const pet = await Pet.findById(petId);
  if (!pet) {
    return { error: { status: 404, message: 'Pet not found' } };
  }

  if (pet.ownerId.toString() !== userId.toString()) {
    return { error: { status: 403, message: 'You can only book boarding or sitting for your own pets' } };
  }

  return { pet };
};

const checkPetDateConflicts = async (petId, parsedDates, excludeBookingId) => {
  for (const date of parsedDates) {
    const { startOfDay, endOfDay } = buildDayRange(date);
    const query = {
      petId,
      serviceType: 'Boarding',
      status: { $in: ACTIVE_STATUSES },
      boardingDates: { $elemMatch: { $gte: startOfDay, $lte: endOfDay } },
    };

    if (excludeBookingId) {
      query._id = { $ne: excludeBookingId };
    }

    const conflict = await Booking.findOne(query);
    if (conflict) {
      const dateStr = startOfDay.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
      return `This pet already has a boarding or sitting booking on ${dateStr}. Please choose different dates.`;
    }
  }

  return null;
};

const applyCareDetails = (booking, details) => {
  const editableFields = [
    'dropOffTime',
    'pickUpTime',
    'feedingInstructions',
    'medicationInstructions',
    'emergencyContactName',
    'emergencyContactPhone',
    'specialCareNotes',
    'notes',
  ];

  editableFields.forEach(field => {
    if (details[field] != null) {
      booking[field] = details[field];
    }
  });
};

const getBoardingServices = async (req, res) => {
  res.status(200).json({
    capacityPerDay: MAX_BOARDING_CAPACITY,
    services: Object.entries(SERVICE_RATES).map(([careType, dailyRate]) => ({
      careType,
      dailyRate,
    })),
  });
};

const getBoardingAvailability = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'startDate and endDate are required' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) {
      return res.status(400).json({ message: 'Please provide a valid startDate and endDate range' });
    }

    start.setUTCHours(0, 0, 0, 0);
    end.setUTCHours(23, 59, 59, 999);

    const existingBookings = await Booking.find({
      serviceType: 'Boarding',
      status: 'Approved',
      boardingDates: { $elemMatch: { $gte: start, $lte: end } },
    });

    const capacityMap = {};
    existingBookings.forEach(booking => {
      if (booking.boardingDates) {
        booking.boardingDates.forEach(date => {
          const d = new Date(date);
          if (d >= start && d <= end) {
            const dateStr = d.toISOString().split('T')[0];
            capacityMap[dateStr] = (capacityMap[dateStr] || 0) + 1;
          }
        });
      }
    });

    const result = [];
    const current = new Date(start);
    while (current <= end) {
      const dateStr = current.toISOString().split('T')[0];
      const count = capacityMap[dateStr] || 0;
      result.push({
        date: dateStr,
        status: count >= MAX_BOARDING_CAPACITY ? 'full' : 'available',
        count,
        remainingCapacity: Math.max(MAX_BOARDING_CAPACITY - count, 0),
        capacity: MAX_BOARDING_CAPACITY,
      });
      current.setUTCDate(current.getUTCDate() + 1);
    }

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createBoardingBooking = async (req, res) => {
  try {
    const { petId, boardingDates } = req.body;
    if (!petId || !boardingDates || !boardingDates.length) {
      return res.status(400).json({ message: 'petId and boardingDates array are required' });
    }

    const careType = normalizeCareType(req.body.careType);
    if (!careType) {
      return res.status(400).json({ message: 'careType must be Boarding or Sitting' });
    }

    const parsedDates = parseBoardingDates(boardingDates);
    if (parsedDates.length !== [...new Set(boardingDates)].length) {
      return res.status(400).json({ message: 'boardingDates contains an invalid date' });
    }

    const firstDay = new Date(parsedDates[0]);
    firstDay.setUTCHours(0, 0, 0, 0);
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    if (firstDay < today) {
      return res.status(400).json({ message: 'Boarding or sitting dates cannot start in the past' });
    }

    const { error } = await ensurePetBelongsToUser(petId, req.user._id);
    if (error) {
      return res.status(error.status).json({ message: error.message });
    }

    const conflictMessage = await checkPetDateConflicts(petId, parsedDates);
    if (conflictMessage) {
      return res.status(400).json({ message: conflictMessage });
    }

    const newBooking = await Booking.create({
      userId: req.user._id,
      petId,
      serviceType: 'Boarding',
      careType,
      boardingDates: parsedDates,
      status: 'Pending',
      appointmentDate: parsedDates[0],
      timeSlot: 'N/A',
      dailyRate: SERVICE_RATES[careType],
      totalPrice: calculateTotalPrice(careType, parsedDates),
    });
    applyCareDetails(newBooking, req.body);
    await newBooking.save();

    const { sendNotification } = require('../utils/notificationService');
    sendNotification(
      newBooking.userId,
      `${careType} Request Received`,
      `Your ${careType} request for ${parsedDates.length} day(s) has been received and is pending approval.`
    );

    res.status(201).json({ message: 'Booking created', booking: newBooking });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateBoardingBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    if (booking.serviceType !== 'Boarding') {
      return res.status(400).json({ message: 'This endpoint only updates boarding or sitting bookings' });
    }
    if (booking.status !== 'Pending') {
      return res.status(400).json({ message: 'Only pending boarding or sitting bookings can be edited' });
    }

    let parsedDates = booking.boardingDates;
    if (req.body.boardingDates != null) {
      parsedDates = parseBoardingDates(req.body.boardingDates);
      if (parsedDates.length !== [...new Set(req.body.boardingDates)].length || parsedDates.length === 0) {
        return res.status(400).json({ message: 'boardingDates must contain valid dates' });
      }

      const conflictMessage = await checkPetDateConflicts(booking.petId, parsedDates, booking._id);
      if (conflictMessage) {
        return res.status(400).json({ message: conflictMessage });
      }

      booking.boardingDates = parsedDates;
      booking.appointmentDate = parsedDates[0];
    }

    if (req.body.careType != null) {
      const careType = normalizeCareType(req.body.careType);
      if (!careType) {
        return res.status(400).json({ message: 'careType must be Boarding or Sitting' });
      }
      booking.careType = careType;
    }

    applyCareDetails(booking, req.body);

    const finalCareType = booking.careType || 'Boarding';
    booking.dailyRate = SERVICE_RATES[finalCareType];
    booking.totalPrice = calculateTotalPrice(finalCareType, parsedDates);
    await booking.save();

    res.status(200).json({ message: 'Booking updated', booking });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const firstDay = booking.boardingDates && booking.boardingDates.length > 0
      ? new Date(booking.boardingDates[0])
      : new Date(booking.appointmentDate);

    firstDay.setUTCHours(0, 0, 0, 0);
    if (firstDay - new Date() < 0) {
      return res.status(400).json({ message: 'Cannot cancel an ongoing or past boarding stay' });
    }

    booking.status = 'Cancelled';
    await booking.save();

    const { sendNotification } = require('../utils/notificationService');
    sendNotification(
      booking.userId,
      `${booking.careType || 'Boarding'} Cancelled`,
      `Your ${booking.careType || 'Boarding'} request has been cancelled.`
    );

    res.status(200).json({ message: 'Booking cancelled successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAllBoardingBookings = async (req, res) => {
  try {
    const { status, careType, startDate, endDate } = req.query;
    const query = { serviceType: 'Boarding' };

    if (status) {
      query.status = status;
    }
    if (careType) {
      query.careType = careType;
    }
    if (startDate || endDate) {
      query.boardingDates = { $elemMatch: {} };
      if (startDate) {
        const start = new Date(startDate);
        start.setUTCHours(0, 0, 0, 0);
        query.boardingDates.$elemMatch.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setUTCHours(23, 59, 59, 999);
        query.boardingDates.$elemMatch.$lte = end;
      }
    }

    const bookings = await Booking.find(query)
      .populate('petId', 'name species breed medicalNotes')
      .populate('userId', 'name email phone')
      .sort({ appointmentDate: 1, createdAt: -1 });
    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!ALLOWED_STATUS_UPDATES.includes(status)) {
      return res.status(400).json({ message: 'Invalid booking status' });
    }

    const booking = await Booking.findById(id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.serviceType !== 'Boarding') {
      return res.status(400).json({ message: 'This endpoint only updates boarding or sitting bookings' });
    }

    if (status === 'Approved' && booking.boardingDates && booking.boardingDates.length > 0) {
      for (const date of booking.boardingDates) {
        const { startOfDay, endOfDay } = buildDayRange(date);

        const dailyApprovedCount = await Booking.countDocuments({
          serviceType: 'Boarding',
          status: 'Approved',
          _id: { $ne: id },
          boardingDates: { $elemMatch: { $gte: startOfDay, $lte: endOfDay } },
        });

        if (dailyApprovedCount >= MAX_BOARDING_CAPACITY) {
          const dateStr = startOfDay.toISOString().split('T')[0];
          return res.status(400).json({
            message: `Cannot approve: Boarding house is full on ${dateStr} (max ${MAX_BOARDING_CAPACITY} pets/day)`,
          });
        }
      }
    }

    booking.status = status;
    await booking.save();

    const { sendNotification } = require('../utils/notificationService');
    sendNotification(
      booking.userId,
      `${booking.careType || 'Boarding'} ${status}`,
      `Your ${booking.careType || 'Boarding'} request has been ${status.toLowerCase()}.`
    );

    res.status(200).json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getBoardingSummary = async (req, res) => {
  try {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const [statusCounts, upcomingApproved, revenue] = await Promise.all([
      Booking.aggregate([
        { $match: { serviceType: 'Boarding' } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Booking.countDocuments({
        serviceType: 'Boarding',
        status: 'Approved',
        boardingDates: { $elemMatch: { $gte: today } },
      }),
      Booking.aggregate([
        { $match: { serviceType: 'Boarding', status: 'Approved' } },
        { $group: { _id: '$careType', totalRevenue: { $sum: '$totalPrice' }, bookings: { $sum: 1 } } },
      ]),
    ]);

    res.status(200).json({
      capacityPerDay: MAX_BOARDING_CAPACITY,
      upcomingApproved,
      statusCounts: statusCounts.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      revenueByCareType: revenue.map(item => ({
        careType: item._id || 'Boarding',
        totalRevenue: item.totalRevenue || 0,
        bookings: item.bookings,
      })),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getPetBookedDates = async (req, res) => {
  try {
    const { petId } = req.query;
    if (!petId) return res.status(400).json({ message: 'petId is required' });

    const { error } = await ensurePetBelongsToUser(petId, req.user._id);
    if (error) {
      return res.status(error.status).json({ message: error.message });
    }

    const bookings = await Booking.find({
      petId,
      serviceType: 'Boarding',
      status: { $in: ACTIVE_STATUSES },
    }).select('boardingDates status careType');

    const dates = [];
    bookings.forEach(b => {
      if (b.boardingDates) {
        b.boardingDates.forEach(d => {
          dates.push({
            date: new Date(d).toISOString().split('T')[0],
            status: b.status,
            careType: b.careType || 'Boarding',
          });
        });
      }
    });

    res.status(200).json(dates);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getBoardingServices,
  getBoardingAvailability,
  getPetBookedDates,
  createBoardingBooking,
  updateBoardingBooking,
  cancelBooking,
  getAllBoardingBookings,
  updateBookingStatus,
  getBoardingSummary,
};
