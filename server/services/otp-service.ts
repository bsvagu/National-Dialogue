import crypto from 'crypto';
import twilio from 'twilio';
import sgMail from '@sendgrid/mail';
import { storage } from '../storage';
import type { OtpRequest, OtpVerify } from '@shared/schema';

// Initialize providers
const twilioClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;

if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

export interface OtpServiceResult {
  success: boolean;
  message?: string;
  error?: string;
  data?: any;
}

export class OtpService {
  private static readonly OTP_LENGTH = 6;
  private static readonly OTP_EXPIRY_MINUTES = 5;
  private static readonly MAX_ATTEMPTS = 3;
  private static readonly RATE_LIMIT_WINDOW = 60; // seconds
  private static readonly MAX_REQUESTS_PER_WINDOW = 3;

  /**
   * Generate a secure OTP code
   */
  private static generateOtpCode(): string {
    return crypto.randomInt(100000, 999999).toString();
  }

  /**
   * Hash OTP code for secure storage
   */
  private static hashOtpCode(code: string): string {
    return crypto.createHash('sha256').update(code).digest('hex');
  }

  /**
   * Validate phone number format
   */
  private static isValidPhoneNumber(phone: string): boolean {
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    return phoneRegex.test(phone);
  }

  /**
   * Validate email format
   */
  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Check rate limiting for OTP requests
   */
  private static async checkRateLimit(identifier: string, type: string): Promise<boolean> {
    const windowStart = new Date(Date.now() - (this.RATE_LIMIT_WINDOW * 1000));
    const recentRequests = await storage.getRecentOtpRequests(identifier, type, windowStart);
    return recentRequests.length < this.MAX_REQUESTS_PER_WINDOW;
  }

  /**
   * Send SMS OTP via Twilio
   */
  private static async sendSmsOtp(phone: string, code: string): Promise<OtpServiceResult> {
    if (!twilioClient) {
      return {
        success: false,
        error: 'SMS service not configured. Please contact administrator.'
      };
    }

    if (!process.env.TWILIO_PHONE_NUMBER) {
      return {
        success: false,
        error: 'SMS sending phone number not configured'
      };
    }

    try {
      const message = await twilioClient.messages.create({
        body: `Your National Dialogue ZA verification code: ${code}. Valid for ${this.OTP_EXPIRY_MINUTES} minutes. Do not share this code.`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phone
      });

      console.log(`SMS OTP sent successfully. Message SID: ${message.sid}`);

      return {
        success: true,
        message: 'SMS verification code sent successfully',
        data: { messageId: message.sid }
      };
    } catch (error: any) {
      console.error('Twilio SMS error:', error);

      // Handle specific Twilio errors
      if (error.code === 21211) {
        return {
          success: false,
          error: 'Invalid phone number format. Please include country code.'
        };
      }

      if (error.code === 21608) {
        return {
          success: false,
          error: 'Phone number is not verified for this account.'
        };
      }

      return {
        success: false,
        error: 'Failed to send SMS verification code. Please try again.'
      };
    }
  }

