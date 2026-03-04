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
  process.env.OTP_TEST_CODE = '123456';

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

describe('OTP authentication integration', () => {
  test('completes request -> verify flow and creates authenticated session', async () => {
    const user = await User.create({
      name: 'OTP Student',
      email: 'otp.student@example.com',
      password: 'Password123!',
      role: 'student',
      roomNumber: 'A-101',
      phone: '+12345678901',
    });

    expect(user).toBeDefined();

    const requestOtpResponse = await request(app)
      .post('/api/auth/otp/request')
      .send({ email: 'otp.student@example.com' });

    expect(requestOtpResponse.statusCode).toBe(200);
    expect(requestOtpResponse.body.challengeId).toBeDefined();
    expect(requestOtpResponse.body.otpCode).toBe('123456');

    const verifyOtpResponse = await request(app)
      .post('/api/auth/otp/verify')
      .send({
        challengeId: requestOtpResponse.body.challengeId,
        otp: '123456',
      });

    expect(verifyOtpResponse.statusCode).toBe(200);
    expect(verifyOtpResponse.body.email).toBe('otp.student@example.com');
    expect(verifyOtpResponse.headers['set-cookie']).toBeDefined();

    const challenge = await OtpChallenge.findById(requestOtpResponse.body.challengeId);
    expect(challenge.consumedAt).toBeTruthy();
  });

  test('blocks invalid OTP attempts and returns proper errors', async () => {
    await User.create({
      name: 'OTP Student',
      email: 'otp.invalid@example.com',
      password: 'Password123!',
      role: 'student',
      roomNumber: 'A-102',
    });

    const requestOtpResponse = await request(app)
      .post('/api/auth/otp/request')
      .send({ email: 'otp.invalid@example.com' });

    const invalidOtpResponse = await request(app)
      .post('/api/auth/otp/verify')
      .send({
        challengeId: requestOtpResponse.body.challengeId,
        otp: '000000',
      });

    expect(invalidOtpResponse.statusCode).toBe(401);
    expect(invalidOtpResponse.body.message).toMatch(/invalid otp/i);
  });

  test('rejects expired OTP sessions', async () => {
    await User.create({
      name: 'OTP Student',
      email: 'otp.expired@example.com',
      password: 'Password123!',
      role: 'student',
      roomNumber: 'A-103',
    });

    const requestOtpResponse = await request(app)
      .post('/api/auth/otp/request')
      .send({ email: 'otp.expired@example.com' });

    await OtpChallenge.findByIdAndUpdate(requestOtpResponse.body.challengeId, {
      expiresAt: new Date(Date.now() - 1000),
    });

    const verifyOtpResponse = await request(app)
      .post('/api/auth/otp/verify')
      .send({
        challengeId: requestOtpResponse.body.challengeId,
        otp: '123456',
      });

    expect(verifyOtpResponse.statusCode).toBe(400);
    expect(verifyOtpResponse.body.message).toMatch(/expired/i);
  });
});
