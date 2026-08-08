import nodemailer from "nodemailer";
import { getConfigValue } from "@/lib/runtimeConfig";

// Email transporter - configurable via env vars, or via Admin > API Keys
// Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS in .env (or the admin panel)
async function getTransporter() {
  const [host, portStr, user, pass] = await Promise.all([
    getConfigValue("SMTP_HOST"),
    getConfigValue("SMTP_PORT"),
    getConfigValue("SMTP_USER"),
    getConfigValue("SMTP_PASS"),
  ]);
  const port = Number(portStr) || 587;

  if (!host || !user || !pass) {
    return null; // No SMTP configured, emails will be logged only
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  const transporter = await getTransporter();
  const fromAddress =
    options.from || (await getConfigValue("SMTP_FROM")) || "noreply@xerxes.com";

  if (!transporter) {
    // Log to console when SMTP is not configured
    console.log("📧 EMAIL (no SMTP configured - logged only):");
    console.log(`   To: ${options.to}`);
    console.log(`   Subject: ${options.subject}`);
    console.log(`   Body: ${options.html.substring(0, 200)}...`);

    // Still save to activity log
    try {
      const { logActivity } = await import("@/lib/activityLog");
      await logActivity({
        action: "create",
        entity: "newsletter",
        details: `Email queued (no SMTP): To=${options.to}, Subject=${options.subject}`,
      });
    } catch { /* ignore */ }

    return true; // Return true so the flow continues
  }

  try {
    await transporter.sendMail({
      from: fromAddress,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });

    console.log(`📧 Email sent to ${options.to}: ${options.subject}`);
    return true;
  } catch (error) {
    console.error("Failed to send email:", error);
    return false;
  }
}

// Email templates
export function newPropertyAlertEmail(propertyTitle: string, propertyUrl: string, searchName: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #1a56db; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 22px;">Xerxes</h1>
        <p style="margin: 5px 0 0; opacity: 0.8; font-size: 14px;">New Property Match</p>
      </div>
      <div style="padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
        <h2 style="margin: 0 0 12px; font-size: 18px; color: #111;">New Property Matching "${searchName}"</h2>
        <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
          A new property has been listed that matches your saved search criteria:
        </p>
        <div style="background: #f9fafb; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <h3 style="margin: 0; font-size: 16px; color: #1a56db;">${propertyTitle}</h3>
        </div>
        <a href="${propertyUrl}" style="display: inline-block; background: #1a56db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-size: 14px; font-weight: 600;">
          View Property →
        </a>
        <p style="color: #9ca3af; font-size: 12px; margin-top: 20px;">
          You received this email because you have saved search alerts on Xerxes.
        </p>
      </div>
    </div>
  `;
}

export function inquiryConfirmationEmail(name: string, propertyTitle: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #1a56db; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 22px;">Xerxes</h1>
      </div>
      <div style="padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
        <h2 style="margin: 0 0 12px; font-size: 18px; color: #111;">Thank you, ${name}!</h2>
        <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
          We have received your inquiry about <strong>${propertyTitle}</strong>. 
          Our team will get back to you within 24 hours.
        </p>
        <p style="color: #6b7280; font-size: 14px;">
          In the meantime, feel free to browse more properties on our website.
        </p>
        <p style="color: #9ca3af; font-size: 12px; margin-top: 20px;">
          Xerxes - Your trusted partner in Northern Cyprus real estate
        </p>
      </div>
    </div>
  `;
}

export function newsletterWelcomeEmail(): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #1a56db; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 22px;">Xerxes</h1>
        <p style="margin: 5px 0 0; opacity: 0.8; font-size: 14px;">Welcome to our newsletter!</p>
      </div>
      <div style="padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
        <h2 style="margin: 0 0 12px; font-size: 18px; color: #111;">Welcome to Xerxes! 🏡</h2>
        <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
          You'll now receive updates about:
        </p>
        <ul style="color: #6b7280; font-size: 14px; line-height: 1.8;">
          <li>New property listings</li>
          <li>Market trends & investment tips</li>
          <li>Special offers & promotions</li>
        </ul>
      </div>
    </div>
  `;
}
