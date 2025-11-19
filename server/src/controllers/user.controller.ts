import { Request, Response } from 'express';
import { Types } from 'mongoose';
import bcrypt from 'bcryptjs';
import User, { Role } from '../models/user.model';
import Station from '../models/station.model';
import Region from '../models/region.model';

export const getUsers = async (req: Request, res: Response) => {
  try {
    const user = req.user!;

    let query: any = {};

    if (user.role === 'admin1') {
      if (!user.stationId) {
        return res.status(400).json({ error: 'Station ID required for admin1' });
      }
      query = { role: 'admin2', stationId: user.stationId };
    } else if (user.role === Role.SUPERADMIN) {
      const role = req.query.role as string;
      const stationIdStr = req.query.stationId as string;
      if (role) {
        query.role = role;
      }
      if (stationIdStr) {
        query.stationId = new Types.ObjectId(stationIdStr);
      }
    } else {
      return res.status(403).json({ error: 'Not authorized to view users' });
    }

    const users = await User.find(query)
      .populate('stationId', 'name')
      .populate('regionId', 'name')
      .select('-passwordHash')
      .lean();

    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

export const createUser = async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    if (user.role !== Role.SUPERADMIN) {
      return res.status(403).json({ error: 'Only superAdmin can create users' });
    }

    const { name, email, password, role, stationId, regionId } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    let actualStationId: Types.ObjectId | undefined;
    let actualRegionId: Types.ObjectId | undefined;

    // Convert station name to ObjectId if provided
    if (stationId && typeof stationId === 'string') {
      const station = await Station.findOne({ name: stationId });
      if (!station) return res.status(400).json({ error: 'Invalid station' });
      actualStationId = station._id as Types.ObjectId;
    } else if (stationId) {
      actualStationId = new Types.ObjectId(stationId as string);
      const station = await Station.findById(actualStationId);
      if (!station) return res.status(400).json({ error: 'Invalid station' });
    }

    // Convert region name to ObjectId if provided
    if (regionId && typeof regionId === 'string') {
      const region = await Region.findOne({ name: regionId });
      if (!region) return res.status(400).json({ error: 'Invalid region' });
      actualRegionId = region._id as Types.ObjectId;
    } else if (regionId) {
      actualRegionId = new Types.ObjectId(regionId as string);
      const region = await Region.findById(actualRegionId);
      if (!region) return res.status(400).json({ error: 'Invalid region' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email,
      passwordHash,
      role,
      stationId: actualStationId,
      regionId: actualRegionId,
    });

    await newUser.save();

    res.json({ id: newUser._id, name: newUser.name, email: newUser.email, role: newUser.role });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create user' });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    if (user.role !== Role.SUPERADMIN) {
      return res.status(403).json({ error: 'Only superAdmin can update users' });
    }

    const { id } = req.params;
    const { name, email, role, stationId, regionId, password } = req.body;

    let actualStationId: Types.ObjectId | undefined;
    let actualRegionId: Types.ObjectId | undefined;

    // Convert station name to ObjectId if provided
    if (stationId && typeof stationId === 'string') {
      const station = await Station.findOne({ name: stationId });
      if (!station) return res.status(400).json({ error: 'Invalid station' });
      actualStationId = station._id as Types.ObjectId;
    } else if (stationId) {
      actualStationId = new Types.ObjectId(stationId as string);
      const station = await Station.findById(actualStationId);
      if (!station) return res.status(400).json({ error: 'Invalid station' });
    }

    // Convert region name to ObjectId if provided
    if (regionId && typeof regionId === 'string') {
      const region = await Region.findOne({ name: regionId });
      if (!region) return res.status(400).json({ error: 'Invalid region' });
      actualRegionId = region._id as Types.ObjectId;
    } else if (regionId) {
      actualRegionId = new Types.ObjectId(regionId as string);
      const region = await Region.findById(actualRegionId);
      if (!region) return res.status(400).json({ error: 'Invalid region' });
    }

    const updateData: any = { name, email, role, stationId: actualStationId, regionId: actualRegionId };
    if (password) {
      updateData.passwordHash = await bcrypt.hash(password, 10);
    }

    const updatedUser = await User.findByIdAndUpdate(id, updateData, { new: true })
      .populate('stationId', 'name')
      .populate('regionId', 'name')
      .select('-passwordHash');

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user' });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    if (user.role !== Role.SUPERADMIN) {
      return res.status(403).json({ error: 'Only superAdmin can delete users' });
    }

    const { id } = req.params;

    const deletedUser = await User.findByIdAndDelete(id);
    if (!deletedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
};

export const getUserById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id).select('name email');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
};
