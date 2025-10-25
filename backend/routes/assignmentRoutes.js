const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const ctrl = require('../controllers/assignmentController');

// Scholar/admin creating and managing assignments
router.post('/', auth, ctrl.createAssignment);
router.post('/:id/generate', auth, ctrl.generateAssignmentAI);
router.post('/:id/publish', auth, ctrl.publishAssignment);
router.post('/:id/close', auth, ctrl.closeAssignment);
router.put('/:id', auth, ctrl.updateAssignment);

// Manual questions management
router.post('/:id/questions', auth, ctrl.addQuestion);
router.put('/:id/questions/:qid', auth, ctrl.updateQuestion);
router.delete('/:id/questions/:qid', auth, ctrl.deleteQuestion);
router.put('/:id', auth, ctrl.updateAssignment);

// Listing and details
router.get('/', auth, ctrl.listAssignments);
router.get('/:id', auth, ctrl.getAssignment);

module.exports = router;
