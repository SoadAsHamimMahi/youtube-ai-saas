import nodemailer from "nodemailer";

/**
 * Singleton Nodemailer transporter.
 * Creating a new transporter per request opens a new SMTP connection pool every time,
 * which exhausts Gmail's concurrent connection limit under load.
 * This module-level singleton reuses a single connection pool for all email sends.
 */
let _transporter: nodemailer.Transporter | null = null;

export function getTransporter(): nodemailer.Transporter {
  if (!_transporter) {
    const user = process.env.GMAIL_USER;
    const pass = process.env.GMAIL_PASS;

    if (!user || !pass) {
      throw new Error("Gmail credentials (GMAIL_USER, GMAIL_PASS) are missing in environment variables.");
    }

    _transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user, pass },
      pool: true,          // Enable connection pooling (reuse SMTP connections)
      maxConnections: 5,   // Maximum parallel connections to Gmail SMTP
      maxMessages: 100,    // Max messages per connection before recycling
      rateDelta: 1000,     // Time window (ms) for rate limiting
      rateLimit: 10,       // Max messages per rateDelta window
    });

    console.log("[Mailer] SMTP transporter initialized (singleton).");
  }

  return _transporter;
}
