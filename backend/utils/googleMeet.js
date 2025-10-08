const { google } = require('googleapis');
const crypto = require('crypto');

const calendar = google.calendar('v3');

async function createMeetEvent({ scholarName, studentName, scholarEmail, studentEmail, topic }) {
  const jwtClient = new google.auth.JWT(
    process.env.GOOGLE_SERVICE_EMAIL,
    null,
    (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    ['https://www.googleapis.com/auth/calendar']
  );
  await jwtClient.authorize();

  const event = {
    summary: `Hikmah AI Session: ${topic}`,
    description: `Session between ${scholarName} and ${studentName}`,
    start: { dateTime: new Date(Date.now() + 5 * 60 * 1000).toISOString() },
    end: { dateTime: new Date(Date.now() + 65 * 60 * 1000).toISOString() },
    conferenceData: { createRequest: { requestId: crypto.randomUUID() } }
  };

  const res = await calendar.events.insert({
    auth: jwtClient,
    calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
    resource: event,
    conferenceDataVersion: 1
  });

  // Some tenants return link under conferenceData.entryPoints
  return res.data.hangoutLink || res.data?.conferenceData?.entryPoints?.find(e => e.entryPointType === 'video')?.uri;
}

module.exports = { createMeetEvent };


