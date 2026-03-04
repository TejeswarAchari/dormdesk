const nodemailer = require('nodemailer');
const { renderOtpEmailHtml, renderOtpEmailText } = require('./otpEmailTemplate');

let transporter;

const normalizeEmailValue = (value = '') => String(value).trim().toLowerCase();

const toInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) ? parsed : fallback;
};

const BREVO_API_URL = process.env.BREVO_API_URL || 'https://api.brevo.com/v3/smtp/email';

const buildSenderDetails = () => {
  const smtpLogin = normalizeEmailValue(process.env.BREVO_SMTP_LOGIN);
  const senderEmail = normalizeEmailValue(process.env.BREVO_SMTP_FROM);
  const senderName = String(process.env.BREVO_SMTP_FROM_NAME || 'DormDesk').trim();

  if (!senderEmail) {
    const senderConfigError = new Error(
      'BREVO_SMTP_FROM must be set to a verified Brevo sender email'
    );
    senderConfigError.statusCode = 500;
    throw senderConfigError;
  }

  if (smtpLogin && senderEmail === smtpLogin) {
    const senderValidationError = new Error(
      'BREVO_SMTP_FROM cannot be the SMTP login address. Use a verified sender email.'
    );
    senderValidationError.statusCode = 500;
    throw senderValidationError;
  }

  return {
    senderEmail,
    senderName,
  };
};

const buildFromHeader = () => {
  const { senderEmail, senderName } = buildSenderDetails();
  return `${senderName} <${senderEmail}>`;
};

const getTransporter = () => {
  if (transporter) {
    return transporter;
  }

  const host = process.env.BREVO_SMTP_HOST || 'smtp-relay.brevo.com';
  const port = Number.parseInt(process.env.BREVO_SMTP_PORT || '587', 10);
  const user = process.env.BREVO_SMTP_LOGIN;
  const pass = process.env.BREVO_SMTP_PASSWORD || process.env.BREVO_API_KEY;

  if (!user || !pass) {
    const configError = new Error('Brevo SMTP credentials are not configured');
    configError.statusCode = 500;
    throw configError;
  }

  const connectionTimeout = toInt(process.env.BREVO_SMTP_CONNECTION_TIMEOUT_MS, 10000);
  const socketTimeout = toInt(process.env.BREVO_SMTP_SOCKET_TIMEOUT_MS, 15000);
  const greetingTimeout = toInt(process.env.BREVO_SMTP_GREETING_TIMEOUT_MS, 10000);

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
    connectionTimeout,
    socketTimeout,
    greetingTimeout,
  });

  return transporter;
};

const buildSmtpUnavailableError = (error) => {
  const serviceError = new Error('OTP email service is temporarily unavailable. Please try again.');
  serviceError.statusCode = 502;

  if (error?.code) {
    serviceError.code = error.code;
  }

  return serviceError;
};

const shouldFallbackToApi = (error) => {
  if (!error) {
    return false;
  }

  const errorCode = String(error.code || '').toUpperCase();
  const errorMessage = String(error.message || '').toLowerCase();

  if (/brevo smtp credentials are not configured/i.test(error.message || '')) {
    return true;
  }

  if (
    ['ETIMEDOUT', 'ESOCKET', 'ECONNECTION', 'ECONNREFUSED', 'EHOSTUNREACH', 'ENETUNREACH'].includes(
      errorCode
    )
  ) {
    return true;
  }

  return errorMessage.includes('timeout') || errorMessage.includes('connection');
};

const sendViaBrevoApi = async ({ senderName, senderEmail, toEmail, subject, text, html }) => {
  const apiKey = String(process.env.BREVO_API_KEY || '').trim();

  if (!apiKey) {
    const configError = new Error('BREVO_API_KEY must be configured for Brevo API email delivery');
    configError.statusCode = 500;
    throw configError;
  }

  if (typeof fetch !== 'function') {
    const fetchUnavailableError = new Error('Brevo API fallback is not supported in this Node runtime');
    fetchUnavailableError.statusCode = 500;
    throw fetchUnavailableError;
  }

  const response = await fetch(BREVO_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': apiKey,
    },
    body: JSON.stringify({
      sender: {
        name: senderName,
        email: senderEmail,
      },
      to: [{ email: toEmail }],
      subject,
      textContent: text,
      htmlContent: html,
    }),
  });

  if (!response.ok) {
    const responseBody = await response.text();
    const apiError = new Error(
      responseBody
        ? `Brevo API email delivery failed (${response.status}): ${responseBody}`
        : `Brevo API email delivery failed (${response.status})`
    );
    apiError.statusCode = 502;
    throw apiError;
  }
};

const sendViaSmtp = async ({ fromAddress, toEmail, subject, text, html }) => {
  const emailTransporter = getTransporter();

  const deliveryResult = await emailTransporter.sendMail({
    from: fromAddress,
    to: toEmail,
    subject,
    text,
    html,
  });

  const acceptedRecipients = Array.isArray(deliveryResult.accepted)
    ? deliveryResult.accepted
    : [];
  const rejectedRecipients = Array.isArray(deliveryResult.rejected)
    ? deliveryResult.rejected
    : [];

  if (acceptedRecipients.length === 0 || rejectedRecipients.length > 0) {
    const deliveryError = new Error(
      'OTP delivery was rejected by SMTP provider. Please try again.'
    );
    deliveryError.statusCode = 502;
    throw deliveryError;
  }
};

const sendOtpEmail = async ({ toEmail, otpCode, expiresInMinutes }) => {
  if (process.env.NODE_ENV === 'test') {
    return;
  }

  const { senderEmail, senderName } = buildSenderDetails();
  const fromAddress = buildFromHeader();
  const subject = 'Your DormDesk login OTP';
  const text = renderOtpEmailText({ otpCode, expiresInMinutes });
  const html = renderOtpEmailHtml({ otpCode, expiresInMinutes });

  const deliveryMode = String(process.env.BREVO_DELIVERY_MODE || 'smtp')
    .trim()
    .toLowerCase();

  if (deliveryMode === 'api') {
    await sendViaBrevoApi({
      senderName,
      senderEmail,
      toEmail,
      subject,
      text,
      html,
    });
    return;
  }

  try {
    await sendViaSmtp({
      fromAddress,
      toEmail,
      subject,
      text,
      html,
    });
  } catch (error) {
    const hasApiFallbackCredential = Boolean(String(process.env.BREVO_API_KEY || '').trim());
    const shouldUseFallback =
      deliveryMode !== 'smtp-only' && hasApiFallbackCredential && shouldFallbackToApi(error);

    if (shouldUseFallback) {
      console.warn('SMTP OTP delivery failed; retrying with Brevo API fallback.', {
        code: error.code,
        message: error.message,
      });

      await sendViaBrevoApi({
        senderName,
        senderEmail,
        toEmail,
        subject,
        text,
        html,
      });
      return;
    }

    if (!error.statusCode && shouldFallbackToApi(error)) {
      throw buildSmtpUnavailableError(error);
    }

    throw error;
  }
};

module.exports = {
  sendOtpEmail,
};
