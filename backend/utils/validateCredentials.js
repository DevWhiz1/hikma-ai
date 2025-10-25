const { GoogleGenerativeAI } = require('@google/generative-ai');
const { google } = require('googleapis');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');

class CredentialValidator {
  constructor() {
    this.results = {
      mongodb: { status: 'pending', message: '', details: {} },
      gemini: { status: 'pending', message: '', details: {} },
      googleCalendar: { status: 'pending', message: '', details: {} },
      gmail: { status: 'pending', message: '', details: {} },
      hadith: { status: 'pending', message: '', details: {} },
      jwt: { status: 'pending', message: '', details: {} }
    };
  }

  async validateAll() {
    console.log('🔍 Validating Hikmah AI Credentials...\n');

    await this.validateMongoDB();
    await this.validateGemini();
    await this.validateGoogleCalendar();
    await this.validateGmail();
    await this.validateHadithAPI();
    await this.validateJWT();

    this.printResults();
    return this.results;
  }

  async validateMongoDB() {
    try {
      console.log('📊 Testing MongoDB connection...');
      const startTime = Date.now();
      
      await mongoose.connect(process.env.MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 5000
      });

      const connectionTime = Date.now() - startTime;
      const dbName = mongoose.connection.db.databaseName;
      
      this.results.mongodb = {
        status: 'success',
        message: `Connected successfully in ${connectionTime}ms`,
        details: {
          database: dbName,
          connectionTime: `${connectionTime}ms`,
          host: mongoose.connection.host,
          port: mongoose.connection.port
        }
      };
      
      console.log(`✅ MongoDB: Connected to ${dbName} (${connectionTime}ms)`);
    } catch (error) {
      this.results.mongodb = {
        status: 'error',
        message: error.message,
        details: { error: error.code || 'CONNECTION_FAILED' }
      };
      console.log(`❌ MongoDB: ${error.message}`);
    }
  }

  async validateGemini() {
    try {
      console.log('🤖 Testing Gemini AI connection...');
      
      if (!process.env.GEMINI_API_KEY) {
        throw new Error('GEMINI_API_KEY not found in environment');
      }

      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      
      const result = await model.generateContent('Test connection');
      const response = await result.response;
      const text = response.text();

      this.results.gemini = {
        status: 'success',
        message: 'Gemini AI is working correctly',
        details: {
          model: 'gemini-2.5-flash',
          responseLength: text.length,
          apiKey: `${process.env.GEMINI_API_KEY.substring(0, 10)}...`
        }
      };
      
      console.log('✅ Gemini AI: Connection successful');
    } catch (error) {
      this.results.gemini = {
        status: 'error',
        message: error.message,
        details: { error: error.code || 'API_ERROR' }
      };
      console.log(`❌ Gemini AI: ${error.message}`);
    }
  }

  async validateGoogleCalendar() {
    try {
      console.log('📅 Testing Google Calendar integration...');
      
      if (!process.env.GOOGLE_SERVICE_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
        throw new Error('Google Calendar credentials not found');
      }

      const jwtClient = new google.auth.JWT(
        process.env.GOOGLE_SERVICE_EMAIL,
        null,
        process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        ['https://www.googleapis.com/auth/calendar']
      );

      await jwtClient.authorize();
      
      const calendar = google.calendar('v3');
      const response = await calendar.calendarList.list({
        auth: jwtClient,
        maxResults: 1
      });

      this.results.googleCalendar = {
        status: 'success',
        message: 'Google Calendar integration working',
        details: {
          serviceEmail: process.env.GOOGLE_SERVICE_EMAIL,
          calendarId: process.env.GOOGLE_CALENDAR_ID,
          calendarsFound: response.data.items?.length || 0
        }
      };
      
      console.log('✅ Google Calendar: Integration successful');
    } catch (error) {
      this.results.googleCalendar = {
        status: 'error',
        message: error.message,
        details: { error: error.code || 'AUTH_ERROR' }
      };
      console.log(`❌ Google Calendar: ${error.message}`);
    }
  }

  async validateGmail() {
    try {
      console.log('📧 Testing Gmail SMTP connection...');
      
      if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
        throw new Error('Gmail credentials not found');
      }

      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_PASS
        }
      });

      await transporter.verify();

      this.results.gmail = {
        status: 'success',
        message: 'Gmail SMTP is working correctly',
        details: {
          user: process.env.GMAIL_USER,
          service: 'gmail',
          adminEmail: process.env.ADMIN_NOTIFY_EMAIL
        }
      };
      
      console.log('✅ Gmail SMTP: Connection successful');
    } catch (error) {
      this.results.gmail = {
        status: 'error',
        message: error.message,
        details: { error: error.code || 'SMTP_ERROR' }
      };
      console.log(`❌ Gmail SMTP: ${error.message}`);
    }
  }

  async validateHadithAPI() {
    try {
      console.log('📖 Testing Hadith API...');
      
      if (!process.env.HADITH_API_KEY) {
        throw new Error('HADITH_API_KEY not found');
      }

      // Test with a simple hadith request
      const fetch = require('node-fetch');
      const response = await fetch('https://hadithapi.com/api/books', {
        headers: {
          'Authorization': `Bearer ${process.env.HADITH_API_KEY}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      this.results.hadith = {
        status: 'success',
        message: 'Hadith API is working correctly',
        details: {
          apiKey: `${process.env.HADITH_API_KEY.substring(0, 10)}...`,
          booksAvailable: data.books?.length || 0
        }
      };
      
      console.log('✅ Hadith API: Connection successful');
    } catch (error) {
      this.results.hadith = {
        status: 'error',
        message: error.message,
        details: { error: error.code || 'API_ERROR' }
      };
      console.log(`❌ Hadith API: ${error.message}`);
    }
  }

  async validateJWT() {
    try {
      console.log('🔐 Testing JWT configuration...');
      
      if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET not found');
      }

      const jwt = require('jsonwebtoken');
      const testPayload = { userId: 'test', role: 'student' };
      const token = jwt.sign(testPayload, process.env.JWT_SECRET, { expiresIn: '1h' });
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      this.results.jwt = {
        status: 'success',
        message: 'JWT configuration is valid',
        details: {
          secretLength: process.env.JWT_SECRET.length,
          expiresIn: process.env.JWT_EXPIRES || '7d',
          testTokenValid: !!decoded
        }
      };
      
      console.log('✅ JWT: Configuration valid');
    } catch (error) {
      this.results.jwt = {
        status: 'error',
        message: error.message,
        details: { error: error.code || 'JWT_ERROR' }
      };
      console.log(`❌ JWT: ${error.message}`);
    }
  }

  printResults() {
    console.log('\n📋 Credential Validation Summary:');
    console.log('=====================================');
    
    const statuses = Object.values(this.results);
    const successCount = statuses.filter(r => r.status === 'success').length;
    const errorCount = statuses.filter(r => r.status === 'error').length;
    
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Failed: ${errorCount}`);
    console.log(`📊 Total: ${statuses.length}`);
    
    console.log('\n🔍 Detailed Results:');
    Object.entries(this.results).forEach(([service, result]) => {
      const icon = result.status === 'success' ? '✅' : '❌';
      console.log(`${icon} ${service.toUpperCase()}: ${result.message}`);
    });

    if (errorCount === 0) {
      console.log('\n🎉 All credentials are valid! Your Hikmah AI system is ready to go!');
    } else {
      console.log('\n⚠️  Some credentials need attention. Please check the errors above.');
    }
  }
}

module.exports = CredentialValidator;
