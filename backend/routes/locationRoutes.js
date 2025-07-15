/**
 * Location Routes
 * Routes for location verification and city data
 */

const express = require('express');
const router = express.Router();
const locationController = require('../controllers/locationController');
const auth = require('../middleware/auth');

// Location verification route (requires authentication)
router.post('/verify', auth, locationController.verifyLocation);

// Get cities by country (public route)
router.get('/cities/:country', locationController.getCitiesByCountry);

// IP geolocation proxy to avoid CORS issues (public route)
router.get('/ip-info', locationController.getIpInfo);

module.exports = router;
