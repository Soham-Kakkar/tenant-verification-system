import { Request, Response } from 'express';
import Notification from '../models/notification.model';

export const getNotifications = async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const notifications = await Notification.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
};

export const markAsRead = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user!;

    const notification = await Notification.findOne({ _id: id, userId: user._id });
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    notification.read = true;
    await notification.save();

    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
};
