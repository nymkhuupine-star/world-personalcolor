import nodemailer from 'nodemailer';

export async function sendMail(opts: {
  to: string;
  subject: string;
  html: string;
}): Promise<void> {
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });

  await transporter.sendMail({
    from: `Personal Color AI <${process.env.GMAIL_USER}>`,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
  });
}
