const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const ChatSession = require('./models/ChatSession');
const Enrollment = require('./models/Enrollment');

async function cleanupDuplicateChats() {
  try {
    console.log('🔍 Starting duplicate chat cleanup...');

    // Find all enrollments
    const enrollments = await Enrollment.find({}).populate('student scholar');
    console.log(`📊 Found ${enrollments.length} enrollments`);

    let duplicatesRemoved = 0;
    let orphanedSessionsRemoved = 0;

    // Group enrollments by student-scholar pair
    const enrollmentMap = new Map();
    
    for (const enrollment of enrollments) {
      const key = `${enrollment.student._id}-${enrollment.scholar._id}`;
      
      if (!enrollmentMap.has(key)) {
        enrollmentMap.set(key, []);
      }
      enrollmentMap.get(key).push(enrollment);
    }

    // Process each student-scholar pair
    for (const [key, enrollmentGroup] of enrollmentMap) {
      if (enrollmentGroup.length > 1) {
        console.log(`⚠️  Found ${enrollmentGroup.length} enrollments for pair: ${key}`);
        
        // Keep the first enrollment, remove the rest
        const [keepEnrollment, ...duplicateEnrollments] = enrollmentGroup;
        
        for (const duplicateEnrollment of duplicateEnrollments) {
          console.log(`🗑️  Removing duplicate enrollment: ${duplicateEnrollment._id}`);
          
          // Remove the duplicate enrollment
          await Enrollment.findByIdAndDelete(duplicateEnrollment._id);
          duplicatesRemoved++;
          
          // Remove associated chat sessions if they exist
          if (duplicateEnrollment.studentSession) {
            await ChatSession.findByIdAndDelete(duplicateEnrollment.studentSession);
            orphanedSessionsRemoved++;
          }
          if (duplicateEnrollment.scholarSession) {
            await ChatSession.findByIdAndDelete(duplicateEnrollment.scholarSession);
            orphanedSessionsRemoved++;
          }
        }
      }
    }

    // Find orphaned chat sessions (sessions not referenced by any enrollment)
    console.log('🔍 Checking for orphaned chat sessions...');
    
    const allEnrollments = await Enrollment.find({});
    const referencedSessionIds = new Set();
    
    for (const enrollment of allEnrollments) {
      if (enrollment.studentSession) {
        referencedSessionIds.add(enrollment.studentSession.toString());
      }
      if (enrollment.scholarSession) {
        referencedSessionIds.add(enrollment.scholarSession.toString());
      }
    }

    // Find direct chat sessions that are not referenced
    const orphanedSessions = await ChatSession.find({
      kind: 'direct',
      _id: { $nin: Array.from(referencedSessionIds) }
    });

    console.log(`📊 Found ${orphanedSessions.length} orphaned direct chat sessions`);

    for (const session of orphanedSessions) {
      console.log(`🗑️  Removing orphaned session: ${session._id} (${session.title})`);
      await ChatSession.findByIdAndDelete(session._id);
      orphanedSessionsRemoved++;
    }

    // Find duplicate chat sessions with same user and title
    console.log('🔍 Checking for duplicate chat sessions with same user and title...');
    
    const sessions = await ChatSession.find({ kind: 'direct' });
    const sessionGroups = new Map();
    
    for (const session of sessions) {
      const key = `${session.user}-${session.title}`;
      if (!sessionGroups.has(key)) {
        sessionGroups.set(key, []);
      }
      sessionGroups.get(key).push(session);
    }

    for (const [key, sessionGroup] of sessionGroups) {
      if (sessionGroup.length > 1) {
        console.log(`⚠️  Found ${sessionGroup.length} sessions with same user and title: ${key}`);
        
        // Keep the first session, remove the rest
        const [keepSession, ...duplicateSessions] = sessionGroup;
        
        for (const duplicateSession of duplicateSessions) {
          console.log(`🗑️  Removing duplicate session: ${duplicateSession._id}`);
          await ChatSession.findByIdAndDelete(duplicateSession._id);
          orphanedSessionsRemoved++;
        }
      }
    }

    console.log('\n🎉 === CLEANUP SUMMARY ===');
    console.log(`✅ Duplicate enrollments removed: ${duplicatesRemoved}`);
    console.log(`✅ Orphaned chat sessions removed: ${orphanedSessionsRemoved}`);
    console.log('🎉 Cleanup completed successfully!');

    return {
      duplicatesRemoved,
      orphanedSessionsRemoved
    };

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    throw error;
  }
}

// Run the cleanup
cleanupDuplicateChats()
  .then(() => {
    console.log('✅ Cleanup script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Cleanup script failed:', error);
    process.exit(1);
  });
