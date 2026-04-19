const mongoose = require('mongoose');

const petSchema = new mongoose.Schema({
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  species: {
    type: String,
    required: true,
  },
  breed: {
    type: String,
  },
  age: {
    type: Number,
  },
  image: {
    type: String,
  },
  medicalNotes: {
    type: String,
  },
}, {
  timestamps: true
});

const Pet = mongoose.model('Pet', petSchema);
module.exports = Pet;
