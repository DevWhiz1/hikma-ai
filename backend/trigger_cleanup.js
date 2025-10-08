const http = require('http');

// Simple function to make HTTP request
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    
    req.on('error', reject);
    req.end();
  });
}

async function triggerCleanup() {
  try {
    console.log('🔍 Triggering cleanup via HTTP request...');
    
    // Make a POST request to the cleanup endpoint
    const response = await makeRequest('http://localhost:5000/api/admin/cleanup-duplicate-chats', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Note: You'll need a valid admin token for this to work
        // For now, let's try without authentication to see if it works
      }
    });
    
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));
    
    if (response.status === 200) {
      console.log('✅ Cleanup completed successfully!');
    } else {
      console.log('❌ Cleanup failed or requires authentication');
    }
    
  } catch (error) {
    console.error('❌ Error calling cleanup:', error);
  }
}

triggerCleanup();
