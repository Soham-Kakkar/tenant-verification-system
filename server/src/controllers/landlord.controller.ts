import { Request, Response } from 'express';
import Joi from 'joi';
import Verification, { VerificationStatus } from '../models/verification.model';
import Notification from '../models/notification.model';
import User from '../models/user.model';
import Station from '../models/station.model';
import { SmsService } from '../services/sms.service';
import { validateTotalSize } from '../middlewares/upload.middleware';
import crypto from 'crypto';
import path from 'path';

const registerLandlordSchema = Joi.object({
  landlordName: Joi.string().max(100).required(),
  landlordPhone: Joi.string().required(),
  address: Joi.string().max(500).required(),
});

const completeRequestSchema = Joi.object({
  tenantName: Joi.string().max(100).required(),
  tenantPhones: Joi.array().items(Joi.string().pattern(/^\+?[1-9]\d{1,14}$/)).min(1).required(),
  fatherName: Joi.string().max(100),
  aadharNumber: Joi.string().pattern(/^\d{12}$/).optional(),
  purposeOfStay: Joi.string().max(500),
  previousAddress: Joi.string().max(500),
  familyMembers: Joi.number().integer().min(1).optional(),
  stationId: Joi.string().required(),
});

export const registerLandlord = async (req: Request, res: Response) => {
  try {
    const { error, value } = registerLandlordSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { landlordName, landlordPhone, address } = value;

    // Generate OTP
    const otpCode = crypto.randomInt(100000, 999999).toString();

    const verification = await Verification.create({
      landlordName,
      landlordPhone,
      address,
      status: VerificationStatus.PENDING,
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

    res.json({ verificationId: verification._id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to register landlord' });
  }
};

export const completeRequest = async (req: Request, res: Response) => {
  try {
    let { tenantName, tenantPhones, fatherName, aadharNumber, purposeOfStay, previousAddress, familyMembers, stationId } = req.body;
    const { verificationId } = req.params;

    // Ensure tenantPhones is always an array
    if (typeof tenantPhones === 'string') {
      tenantPhones = [tenantPhones];
    }

    const { error, value } = completeRequestSchema.validate({
      tenantName, tenantPhones, fatherName, aadharNumber, purposeOfStay, previousAddress, familyMembers, stationId
    });
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const verification = await Verification.findById(verificationId);
    if (!verification) {
      return res.status(404).json({ error: 'Verification request not found' });
    }

    if (verification.status !== 'pending') {
      return res.status(400).json({ error: 'Request already processed' });
    }

    const station = await Station.findOne({ name: stationId });
    if (!station) {
      return res.status(400).json({ error: 'Invalid station' });
    }

    const stationIdObj = station._id as any;

    // Handle file uploads
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const tenantPhoto = files?.tenantPhoto?.map(file => ({
      data: file.buffer,
      contentType: file.mimetype,
      filename: file.originalname,
      size: file.size
    })) || [];
    const aadharPhoto = files?.aadharPhoto?.map(file => ({
      data: file.buffer,
      contentType: file.mimetype,
      filename: file.originalname,
      size: file.size
    })) || [];
    const familyPhoto = files?.familyPhoto?.map(file => ({
      data: file.buffer,
      contentType: file.mimetype,
      filename: file.originalname,
      size: file.size
    })) || [];

    // Update verification with tenant details
    verification.tenantName = tenantName;
    verification.tenantPhones = tenantPhones;
    verification.fatherName = fatherName;
    verification.aadharNumber = aadharNumber;
    verification.purposeOfStay = purposeOfStay;
    verification.previousAddress = previousAddress;
    verification.familyMembers = familyMembers;
    verification.tenantPhoto = tenantPhoto;
    verification.aadharPhoto = aadharPhoto;
    verification.familyPhoto = familyPhoto;
    verification.stationId = stationIdObj;
    verification.regionId = station.regionId;
    verification.status = VerificationStatus.SUBMITTED;

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

    // Send confirmation SMS to landlord
    try {
      await SmsService.sendSms(
        verification.landlordPhone,
        'Request submitted successfully. It is being verified.'
      );
    } catch (smsError) {
      console.error('Failed to send confirmation SMS:', smsError);
      // Continue with response even if SMS fails
    }

    res.json({ submitted: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to complete request' });
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

    // Mark OTP as verified but keep status as pending for tenant form completion
    verification.otpVerifiedAt = new Date();
    await verification.save();

    res.json({ verified: true, message: 'OTP verified successfully' });
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ error: 'Failed to verify OTP' });
  }
};

export const getImage = async (req: Request, res: Response) => {
  try {
    const { verificationId, type, index } = req.params;
    const idx = parseInt(index);

    const verification = await Verification.findById(verificationId);
    if (!verification) {
      return res.status(404).json({ error: 'Verification not found' });
    }

    let photoArray: any[] | undefined;
    switch (type) {
      case 'tenant':
        photoArray = verification.tenantPhoto;
        break;
      case 'aadhar':
        photoArray = verification.aadharPhoto;
        break;
      case 'family':
        photoArray = verification.familyPhoto;
        break;
      default:
        return res.status(400).json({ error: 'Invalid photo type' });
    }

    if (!photoArray || !photoArray[idx]) {
      return res.status(404).json({ error: 'Photo not found' });
    }

    const photo = photoArray[idx];
    res.set('Content-Type', photo.contentType);
    res.send(photo.data);
  } catch (error) {
    console.error('Error serving image:', error);
    res.status(500).json({ error: 'Failed to serve image' });
  }
};
