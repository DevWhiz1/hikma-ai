const Notification = require('../models/Notification');
const Enrollment = require('../models/Enrollment');
const User = require('../models/User');
const ChatSession = require('../models/ChatSession');
const nodemailer = require('nodemailer');

// Email transporter (using existing Gmail config)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS
  }
});

class NotificationService {
  /**
   * Get Socket.IO instance (initialized in index.js)
   */
  static getIO() {
    // Will be set by index.js: NotificationService.io = io
    return this.io;
  }

  /**
   * Send notification via Socket.IO to user's room
   */
  static async sendSocketNotification(userId, notification) {
    try {
      const io = this.getIO();
      if (io) {
        io.to(`user-${userId.toString()}`).emit('notification', notification);
        console.log(`[NotificationService] Socket notification sent to user ${userId}`);
      }
    } catch (error) {
      console.error('[NotificationService] Socket emit failed:', error.message);
    }
  }

  /**
   * Send email notification
   */
  static async sendEmailNotification(userEmail, subject, htmlContent) {
    try {
      if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
        console.warn('[NotificationService] Email credentials not configured, skipping email');
        return;
      }

      const info = await transporter.sendMail({
        from: `"Hikma AI" <${process.env.GMAIL_USER}>`,
        to: userEmail,
        subject,
        html: htmlContent
      });

      console.log(`[NotificationService] Email sent to ${userEmail}: ${info.messageId}`);
    } catch (error) {
      console.error('[NotificationService] Email send failed:', error.message);
    }
  }

  /**
   * Create in-app notification and send real-time socket event
   */
  static async createNotification(userId, type, title, message, metadata = {}, link = null, priority = 'normal') {
    try {
      const notification = await Notification.create({
        userId,
        type,
        title,
        message,
        metadata,
        link,
        priority
      });

      // Send real-time notification via socket
      await this.sendSocketNotification(userId, notification);

      return notification;
    } catch (error) {
      console.error('[NotificationService] Failed to create notification:', error.message);
      throw error;
    }
  }

  /**
   * Send notification message to Scholar chat session
   */
  static async sendChatNotification(enrollmentId, assignmentId, assignmentTitle, assignmentKind, scholarName) {
    try {
      const enrollment = await Enrollment.findById(enrollmentId)
        .populate('student', 'name')
        .populate('scholar', 'user');

      if (!enrollment) {
        console.warn('[NotificationService] Enrollment not found for chat notification');
        return;
      }

      // Find or use the student's chat session with this scholar
      let chatSession = await ChatSession.findOne({
        user: enrollment.student._id,
        scholar: enrollment.scholar._id,
        kind: 'scholar' // scholar chat type
      }).sort('-lastActivity');

      if (!chatSession) {
        console.warn('[NotificationService] No chat session found, skipping chat notification');
        return;
      }

      // Add system message to chat
      const systemMessage = {
        role: 'system',
        content: `📢 **New ${assignmentKind === 'quiz' ? 'Quiz' : 'Assignment'} Published**\n\n**Title:** ${assignmentTitle}\n**From:** ${scholarName}\n\n[Click here to view and start](/assignments/${assignmentId}/take)`
      };

      chatSession.messages.push(systemMessage);
      chatSession.lastActivity = new Date();
      await chatSession.save();

      // Emit socket event for real-time chat update
      const io = this.getIO();
      if (io) {
        io.to(`user-${enrollment.student._id.toString()}`).emit('chat-message', {
          sessionId: chatSession._id,
          message: systemMessage
        });
      }

      console.log(`[NotificationService] Chat notification sent for assignment ${assignmentId}`);
    } catch (error) {
      console.error('[NotificationService] Chat notification failed:', error.message);
    }
  }

  /**
   * Main method: Notify student when assignment/quiz is published
   */
  static async notifyAssignmentPublished(assignment) {
    try {
      // Populate enrollment to get student details
      const enrollment = await Enrollment.findById(assignment.enrollmentId)
        .populate('student', 'email name')
        .populate('scholar', 'user');

      if (!enrollment || !enrollment.student) {
        console.warn('[NotificationService] Enrollment or student not found');
        return;
      }

      const student = enrollment.student;
      const scholarUser = await User.findById(assignment.createdBy).select('name');
      const scholarName = scholarUser ? scholarUser.name : 'Your Scholar';

      const isQuiz = assignment.kind === 'quiz';
      const title = `New ${isQuiz ? 'Quiz' : 'Assignment'} Published`;
      const message = `${scholarName} has published: "${assignment.title}"`;

      // 1. Create in-app notification
      const link = `/assignments/${assignment._id}/take`;
      await this.createNotification(
        student._id,
        isQuiz ? 'quiz' : 'assignment',
        title,
        message,
        {
          assignmentId: assignment._id,
          enrollmentId: assignment.enrollmentId,
          scholarId: enrollment.scholar._id,
          scholarName,
          assignmentTitle: assignment.title,
          kind: assignment.kind,
          dueDate: assignment.dueDate,
          durationMinutes: assignment.durationMinutes
        },
        link,
        'high'
      );

      // 2. Send email notification
      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; padding: 12px 24px; background: #10b981; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
            .details { background: white; padding: 15px; border-radius: 6px; margin: 15px 0; }
            .label { font-weight: bold; color: #059669; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>🎓 ${title}</h2>
            </div>
            <div class="content">
              <p>Dear ${student.name},</p>
              <p>${message}</p>
              
              <div class="details">
                <p><span class="label">Title:</span> ${assignment.title}</p>
                ${assignment.description ? `<p><span class="label">Description:</span> ${assignment.description.substring(0, 200)}${assignment.description.length > 200 ? '...' : ''}</p>` : ''}
                ${assignment.aiSpec?.topic ? `<p><span class="label">Topic:</span> ${assignment.aiSpec.topic}</p>` : ''}
                ${assignment.dueDate ? `<p><span class="label">Due Date:</span> ${new Date(assignment.dueDate).toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' })}</p>` : ''}
                ${isQuiz && assignment.durationMinutes ? `<p><span class="label">Duration:</span> ${assignment.durationMinutes} minutes</p>` : ''}
                ${isQuiz && assignment.quizWindowStart ? `<p><span class="label">Available From:</span> ${new Date(assignment.quizWindowStart).toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' })}</p>` : ''}
              </div>

              <p>Log in to Hikma AI to ${isQuiz ? 'start your quiz' : 'view and complete the assignment'}.</p>
              
              <a href="${process.env.APP_BASE_URL}assignments/${assignment._id}/take" class="button">
                ${isQuiz ? '▶️ Start Quiz' : '📝 View Assignment'}
              </a>

              <p style="margin-top: 30px; font-size: 0.9em; color: #6b7280;">
                Best regards,<br>
                <strong>Hikma AI Team</strong>
              </p>
            </div>
          </div>
        </body>
        </html>
      `;

      await this.sendEmailNotification(student.email, title, emailHtml);

      // 3. Send notification to scholar chat
      await this.sendChatNotification(
        assignment.enrollmentId,
        assignment._id,
        assignment.title,
        assignment.kind,
        scholarName
      );

      console.log(`[NotificationService] All notifications sent for assignment ${assignment._id}`);
    } catch (error) {
      console.error('[NotificationService] Failed to notify assignment published:', error.message);
    }
  }

  /**
   * Notify student when their submission is graded
   */
  static async notifySubmissionGraded(submission, assignment) {
    try {
      const enrollment = await Enrollment.findById(assignment.enrollmentId)
        .populate('student', 'email name');

      if (!enrollment || !enrollment.student) return;

      const student = enrollment.student;
      const scholarUser = await User.findById(assignment.createdBy).select('name');
      const scholarName = scholarUser ? scholarUser.name : 'Your Scholar';

      const title = `${assignment.kind === 'quiz' ? 'Quiz' : 'Assignment'} Graded`;
      const score = submission.manualGrading?.totalScore || submission.aiGrading?.totalScore || 0;
      const message = `Your submission for "${assignment.title}" has been graded. Score: ${score}`;

      await this.createNotification(
        student._id,
        'grade',
        title,
        message,
        {
          assignmentId: assignment._id,
          submissionId: submission._id,
          scholarName,
          assignmentTitle: assignment.title,
          score
        },
        `/me/submissions`,
        'normal'
      );

      // Optional: send email for grade
      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <body style="font-family: Arial, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #10b981;">📊 ${title}</h2>
            <p>Dear ${student.name},</p>
            <p>${scholarName} has graded your submission for <strong>"${assignment.title}"</strong>.</p>
            <p style="font-size: 1.2em;"><strong>Score: ${score}</strong></p>
            ${submission.manualGrading?.feedback ? `<p><strong>Feedback:</strong> ${submission.manualGrading.feedback}</p>` : ''}
            <p><a href="${process.env.APP_BASE_URL}me/submissions" style="display: inline-block; padding: 10px 20px; background: #10b981; color: white; text-decoration: none; border-radius: 5px;">View Details</a></p>
            <p>Best regards,<br>Hikma AI Team</p>
          </div>
        </body>
        </html>
      `;

      await this.sendEmailNotification(student.email, title, emailHtml);

      console.log(`[NotificationService] Grade notification sent for submission ${submission._id}`);
    } catch (error) {
      console.error('[NotificationService] Failed to notify grade:', error.message);
    }
  }
}

module.exports = NotificationService;
