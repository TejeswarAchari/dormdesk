const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const app = require('../../src/app');
const User = require('../../src/models/User');
const SignupOtpChallenge = require('../../src/models/SignupOtpChallenge');

let mongoServer;

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-jwt-secret';
  process.env.OTP_TEST_CODE = '112233';
  process.env.REQUIRE_SIGNUP_OTP = 'true';

  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterEach(async () => {
  await User.deleteMany({});
  await SignupOtpChallenge.deleteMany({});
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();
});

describe('Signup OTP integration', () => {
  test('registers a new student only after valid signup OTP verification', async () => {
    const otpRequestResponse = await request(app)
      .post('/api/auth/signup/otp/request')
      .send({
        email: 'new.student@example.com',
      });

    expect(otpRequestResponse.statusCode).toBe(200);
    expect(otpRequestResponse.body.challengeId).toBeDefined();
    expect(otpRequestResponse.body.otpCode).toBe('112233');

    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'New Student',
        email: 'new.student@example.com',
        phone: '+12345678901',
        password: 'Password123!',
        role: 'student',
        roomNumber: 'C-301',
        signupChallengeId: otpRequestResponse.body.challengeId,
        signupOtp: '112233',
      });

    expect(registerResponse.statusCode).toBe(201);
    expect(registerResponse.body.email).toBe('new.student@example.com');
    expect(registerResponse.headers['set-cookie']).toBeDefined();
  });

  test('rejects registration when signup OTP is missing', async () => {
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'No OTP Student',
        email: 'no.otp@example.com',
        password: 'Password123!',
        role: 'student',
        roomNumber: 'C-302',
      });

    expect(registerResponse.statusCode).toBe(400);
    expect(registerResponse.body.message).toMatch(/otp/i);
  });

  test('rejects registration when signup OTP is invalid', async () => {
    const otpRequestResponse = await request(app)
      .post('/api/auth/signup/otp/request')
      .send({
        email: 'invalid.otp@example.com',
      });

    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Invalid OTP Student',
        email: 'invalid.otp@example.com',
        password: 'Password123!',
        role: 'student',
        roomNumber: 'C-303',
        signupChallengeId: otpRequestResponse.body.challengeId,
        signupOtp: '999999',
      });

    expect(registerResponse.statusCode).toBe(401);
    expect(registerResponse.body.message).toMatch(/invalid otp/i);
  });
});
