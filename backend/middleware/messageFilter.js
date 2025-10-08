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

module.exports = { filterSensitive };


