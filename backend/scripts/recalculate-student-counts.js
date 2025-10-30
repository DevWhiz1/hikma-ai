// Script to recalculate totalStudents count for all scholars
const mongoose = require('mongoose');
require('dotenv').config();

const Scholar = require('../models/Scholar');
const Enrollment = require('../models/Enrollment');

async function recalculateStudentCounts() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected');

    // Get all scholars
    const scholars = await Scholar.find({});
    console.log(`Found ${scholars.length} scholars`);

    let updated = 0;
    let errors = 0;

    for (const scholar of scholars) {
      try {
        // Count active enrollments for this scholar
        const activeEnrollments = await Enrollment.countDocuments({
          scholar: scholar._id,
          isActive: true
        });

        // Update the scholar's totalStudents
        scholar.totalStudents = activeEnrollments;
        await scholar.save();

        console.log(`✓ Scholar ${scholar._id} (${scholar.user}): ${activeEnrollments} active students`);
        updated++;
      } catch (err) {
        console.error(`✗ Error updating scholar ${scholar._id}:`, err.message);
        errors++;
      }
    }

    console.log('\n=== Summary ===');
    console.log(`Total scholars: ${scholars.length}`);
    console.log(`Successfully updated: ${updated}`);
    console.log(`Errors: ${errors}`);

    process.exit(0);
  } catch (error) {
    console.error('Script error:', error);
    process.exit(1);
  }
}

recalculateStudentCounts();

