const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const SavedSearch = require('../models/SavedSearch');
const authenticate = require('../middleware/authenticate');

router.use(authenticate);
router.use((req, res, next) => {
  if (req.user.role !== 'seeker') {
    return res.status(403).json({ message: 'Only seekers can create saved searches' });
  }
  next();
});

router.get('/', async (req, res) => {
  try {
    const savedSearches = await SavedSearch.find({ userId: req.user.id }).sort('-createdAt');
    res.json(savedSearches);
  } catch (error) {
    console.error('GET /saved-searches error:', error.message);
    res.status(500).json({ message: 'Failed to load saved searches' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, search = '', categories = [], locations = [], salaryMinimum = null, salaryMaximum = null } = req.body;
    if (typeof name !== 'string' || !name.trim() || name.trim().length > 80) {
      return res.status(400).json({ message: 'Name must be between 1 and 80 characters' });
    }
    if (typeof search !== 'string' || search.length > 120
      || !Array.isArray(categories) || categories.length > 20
      || !categories.every(value => typeof value === 'string' && value.length <= 80)
      || !Array.isArray(locations) || locations.length > 60
      || !locations.every(value => typeof value === 'string' && value.length <= 80)) {
      return res.status(400).json({ message: 'Invalid saved search criteria' });
    }

    const minimum = salaryMinimum === '' || salaryMinimum == null ? null : Number(salaryMinimum);
    const maximum = salaryMaximum === '' || salaryMaximum == null ? null : Number(salaryMaximum);
    if ((minimum !== null && (!Number.isFinite(minimum) || minimum < 0))
      || (maximum !== null && (!Number.isFinite(maximum) || maximum < 0))
      || (minimum !== null && maximum !== null && minimum > maximum)) {
      return res.status(400).json({ message: 'Enter a valid salary range' });
    }
    if (!search.trim() && categories.length === 0 && locations.length === 0
      && minimum === null && maximum === null) {
      return res.status(400).json({ message: 'Add a search term or filter before saving an alert' });
    }

    const savedSearch = await SavedSearch.create({
      userId: new mongoose.Types.ObjectId(req.user.id),
      name: name.trim(),
      search: search.trim(),
      categories: [...new Set(categories)],
      locations: [...new Set(locations)],
      salaryMinimum: minimum,
      salaryMaximum: maximum,
    });
    res.status(201).json(savedSearch);
  } catch (error) {
    console.error('POST /saved-searches error:', error.message);
    res.status(500).json({ message: 'Failed to save search' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid saved search ID' });
    }
    const deleted = await SavedSearch.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });
    if (!deleted) return res.status(404).json({ message: 'Saved search not found' });
    res.status(204).end();
  } catch (error) {
    console.error('DELETE /saved-searches/:id error:', error.message);
    res.status(500).json({ message: 'Failed to delete saved search' });
  }
});

module.exports = router;
