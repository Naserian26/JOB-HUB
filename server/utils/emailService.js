const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendInterviewInviteEmail = async ({ candidateEmail, candidateName, jobTitle, companyName, slots, location, meetingLink, notes }) => {
  const slotRows = slots.map(slot => {
    const date = new Date(slot.date).toLocaleDateString('en-KE', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
    return `
      <tr>
        <td style="padding: 10px 16px; border-bottom: 1px solid #1e3050; color: #e2e8f0;">${date}</td>
        <td style="padding: 10px 16px; border-bottom: 1px solid #1e3050; color: #e2e8f0;">${slot.startTime} – ${slot.endTime}</td>
      </tr>`;
  }).join('');

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8" /></head>
<body style="margin:0;padding:0;background:#080e1a;font-family:'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#080e1a;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#0e1929;border-radius:16px;border:1px solid #1e3050;overflow:hidden;">
          
          <!-- Header -->
          <tr>
            <td style="background:#0e1929;padding:32px 40px 24px;border-bottom:1px solid #1e3050;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <span style="background:#e8a020;color:#080e1a;font-weight:700;font-size:15px;padding:6px 14px;border-radius:8px;">JobHub</span>
                  </td>
                </tr>
              </table>
              <h1 style="margin:24px 0 8px;color:#e2e8f0;font-size:22px;font-weight:700;">Interview Invitation</h1>
              <p style="margin:0;color:#94a3b8;font-size:14px;">You've been invited to interview at <strong style="color:#e8a020;">${companyName || 'a company'}</strong></p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px 40px;">
              <p style="color:#e2e8f0;font-size:15px;margin:0 0 8px;">Hi <strong>${candidateName}</strong>,</p>
              <p style="color:#94a3b8;font-size:14px;line-height:1.6;margin:0 0 28px;">
                Congratulations! You have been shortlisted for the position of 
                <strong style="color:#e8a020;">${jobTitle}</strong>. 
                Please review the proposed interview slot(s) below and confirm your preferred time on JobHub.
              </p>

              <!-- Slots -->
              <p style="color:#e2e8f0;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;margin:0 0 12px;">Proposed Time Slot(s)</p>
              <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #1e3050;border-radius:10px;overflow:hidden;margin-bottom:28px;">
                <tr style="background:#132035;">
                  <th style="padding:10px 16px;text-align:left;color:#94a3b8;font-size:12px;font-weight:600;">Date</th>
                  <th style="padding:10px 16px;text-align:left;color:#94a3b8;font-size:12px;font-weight:600;">Time</th>
                </tr>
                ${slotRows}
              </table>

              ${location ? `
              <p style="color:#e2e8f0;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;margin:0 0 8px;">Location</p>
              <p style="color:#94a3b8;font-size:14px;margin:0 0 24px;">${location}</p>
              ` : ''}

              ${meetingLink ? `
              <p style="color:#e2e8f0;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;margin:0 0 8px;">Meeting Link</p>
              <p style="margin:0 0 24px;"><a href="${meetingLink}" style="color:#e8a020;font-size:14px;">${meetingLink}</a></p>
              ` : ''}

              ${notes ? `
              <p style="color:#e2e8f0;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;margin:0 0 8px;">Notes</p>
              <p style="color:#94a3b8;font-size:14px;line-height:1.6;margin:0 0 24px;">${notes}</p>
              ` : ''}

              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${process.env.CLIENT_URL}/seeker/interviews" 
                       style="display:inline-block;background:#e8a020;color:#080e1a;font-weight:700;font-size:14px;padding:14px 32px;border-radius:10px;text-decoration:none;">
                      Confirm Your Slot →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;border-top:1px solid #1e3050;">
              <p style="color:#4a6080;font-size:12px;margin:0;text-align:center;">
                This email was sent by JobHub. If you did not apply for this position, please ignore this email.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  await transporter.sendMail({
    from: `"JobHub" <${process.env.EMAIL_USER}>`,
    to: candidateEmail,
    subject: `Interview Invitation — ${jobTitle}`,
    html,
  });
};

const sendInterviewCancelledEmail = async ({ candidateEmail, candidateName, jobTitle, reason }) => {
  const html = `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#080e1a;font-family:'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#080e1a;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#0e1929;border-radius:16px;border:1px solid #1e3050;overflow:hidden;">
          <tr>
            <td style="padding:32px 40px;border-bottom:1px solid #1e3050;">
              <span style="background:#e8a020;color:#080e1a;font-weight:700;font-size:15px;padding:6px 14px;border-radius:8px;">JobHub</span>
              <h1 style="margin:24px 0 8px;color:#e2e8f0;font-size:22px;font-weight:700;">Interview Cancelled</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 40px;">
              <p style="color:#e2e8f0;font-size:15px;margin:0 0 8px;">Hi <strong>${candidateName}</strong>,</p>
              <p style="color:#94a3b8;font-size:14px;line-height:1.6;margin:0 0 16px;">
                Unfortunately, your interview for <strong style="color:#e8a020;">${jobTitle}</strong> has been cancelled.
              </p>
              ${reason ? `<p style="color:#94a3b8;font-size:14px;margin:0;"><strong style="color:#e2e8f0;">Reason:</strong> ${reason}</p>` : ''}
            </td>
          </tr>
          <tr>
            <td style="padding:24px 40px;border-top:1px solid #1e3050;">
              <p style="color:#4a6080;font-size:12px;margin:0;text-align:center;">JobHub — connecting talent with opportunity.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  await transporter.sendMail({
    from: `"JobHub" <${process.env.EMAIL_USER}>`,
    to: candidateEmail,
    subject: `Interview Cancelled — ${jobTitle}`,
    html,
  });
};

module.exports = { sendInterviewInviteEmail, sendInterviewCancelledEmail };