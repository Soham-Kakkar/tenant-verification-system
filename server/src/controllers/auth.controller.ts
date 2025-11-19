import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User, { Role } from '../models/user.model';
import Region from '../models/region.model';
import Station from '../models/station.model';
import { config } from '../config';

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role, stationId, regionId } = req.body;

    // Check if superAdmin already exists
    if (role === Role.SUPERADMIN) {
      const existingSuperAdmin = await User.findOne({ role: Role.SUPERADMIN });
      if (existingSuperAdmin) {
        return res.status(400).json({ error: 'SuperAdmin already exists' });
      }
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Convert string IDs to ObjectIds
    let stationObjectId = null;
    let regionObjectId = null;

    if (stationId) {
      const station = await Station.findOne({ name: stationId });
      if (!station) {
        return res.status(400).json({ error: 'Invalid station' });
      }
      stationObjectId = station._id;
    }

    if (regionId) {
      const region = await Region.findOne({ name: regionId });
      if (!region) {
        return res.status(400).json({ error: 'Invalid region' });
      }
      regionObjectId = region._id;
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      email,
      passwordHash,
      role,
      stationId: stationObjectId,
      regionId: regionObjectId,
    });

    await user.save();

    const token = jwt.sign(
      { userId: user._id, role: user.role, stationId: user.stationId, regionId: user.regionId },
      config.jwtSecret,
      { expiresIn: '365d' }
    );

    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user || !user.passwordHash) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role, stationId: user.stationId, regionId: user.regionId },
      config.jwtSecret,
      { expiresIn: '1d' }
    );

    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
};

export const changePassword = async (req: Request, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = req.user;

    if (!user || !user.passwordHash) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValidPassword) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    user.passwordHash = newPasswordHash;
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
};

export const adminChangePassword = async (req: Request, res: Response) => {
  try {
    const { userId, newPassword } = req.body;
    const requester = req.user;

    // Only superAdmin can change anyone's password
    if (requester?.role !== Role.SUPERADMIN) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    user.passwordHash = newPasswordHash;
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Admin change password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
};
