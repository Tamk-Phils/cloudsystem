import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || "587"),
  secure: process.env.EMAIL_PORT === "465",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function sendAlertEmail(subject: string, text: string, html?: string) {
  try {
    const info = await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME || 'Backup System'}" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER, // Sending to self/admin by default
      subject,
      text,
      html: html || text,
    });
    console.log("Alert email sent: %s", info.messageId);
    return info;
  } catch (error) {
    console.error("Failed to send alert email:", error);
  }
}
