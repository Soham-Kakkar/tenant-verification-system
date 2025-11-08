import { Request, Response } from 'express';
import Joi from 'joi';
import Verification, { VerificationStatus } from '../models/verification.model';
import Notification from '../models/notification.model';
import User from '../models/user.model';
import Station from '../models/station.model';
import { SmsService } from '../services/sms.service';
import crypto from 'crypto';

const createRequestSchema = Joi.object({
  landlordName: Joi.string().required(),
  landlordPhone: Joi.string().required(),
  tenantName: Joi.string().required(),
  tenantPhone: Joi.string(),
  address: Joi.string(),
  stationId: Joi.string().required(),
});

export const createRequest = async (req: Request, res: Response) => {
  try {
    const { error, value } = createRequestSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { landlordName, landlordPhone, tenantName, tenantPhone, address, stationId } = value;

    const station = await Station.findOne({ name: stationId }).lean();
    if (!station) {
      return res.status(400).json({ error: 'Invalid station' });
    }

    // Generate OTP
    const otpCode = crypto.randomInt(100000, 999999).toString();

    const verification = await Verification.create({
      landlordName,
      landlordPhone,
      tenantName,
      tenantPhone,
      address,
      stationId: station._id,
      regionId: station.regionId,
      otpCode,
      otpExpiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    });

    // Send OTP SMS to landlord
    try {
      await SmsService.sendSms(
        landlordPhone,
        `Your OTP for tenant verification is: ${otpCode}. Valid for 10 minutes.`
      );
    } catch (smsError) {
      console.error('Failed to send OTP SMS:', smsError);
      // Continue with request creation even if SMS fails
    }

    res.json({ verificationId: verification._id, submitted: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create request' });
  }
};

export const verifyOtp = async (req: Request, res: Response) => {
  try {
    const { verificationId, otp } = req.body;

    if (!verificationId || !otp) {
      return res.status(400).json({ error: 'Verification ID and OTP are required' });
    }

    const verification = await Verification.findById(verificationId);
    if (!verification) {
      return res.status(404).json({ error: 'Verification request not found' });
    }

    if (verification.status !== 'pending') {
      return res.status(400).json({ error: 'Request already processed' });
    }

    if (!verification.otpCode || !verification.otpExpiresAt) {
      return res.status(400).json({ error: 'OTP not found for this request' });
    }

    if (new Date() > verification.otpExpiresAt) {
      return res.status(400).json({ error: 'OTP has expired' });
    }

    if (verification.otpCode !== otp) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    // Mark as submitted (OTP verified)
    verification.status = VerificationStatus.SUBMITTED;
    verification.otpVerifiedAt = new Date();
    await verification.save();

    // Now notify admin1(s) of the station and admin0 of the region
    const stationAdmins = await User.find({ stationId: verification.stationId, role: 'admin1' }).lean();
    const regionAdmins = await User.find({ regionId: verification.regionId, role: 'admin0' }).lean();

    const notifPromises = [...stationAdmins, ...regionAdmins].map((admin) =>
      Notification.create({
        userId: admin._id,
        title: 'New Verification Request',
        body: `Request from ${verification.landlordName}`,
        meta: { verificationId: verification._id },
      })
    );
    await Promise.all(notifPromises);

    res.json({ verified: true, message: 'OTP verified successfully' });
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ error: 'Failed to verify OTP' });
  }
};
