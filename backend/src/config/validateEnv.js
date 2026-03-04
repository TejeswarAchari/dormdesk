const normalizeValue = (value = '') => String(value).trim();
const normalizeLowerValue = (value = '') => normalizeValue(value).toLowerCase();

const pushError = (errors, message) => {
  errors.push(message);
};

const validatePositiveInteger = (errors, keyName) => {
  const value = process.env[keyName];

  if (value == null || String(value).trim() === '') {
    return;
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    pushError(errors, `${keyName} must be a positive integer when provided`);
  }
};

const validateOtpDeliveryConfig = () => {
  if (process.env.NODE_ENV === 'test') {
    return;
  }

  const errors = [];
  const deliveryMode = normalizeLowerValue(process.env.BREVO_DELIVERY_MODE || 'smtp');
  const senderEmail = normalizeLowerValue(process.env.BREVO_SMTP_FROM);
  const smtpLogin = normalizeLowerValue(process.env.BREVO_SMTP_LOGIN);
  const smtpPassword = normalizeValue(process.env.BREVO_SMTP_PASSWORD);
  const apiKey = normalizeValue(process.env.BREVO_API_KEY);

  const validDeliveryModes = ['smtp', 'api', 'smtp-only'];
  if (!validDeliveryModes.includes(deliveryMode)) {
    pushError(
      errors,
      `BREVO_DELIVERY_MODE must be one of: ${validDeliveryModes.join(', ')}`
    );
  }

  if (!senderEmail) {
    pushError(errors, 'BREVO_SMTP_FROM must be set to a verified Brevo sender email');
  }

  if (senderEmail && smtpLogin && senderEmail === smtpLogin) {
    pushError(
      errors,
      'BREVO_SMTP_FROM cannot be the SMTP login address. Use a verified sender email.'
    );
  }

  const hasApiCredential = Boolean(apiKey || smtpPassword);
  const hasSmtpCredential = Boolean(smtpLogin && (smtpPassword || apiKey));

  if (deliveryMode === 'api' && !hasApiCredential) {
    pushError(
      errors,
      'BREVO_DELIVERY_MODE=api requires BREVO_API_KEY (or BREVO_SMTP_PASSWORD)'
    );
  }

  if (deliveryMode === 'smtp-only' && !hasSmtpCredential) {
    pushError(
      errors,
      'BREVO_DELIVERY_MODE=smtp-only requires BREVO_SMTP_LOGIN and BREVO_SMTP_PASSWORD (or BREVO_API_KEY)'
    );
  }

  if (deliveryMode === 'smtp' && !hasSmtpCredential && !hasApiCredential) {
    pushError(
      errors,
      'BREVO_DELIVERY_MODE=smtp requires SMTP credentials or API credentials for fallback'
    );
  }

  validatePositiveInteger(errors, 'BREVO_SMTP_PORT');
  validatePositiveInteger(errors, 'BREVO_SMTP_CONNECTION_TIMEOUT_MS');
  validatePositiveInteger(errors, 'BREVO_SMTP_SOCKET_TIMEOUT_MS');
  validatePositiveInteger(errors, 'BREVO_SMTP_GREETING_TIMEOUT_MS');

  if (errors.length > 0) {
    const configurationError = new Error(
      `Environment configuration validation failed:\n- ${errors.join('\n- ')}`
    );
    configurationError.statusCode = 500;
    throw configurationError;
  }
};

module.exports = {
  validateOtpDeliveryConfig,
};
