const express = require('express');
const { addPet, getPets, updatePet, deletePet } = require('../controllers/petController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Apply auth middleware to all routes
router.use(protect);

router.route('/')
  .post(addPet)
  .get(getPets);

router.route('/:id')
  .put(updatePet)
  .delete(deletePet);

module.exports = router;
