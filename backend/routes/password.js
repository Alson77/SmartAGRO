const express = require('express');
const Farmer = require('../models/Farmer');
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');
const router = express.Router();

// Helper: create transporter supporting Gmail app password or generic SMTP
function createTransporter() {
  // Always use EMAIL_USER and EMAIL_PASS for sending OTP
  if (process.env.EMAIL_USER && process.env.EMAIL_APP_PASSWORD) {
    return nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD,
      },
    });
  }
  throw new Error('EMAIL_USER and EMAIL_APP_PASSWORD must be set in .env');
}

// POST /forgot-password
// Generates a 6-digit OTP, stores it on the Farmer record with expiry, and emails it.
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });
    const farmer = await Farmer.findOne({ email });
    if (!farmer) return res.status(404).json({ message: 'No account found for this email.' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit
    farmer.resetOTP = otp;
    farmer.resetOTPExpiry = Date.now() + 1000 * 60 * 15; // 15 minutes
    await farmer.save();

    try {
  const transporter = createTransporter();
  const fromAddress = process.env.EMAIL_USER;
      const mailOptions = {
  from: `"SmartAgro" <${fromAddress}>`,
        to: email,
  subject: 'Your SmartAgro OTP for password reset',
        html: `<p>Hi ${farmer.name || 'Farmer'},</p>
               <p>Your OTP to reset your password is: <strong>${otp}</strong></p>
               <p>This OTP is valid for 15 minutes. If you didn't request this, please ignore.</p>`
      };
      await transporter.sendMail(mailOptions);
      return res.json({ message: 'OTP sent to your email.' });
    } catch (err) {
      console.error('Failed to send OTP email', err);
      return res.status(500).json({ message: 'Failed to send OTP email' });
    }
  } catch (err) {
    console.error('forgot-password error', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /forgot-password (for browser/manual access)
router.get('/forgot-password', (req, res) => {
  res.status(405).json({ message: 'Use POST to request password reset OTP.' });
});

// POST /reset-password
// Body: { email, otp, password }
router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, password } = req.body;
  if (!email || !otp || !password) return res.status(400).json({ message: 'Email, OTP and new password are required' });
  const farmer = await Farmer.findOne({ email });
  if (!farmer) return res.status(404).json({ message: 'No account found for this email.' });
  if (!farmer.resetOTP || !farmer.resetOTPExpiry) return res.status(400).json({ message: 'No OTP request found. Please request a new OTP.' });
  if (farmer.resetOTP !== otp) return res.status(400).json({ message: 'Invalid OTP' });
  if (farmer.resetOTPExpiry < Date.now()) return res.status(400).json({ message: 'OTP expired' });

  farmer.passwordHash = await bcrypt.hash(password, 10);
  farmer.resetOTP = null;
  farmer.resetOTPExpiry = null;
  await farmer.save();
  return res.json({ message: 'Password reset successful' });
  } catch (err) {
    console.error('reset-password error', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;