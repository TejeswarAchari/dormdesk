const mongoose = require('mongoose');

const otpChallengeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      index: true,
    },
    otpHash: {
      type: String,
      required: true,
      select: false,
    },
    expiresAt: {
      type: Date,
      required: true,
      expires: 0,
    },
    attempts: {
      type: Number,
      default: 0,
      min: 0,
    },
    maxAttempts: {
      type: Number,
      default: 5,
      min: 1,
    },
    requestCount: {
      type: Number,
      default: 1,
      min: 1,
    },
    requestWindowStartedAt: {
      type: Date,
      default: Date.now,
    },
    resendCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    nextResendAllowedAt: {
      type: Date,
      default: Date.now,
    },
    consumedAt: {
      type: Date,
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

otpChallengeSchema.index({ user: 1, consumedAt: 1, expiresAt: -1 });
otpChallengeSchema.index({ email: 1, consumedAt: 1, expiresAt: -1 });

module.exports = mongoose.model('OtpChallenge', otpChallengeSchema);
