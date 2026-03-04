const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const app = require('../../src/app');
const User = require('../../src/models/User');
const OtpChallenge = require('../../src/models/OtpChallenge');

let mongoServer;

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-jwt-secret';
  process.env.OTP_TEST_CODE = '654321';

  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterEach(async () => {
  await User.deleteMany({});
  await OtpChallenge.deleteMany({});
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();
});

describe('OTP authentication e2e security checks', () => {
  test('enforces OTP request limits within request window', async () => {
    await User.create({
      name: 'Rate Limited User',
      email: 'rate.limit@example.com',
      password: 'Password123!',
      role: 'student',
      roomNumber: 'B-201',
    });

    for (let attempt = 1; attempt <= 5; attempt += 1) {
      const response = await request(app)
        .post('/api/auth/otp/request')
        .send({ email: 'rate.limit@example.com' });

      expect(response.statusCode).toBe(200);

      await OtpChallenge.findByIdAndUpdate(response.body.challengeId, {
        nextResendAllowedAt: new Date(Date.now() - 1000),
      });
    }

    const blockedResponse = await request(app)
      .post('/api/auth/otp/request')
      .send({ email: 'rate.limit@example.com' });

    expect(blockedResponse.statusCode).toBe(429);
    expect(blockedResponse.body.message).toMatch(/too many otp requests/i);
  });

  test('supports resend and final login with latest OTP challenge', async () => {
    await User.create({
      name: 'Resend User',
      email: 'resend.user@example.com',
      password: 'Password123!',
      role: 'student',
      roomNumber: 'B-202',
    });

    const initialOtpResponse = await request(app)
      .post('/api/auth/otp/request')
      .send({ email: 'resend.user@example.com' });

    expect(initialOtpResponse.statusCode).toBe(200);

    await OtpChallenge.findByIdAndUpdate(initialOtpResponse.body.challengeId, {
      nextResendAllowedAt: new Date(Date.now() - 1000),
    });

    const resendOtpResponse = await request(app)
      .post('/api/auth/otp/resend')
      .send({ challengeId: initialOtpResponse.body.challengeId });

    expect(resendOtpResponse.statusCode).toBe(200);

    const verifyOtpResponse = await request(app)
      .post('/api/auth/otp/verify')
      .send({
        challengeId: resendOtpResponse.body.challengeId,
        otp: '654321',
      });

    expect(verifyOtpResponse.statusCode).toBe(200);
    expect(verifyOtpResponse.body.email).toBe('resend.user@example.com');
  });
});
