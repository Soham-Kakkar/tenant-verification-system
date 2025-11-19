import mongoose from 'mongoose';
import bcrypt from 'bcryptjs'
import Region from './models/region.model';
import Station from './models/station.model';
import User from './models/user.model';
import { config } from './config';
import seedDataJson from './seed.json';

const seedData = async () => {
  try {
    await mongoose.connect(config.mongoUri);

    // Create Jammu region
    const jammuRegion = await Region.findOne({ name: 'Jammu' });
    console.log('Region fetched:', jammuRegion);

    // Create SDPOs (stations) under Jammu region
    for (const sdpo of seedDataJson) {
      const station = await Station.create({
        name: sdpo.sdpo,
        regionId: jammuRegion!._id
      });
      console.log('SDPO created:', sdpo.sdpo);

      // Create user for each SDPO
      const reducedSDPOName = sdpo.sdpo.toLowerCase().replace(/\s+/g, '').replace(/\./g, '');
      const SDPOpasswordHash = await bcrypt.hash(`${reducedSDPOName}@Password`, 10);
      await User.create({
        name: `${sdpo.sdpo}`,
        email: `admin1@${reducedSDPOName}.police`,
        passwordHash: SDPOpasswordHash, // password
        role: 'admin1',
        stationId: station._id,
        regionId: jammuRegion!._id
      });
      console.log('Admin1 user created for', sdpo.sdpo);

      // Create users for each unit under SDPO
      for (const unit of sdpo.units) {
        const reducedUnitName = unit.toLowerCase().replace(/\s+/g, '').replace(/\./g, '');
        const UnitpasswordHash = await bcrypt.hash(`${reducedSDPOName}@Password`, 10);
        await User.create({
          name: `${unit}`,
          email: `admin2@${reducedUnitName}.police`,
          passwordHash: UnitpasswordHash, // password
          role: 'admin2',
          stationId: station._id,
          regionId: jammuRegion!._id
        });
        console.log('Admin2 user created for', unit);
      }
    }

    // Create admin0 user for Jammu region
    const reducedSSPName = 'SSP Jammu'.toLowerCase().replace(/\s+/g, '').replace(/\./g, '');
    const SSPpasswordHash = await bcrypt.hash(`${reducedSSPName}@Password`, 10);
    await User.create({
      name: 'SSP Jammu',
      email: 'admin0@jammu.com',
      passwordHash: SSPpasswordHash, // password
      role: 'admin0',
      regionId: jammuRegion!._id
    });
    console.log('Admin0 user created for Jammu');

    console.log('Seed data created successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedData();