  /**
   * Send Email OTP via SendGrid
   */
  private static async sendEmailOtp(email: string, code: string): Promise<OtpServiceResult> {
    if (!process.env.SENDGRID_API_KEY) {
      return {
        success: false,
        error: 'Email service not configured. Please contact administrator.'
      };
    }

    if (!process.env.SENDGRID_FROM_EMAIL) {
      return {
        success: false,
        error: 'Email sender not configured'
      };
    }

    try {
      const msg = {
        to: email,
        from: {
          email: process.env.SENDGRID_FROM_EMAIL,
          name: 'National Dialogue ZA'
        },
        subject: 'Your Verification Code - National Dialogue ZA',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #1976d2; margin: 0;">National Dialogue ZA</h1>
              <p style="color: #666; margin: 5px 0;">Verification Code</p>
            </div>
            
            <div style="background: #f5f5f5; padding: 30px; border-radius: 8px; text-align: center; margin-bottom: 20px;">
              <h2 style="margin: 0; color: #333;">Your Verification Code</h2>
              <div style="font-size: 32px; font-weight: bold; color: #1976d2; letter-spacing: 8px; margin: 20px 0; font-family: 'Courier New', monospace;">
                ${code}
              </div>
              <p style="color: #666; margin: 0;">This code expires in ${this.OTP_EXPIRY_MINUTES} minutes</p>
            </div>
            
            <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 4px; margin-bottom: 20px;">
              <p style="margin: 0; color: #856404;">
                <strong>Security Notice:</strong> Never share this code with anyone. 
                National Dialogue ZA staff will never ask for this code.
              </p>
            </div>
            
            <div style="text-align: center; color: #666; font-size: 12px;">
              <p>This is an automated message from National Dialogue ZA Admin Portal.</p>
              <p>If you didn't request this verification code, please ignore this email.</p>
            </div>
          </div>
        `,
      };

      await sgMail.send(msg);

      console.log(`Email OTP sent successfully to: ${email}`);

      return {
        success: true,
        message: 'Email verification code sent successfully'
      };
    } catch (error: any) {
      console.error('SendGrid email error:', error);

      // Handle specific SendGrid errors
      if (error.response?.body?.errors) {
        const errors = error.response.body.errors;
        if (errors.some((e: any) => e.message?.includes('invalid email'))) {
          return {
            success: false,
            error: 'Invalid email address format'
          };
        }
      }

      return {
        success: false,
        error: 'Failed to send email verification code. Please try again.'
      };
    }
  }

  /**
   * Request OTP - generates and sends OTP via SMS or email
   */
  static async requestOtp(request: OtpRequest): Promise<OtpServiceResult> {
    const { identifier, type } = request;

    // Validate input format
    if (type === 'sms' && !this.isValidPhoneNumber(identifier)) {
      return {
        success: false,
        error: 'Invalid phone number format. Please include country code (e.g., +27821234567)'
      };
    }

    if (type === 'email' && !this.isValidEmail(identifier)) {
      return {
        success: false,
        error: 'Invalid email address format'
      };
    }

    // Check rate limiting
    const withinRateLimit = await this.checkRateLimit(identifier, type);
    if (!withinRateLimit) {
      return {
        success: false,
        error: `Too many requests. Please wait ${this.RATE_LIMIT_WINDOW} seconds before requesting another code.`
      };
    }

    // Clean up expired OTPs
    await storage.cleanupExpiredOtps();

    // Generate OTP
    const code = this.generateOtpCode();
    const hashedCode = this.hashOtpCode(code);
    const expiresAt = new Date(Date.now() + (this.OTP_EXPIRY_MINUTES * 60 * 1000));

    try {
      // Store OTP in database
      await storage.createOtpVerification({
        identifier,
        type,
        code: code, // Store plain code temporarily for development
        hashedCode,
        attempts: 0,
        isUsed: false,
        expiresAt,
      });

      // Send OTP via appropriate channel
      let sendResult: OtpServiceResult;
      
      if (type === 'sms') {
        sendResult = await this.sendSmsOtp(identifier, code);
      } else {
        sendResult = await this.sendEmailOtp(identifier, code);
      }

      if (!sendResult.success) {
        // Clean up stored OTP if sending failed
        await storage.deleteOtpVerification(identifier, type);
        return sendResult;
      }

      return {
        success: true,
        message: `Verification code sent successfully via ${type === 'sms' ? 'SMS' : 'email'}`,
        data: {
          expiresAt: expiresAt.toISOString(),
          expiresInMinutes: this.OTP_EXPIRY_MINUTES
        }
      };
    } catch (error) {
      console.error('Error creating OTP verification:', error);
      return {
        success: false,
        error: 'Failed to process OTP request. Please try again.'
      };
    }
  }

  /**
   * Verify OTP code
   */
  static async verifyOtp(request: OtpVerify): Promise<OtpServiceResult> {
    const { identifier, code, type } = request;

    try {
      // Get stored OTP
      const otpRecord = await storage.getOtpVerification(identifier, type);
      
      if (!otpRecord) {
        return {
          success: false,
          error: 'No verification code found. Please request a new code.'
        };
      }

      // Check if already used
      if (otpRecord.isUsed) {
        return {
          success: false,
          error: 'Verification code has already been used. Please request a new code.'
        };
      }

      // Check if expired
      if (new Date() > otpRecord.expiresAt) {
        await storage.deleteOtpVerification(identifier, type);
        return {
          success: false,
          error: 'Verification code has expired. Please request a new code.'
        };
      }

      // Check attempts
      if (otpRecord.attempts >= this.MAX_ATTEMPTS) {
        await storage.deleteOtpVerification(identifier, type);
        return {
          success: false,
          error: 'Too many failed attempts. Please request a new verification code.'
        };
      }

      // Verify code (compare with plain code for development, hashed in production)
      const isValidCode = code === otpRecord.code || this.hashOtpCode(code) === otpRecord.hashedCode;
      
      if (!isValidCode) {
        // Increment attempts
        await storage.incrementOtpAttempts(otpRecord.id);
        const remainingAttempts = this.MAX_ATTEMPTS - (otpRecord.attempts + 1);
        
        return {
          success: false,
          error: `Invalid verification code. ${remainingAttempts} ${remainingAttempts === 1 ? 'attempt' : 'attempts'} remaining.`
        };
      }

      // Mark as used
      await storage.markOtpAsUsed(otpRecord.id);

      return {
        success: true,
        message: 'Verification successful',
        data: {
          identifier,
          type,
          verifiedAt: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Error verifying OTP:', error);
      return {
        success: false,
        error: 'Failed to verify code. Please try again.'
      };
    }
  }

  /**
   * Get OTP statistics for monitoring
   */
  static async getOtpStats(): Promise<{
    totalSent: number;
    totalVerified: number;
    successRate: number;
    recentRequests: number;
  }> {
    try {
      return await storage.getOtpStats();
    } catch (error) {
      console.error('Error getting OTP stats:', error);
      return {
        totalSent: 0,
        totalVerified: 0,
        successRate: 0,
        recentRequests: 0
      };
    }
  }
}