const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/dashboard', authMiddleware, userController.dashboard);
router.get('/g', authMiddleware, userController.gPage);
router.get('/appointment', authMiddleware, userController.appointmentPage);
router.post('/g', authMiddleware, userController.updateCarInfo);
router.get('/g2', authMiddleware, userController.g2Page);
router.post('/g2', authMiddleware, userController.g2Post);
router.post('/appointment', authMiddleware, userController.appointmentPost);
router.get('/slots-aval', authMiddleware, userController.checkSlots);



module.exports = router;
