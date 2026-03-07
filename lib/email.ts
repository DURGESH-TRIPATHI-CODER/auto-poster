import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

export async function sendNoScheduleReminder() {
  const to = process.env.REMINDER_EMAIL;
  if (!to) return;

  await transporter.sendMail({
    from: process.env.SMTP_USER,
    to,
    subject: "Schedule your content",
    text: "You have not scheduled any posts for next week."
  });
}