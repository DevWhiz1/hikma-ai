function filterSensitive(text) {
  const patterns = [
    /\b\d{11,}\b/g, // long numbers (phone)
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z]{2,}\b/gi, // email
    /\b\d{1,4}\s+\w+\s+(Street|St|Road|Rd|Ave|Block)\b/gi, // address
    // allow Meet links and codes: removed from redaction
  ];
  let warn = false;
  let filtered = text;
  patterns.forEach((p) => {
    if (p.test(filtered)) {
      filtered = filtered.replace(p, '[REDACTED]');
      warn = true;
    }
  });
  return { filtered, warn };
}

function filterContactInfo(text) {
  // Phone number patterns (various formats)
  const phonePatterns = [
    /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, // 123-456-7890, 123.456.7890, 1234567890
    /\b\(\d{3}\)\s*\d{3}[-.]?\d{4}\b/g, // (123) 456-7890, (123)456-7890
    /\b\d{3}\s\d{3}\s\d{4}\b/g, // 123 456 7890
    /\b\+1[-.]?\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, // +1-123-456-7890
    /\b1[-.]?\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, // 1-123-456-7890
    /\b\d{10}\b/g, // 1234567890 (10 digits)
    /\b\d{11}\b/g, // 11234567890 (11 digits starting with 1)
  ];
  
  // Email patterns
  const emailPatterns = [
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z]{2,}\b/gi, // standard email
    /\b[A-Za-z0-9._%+-]+\s*@\s*[A-Za-z0-9.-]+\s*\.\s*[A-Z]{2,}\b/gi, // email with spaces
  ];
  
  let hasPhone = false;
  let hasEmail = false;
  let filtered = text;
  
  // Check for phone numbers
  phonePatterns.forEach((pattern) => {
    if (pattern.test(filtered)) {
      filtered = filtered.replace(pattern, '[PHONE NUMBER BLOCKED - Contact information not allowed]');
      hasPhone = true;
    }
  });
  
  // Check for emails
  emailPatterns.forEach((pattern) => {
    if (pattern.test(filtered)) {
      filtered = filtered.replace(pattern, '[EMAIL BLOCKED - Contact information not allowed]');
      hasEmail = true;
    }
  });
  
  return { filtered, hasPhone, hasEmail, hasContactInfo: hasPhone || hasEmail };
}

function filterMeetingLinks(text) {
  // Block all major meeting platforms
  const meetingPatterns = [
    // Zoom
    /https?:\/\/(?:www\.)?(?:zoom\.us\/j\/|zoom\.us\/my\/|zoom\.us\/meeting\/join\/)\S*/gi,
    /https?:\/\/(?:www\.)?(?:zoom\.us\/s\/)\S*/gi,
    /https?:\/\/(?:www\.)?(?:zoom\.us\/p\/)\S*/gi,
    /https?:\/\/(?:www\.)?(?:zoom\.us\/webinar\/register\/)\S*/gi,
    
    // Google Meet
    /https?:\/\/(?:meet\.google\.com\/[a-z-]+)/gi,
    /https?:\/\/(?:meet\.google\.com\/[a-z-]+\?[^\\s]*)/gi,
    
    // Microsoft Teams
    /https?:\/\/(?:teams\.microsoft\.com\/l\/meetup-join\/)\S*/gi,
    /https?:\/\/(?:teams\.live\.com\/meet\/)\S*/gi,
    
    // WebEx
    /https?:\/\/(?:[a-z0-9-]+\.webex\.com\/meet\/)\S*/gi,
    /https?:\/\/(?:[a-z0-9-]+\.webex\.com\/join\/)\S*/gi,
    
    // GoToMeeting
    /https?:\/\/(?:global\.gotomeeting\.com\/join\/)\S*/gi,
    /https?:\/\/(?:app\.gotomeeting\.com\/join\/)\S*/gi,
    
    // BlueJeans
    /https?:\/\/(?:bluejeans\.com\/)\S*/gi,
    
    // Jitsi (external)
    /https?:\/\/(?:meet\.jit\.si\/)\S*/gi,
    /https?:\/\/(?:[a-z0-9-]+\.jitsi\.meet\/)\S*/gi,
    
    // Discord
    /https?:\/\/(?:discord\.gg\/)\S*/gi,
    /https?:\/\/(?:discord\.com\/invite\/)\S*/gi,
    
    // Skype
    /https?:\/\/(?:join\.skype\.com\/)\S*/gi,
    /https?:\/\/(?:meet\.skype\.com\/)\S*/gi,
    
    // Whereby
    /https?:\/\/(?:whereby\.com\/)\S*/gi,
    
    // BigBlueButton
    /https?:\/\/(?:[a-z0-9-]+\.bigbluebutton\.org\/)\S*/gi,
    
    // Generic meeting room patterns
    /https?:\/\/(?:[a-z0-9-]+\.meet\.com\/)\S*/gi,
    /https?:\/\/(?:[a-z0-9-]+\.zoom\.us\/)\S*/gi,
    /https?:\/\/(?:[a-z0-9-]+\.teams\.microsoft\.com\/)\S*/gi,
  ];
  
  let hasMeetingLink = false;
  let filtered = text;
  
  meetingPatterns.forEach((pattern) => {
    if (pattern.test(filtered)) {
      filtered = filtered.replace(pattern, '[MEETING LINK BLOCKED - Use the built-in meeting system]');
      hasMeetingLink = true;
    }
  });
  
  return { filtered, hasMeetingLink };
}

function detectAllLinks(text) {
  // Comprehensive link detection patterns
  const linkPatterns = [
    // HTTP/HTTPS URLs
    /https?:\/\/[^\s]+/gi,
    // www links
    /www\.[^\s]+/gi,
    // ftp links
    /ftp:\/\/[^\s]+/gi,
    // file links
    /file:\/\/[^\s]+/gi,
    // mailto links
    /mailto:[^\s]+/gi,
    // tel links
    /tel:[^\s]+/gi,
  ];
  
  const links = [];
  linkPatterns.forEach((pattern) => {
    const matches = text.match(pattern);
    if (matches) {
      links.push(...matches);
    }
  });
  
  return { hasLinks: links.length > 0, links };
}

module.exports = { filterSensitive, filterMeetingLinks, filterContactInfo, detectAllLinks };


