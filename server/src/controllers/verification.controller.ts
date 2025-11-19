import { Request, Response } from 'express';
import Joi from 'joi';
import Verification, { VerificationStatus } from '../models/verification.model';
import User from '../models/user.model';
import Notification from '../models/notification.model';

const delegateSchema = Joi.object({
  assigneeId: Joi.string().required(),
  comment: Joi.string().allow(''),
});

const verifySchema = Joi.object({
  result: Joi.string().valid('verified', 'flagged').required(),
  comment: Joi.string(),
});

export const getVerifications = async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    let query: any = {};

    if (user.role === 'admin1') {
      query.stationId = user.stationId;
      query.$or = [
        { status: { $in: ['pending', 'submitted', 'returned'] } },
        { status: 'assigned', assignedTo: user._id }
      ];
    } else if (user.role === 'admin2') {
      query.assignedTo = user._id;
    } else if (user.role === 'admin0') {
      query.regionId = user.regionId;
    } else if (user.role === 'superAdmin') {
      // SuperAdmin can see all
    }

    // Search functionality
    const { searchText, startDate, endDate } = req.query;

    if (searchText && typeof searchText === 'string') {
      const regex = new RegExp(searchText, 'i');
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { landlordName: regex },
          { landlordPhone: regex },
          { tenantName: regex },
          { tenantPhone: regex },
          { address: regex },
          { purposeOfStay: regex },
          { previousAddress: regex },
          { fatherName: regex },
          { aadharNumber: regex }
        ]
      });
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate as string);
      if (endDate) query.createdAt.$lte = new Date(endDate as string);
    }

    const verifications = await Verification.find(query)
      .populate('assignedTo', 'name email')
      .populate('stationId', 'name')
      .sort({ createdAt: -1 });

    res.json(verifications);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch verifications' });
  }
};

export const getVerification = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const verification = await Verification.findById(id)
      .populate('assignedTo', 'name email')
      .populate('assignedBy', 'name email')
      .populate('stationId', 'name')
      .populate('regionId', 'name')
      .populate('history.actionBy', 'name');

    if (!verification) {
      return res.status(404).json({ error: 'Verification not found' });
    }

    res.json(verification);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch verification' });
  }
};

export const delegate = async (req: Request, res: Response) => {
  try {
    const { error, value } = delegateSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const user = req.user!;
    const { id } = req.params;
    const { assigneeId, comment } = value;

    const verification = await Verification.findById(id);
    if (!verification) {
      return res.status(404).json({ error: 'Verification not found' });
    }

    if (verification.stationId.toString() !== user.stationId?.toString()) {
      return res.status(403).json({ error: 'Not allowed' });
    }

    const assignee = await User.findById(assigneeId);
    if (!assignee || assignee.role !== 'admin2' || assignee.stationId?.toString() !== user.stationId?.toString()) {
      return res.status(400).json({ error: 'Invalid assignee' });
    }

    verification.assignedTo = assignee._id as any;
    verification.assignedBy = user._id as any;
    verification.status = VerificationStatus.ASSIGNED;
    verification.history.push({
      actionBy: user._id as any,
      action: `Delegated to ${assignee.name}`,
      comment,
      at: new Date(),
    });
    await verification.save();

    await Notification.create({
      userId: assignee._id,
      title: 'New task assigned',
      body: `Assigned request ${verification._id}`,
      meta: { verificationId: verification._id },
    });

    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: 'Delegation failed' });
  }
};

