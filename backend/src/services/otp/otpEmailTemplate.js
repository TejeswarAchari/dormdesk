const formatOtpForDisplay = (otpCode) => String(otpCode).split('').join(' ');

const renderOtpEmailHtml = ({ otpCode, expiresInMinutes = 5 }) => {
  const otpTemplate = `<!doctype html>
<html lang="en">
  <body style="margin:0;padding:0;background-color:#f3f6fb;font-family:Arial,Helvetica,sans-serif;color:#111827;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f3f6fb;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;">
            <tr>
              <td align="center" style="padding:12px 0 18px 0;font-size:24px;font-weight:700;color:#1d4ed8;">
                DormDesk
              </td>
            </tr>
            <tr>
              <td style="background-color:#ffffff;border-radius:16px;box-shadow:0 8px 24px rgba(15,23,42,0.08);padding:32px 24px;border:1px solid #e5e7eb;">
                <h1 style="margin:0 0 12px 0;font-size:24px;line-height:1.3;color:#111827;font-weight:700;text-align:center;">
                  DormDesk Login Verification
                </h1>
                <p style="margin:0 0 24px 0;font-size:15px;line-height:1.6;color:#374151;text-align:center;">
                  Use the one-time password below to securely complete your sign in.
                </p>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px 0;">
                  <tr>
                    <td align="center" style="background-color:#f8fafc;border:1px solid #dbeafe;border-radius:12px;padding:18px 12px;">
                      <span style="font-size:34px;line-height:1.1;font-weight:700;color:#0f172a;letter-spacing:10px;display:inline-block;">
                        {{OTP}}
                      </span>
                    </td>
                  </tr>
                </table>
                <p style="margin:0 0 14px 0;font-size:14px;line-height:1.6;color:#4b5563;text-align:center;">
                  This OTP expires in <strong style="color:#111827;">${expiresInMinutes} minutes</strong>.
                </p>
                <p style="margin:0;font-size:14px;line-height:1.6;color:#6b7280;text-align:center;">
                  If you did not request this OTP, you can safely ignore this email.
                </p>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:18px 12px 0 12px;font-size:12px;line-height:1.6;color:#6b7280;">
                © ${new Date().getFullYear()} DormDesk. Secure hostel operations, simplified.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return otpTemplate.replace('{{OTP}}', formatOtpForDisplay(otpCode));
};

const renderOtpEmailText = ({ otpCode, expiresInMinutes = 5 }) =>
  `DormDesk Login Verification\n\nYour one-time password is: ${otpCode}\nThis OTP expires in ${expiresInMinutes} minutes.\n\nIf you did not request this OTP, you can safely ignore this email.`;

module.exports = {
  renderOtpEmailHtml,
  renderOtpEmailText,
};
