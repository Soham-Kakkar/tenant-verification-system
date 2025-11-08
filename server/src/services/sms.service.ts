import twilio from 'twilio';
import { config } from '../config';

const client = twilio(config.twilioSid, config.twilioAuthToken);

export class SmsService {
  static async sendSms(to: string, message: string): Promise<void> {
    try {
      await client.messages.create({
        body: message,
        from: config.twilioFrom,
        to: to
      });
      console.log(`SMS sent to ${to}: ${message}`);
    } catch (error) {
      console.error('SMS sending failed:', error);
      throw error;
    }
  }
}