export const verify = async (req: Request, res: Response) => {
  try {
    const { error, value } = verifySchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const user = req.user!;
    const { id } = req.params;
    const { result, comment } = value;

    const verification = await Verification.findById(id);
    if (!verification) {
      return res.status(404).json({ error: 'Verification not found' });
    }

    // Permission checks
    if (user.role === 'admin2') {
      if (!verification.assignedTo || verification.assignedTo.toString() !== (user._id as any).toString()) {
        return res.status(403).json({ error: 'Not allowed' });
      }
    } else if (user.role === 'admin1') {
      if (verification.stationId.toString() !== user.stationId?.toString()) {
        return res.status(403).json({ error: 'Not allowed' });
      }
    } else if (user.role !== 'admin0' && user.role !== 'superAdmin') {
      return res.status(403).json({ error: 'Not allowed' });
    }

    if (user.role === 'admin2') {
      // Admin2 submits for admin1 final review
      verification.status = VerificationStatus.RETURNED;
      verification.assignedTo = undefined; // Clear assignment, status indicates it's returned for review
      verification.history.push({
        actionBy: user._id as any,
        action: 'returned_for_final_review',
        comment,
        at: new Date(),
      });
    } else {
      // Admin1, admin0, superAdmin set final status
      verification.status = result === 'verified' ? VerificationStatus.VERIFIED : VerificationStatus.FLAGGED;
      verification.history.push({
        actionBy: user._id as any,
        action: result,
        comment,
        at: new Date(),
      });
    }
    verification.updatedAt = new Date();
    await verification.save();

    // Notify assignedBy (admin1) and admin0
    const notifications = [];
    if (user.role === 'admin2' && verification.assignedBy) {
      // Admin2 submitted, notify admin1 for final review
      notifications.push(
        Notification.create({
          userId: verification.assignedBy,
          title: 'Request ready for final verification',
          body: `Request ${verification._id} is ready for your final review`,
          meta: { verificationId: verification._id },
        })
      );
    } else if (verification.assignedBy) {
      // Final verification completed, notify admin1
      notifications.push(
        Notification.create({
          userId: verification.assignedBy,
          title: 'Request updated',
          body: `Request ${verification._id} marked ${verification.status}`,
          meta: { verificationId: verification._id },
        })
      );
    }

    // Notify admin0 of the region
    const regionAdmins = await User.find({ regionId: verification.regionId, role: 'admin0' });
    regionAdmins.forEach((admin) => {
      notifications.push(
        Notification.create({
          userId: admin._id,
          title: 'Request updated',
          body: `Request ${verification._id} marked ${verification.status}`,
          meta: { verificationId: verification._id },
        })
      );
    });

    await Promise.all(notifications);

    res.json({ ok: true, status: verification.status });
  } catch (error) {
    res.status(500).json({ error: 'Verification failed' });
  }
};

export const getStats = async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    if (user.role !== 'admin0' && user.role !== 'superAdmin') {
      return res.status(403).json({ error: 'Not allowed' });
    }

    const matchQuery = user.role === 'admin0' ? { regionId: user.regionId } : {};

    const stats = await Verification.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          submitted: { $sum: { $cond: [{ $eq: ['$status', 'submitted'] }, 1, 0] } },
          assigned: { $sum: { $cond: [{ $eq: ['$status', 'assigned'] }, 1, 0] } },
          verified: { $sum: { $cond: [{ $eq: ['$status', 'verified'] }, 1, 0] } },
          flagged: { $sum: { $cond: [{ $eq: ['$status', 'flagged'] }, 1, 0] } },
        },
      },
      { $sort: { '_id': -1 } },
    ]);

    res.json({ stats });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
};

export const getLogs = async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    if (user.role !== 'admin0' && user.role !== 'superAdmin') {
      return res.status(403).json({ error: 'Not allowed' });
    }

    let matchQuery: any = user.role === 'admin0' ? { regionId: user.regionId } : {};

    // Search functionality
    const { searchText, startDate, endDate } = req.query;

    if (searchText && typeof searchText === 'string') {
      const regex = new RegExp(searchText, 'i');
      matchQuery.$and = matchQuery.$and || [];
      matchQuery.$and.push({
        $or: [
          { landlordName: regex },
          { landlordPhone: regex },
          { tenantName: regex },
          { tenantPhone: regex },
          { address: regex },
          { purposeOfStay: regex },
          { previousAddress: regex },
          { fatherName: regex },
          { aadharNumber: regex }
        ]
      });
    }

    if (startDate || endDate) {
      matchQuery.updatedAt = {};
      if (startDate) matchQuery.updatedAt.$gte = new Date(startDate as string);
      if (endDate) matchQuery.updatedAt.$lte = new Date(endDate as string);
    }

    const logs = await Verification.find({
      ...matchQuery,
      status: { $in: ['verified', 'flagged'] }
    })
      .populate('regionId', 'name')
      .populate('stationId', 'name')
      .sort({ updatedAt: -1 });

    res.json({ logs });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
};
