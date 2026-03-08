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

export async function sendPostPublishedEmail(platform: string, content: string, postUrl?: string) {
  const to = process.env.REMINDER_EMAIL;
  if (!to) return;

  const platformLabel = platform === "twitter" ? "X (Twitter)" : "LinkedIn";
  const fallbackLink = platform === "twitter" ? "https://x.com/home" : "https://www.linkedin.com/feed/";
  const profileLink = postUrl ?? fallbackLink;

  const snippet = content.length > 120 ? content.slice(0, 120) + "…" : content;

  await transporter.sendMail({
    from: process.env.SMTP_USER,
    to,
    subject: `✅ Post published on ${platformLabel}`,
    text: `Your post was just published on ${platformLabel}.\n\nContent:\n${content}\n\nView it here: ${profileLink}`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;background:#0f0f0f;color:#e4e4e7;padding:32px;border-radius:12px;">
        <h2 style="margin:0 0 8px;color:#ffffff;">Post published ✅</h2>
        <p style="margin:0 0 20px;color:#a1a1aa;font-size:14px;">Your content is now live on <strong style="color:#fff;">${platformLabel}</strong>.</p>
        <div style="background:#18181b;border:1px solid #3f3f46;border-radius:8px;padding:16px;margin-bottom:24px;">
          <p style="margin:0;font-size:14px;line-height:1.6;color:#d4d4d8;">${snippet}</p>
        </div>
        <a href="${profileLink}" style="display:inline-block;background:#5048e5;color:#fff;text-decoration:none;padding:10px 20px;border-radius:8px;font-size:14px;font-weight:600;">View on ${platformLabel} →</a>
        <p style="margin-top:24px;font-size:12px;color:#52525b;">Sent by your AI Scheduling app.</p>
      </div>
    `
  });
}