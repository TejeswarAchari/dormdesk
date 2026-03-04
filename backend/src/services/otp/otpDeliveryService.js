const nodemailer = require('nodemailer');
const { renderOtpEmailHtml, renderOtpEmailText } = require('./otpEmailTemplate');

let transporter;
let transporterVerified = false;

const normalizeEmailValue = (value = '') => String(value).trim().toLowerCase();

const buildFromHeader = () => {
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

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  });

  return transporter;
};

const sendOtpEmail = async ({ toEmail, otpCode, expiresInMinutes }) => {
  if (process.env.NODE_ENV === 'test') {
    return;
  }

  const emailTransporter = getTransporter();

  if (!transporterVerified) {
    await emailTransporter.verify();
    transporterVerified = true;
  }

  const fromAddress = buildFromHeader();

  const deliveryResult = await emailTransporter.sendMail({
    from: fromAddress,
    to: toEmail,
    subject: 'Your DormDesk login OTP',
    text: renderOtpEmailText({ otpCode, expiresInMinutes }),
    html: renderOtpEmailHtml({ otpCode, expiresInMinutes }),
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

module.exports = {
  sendOtpEmail,
};
