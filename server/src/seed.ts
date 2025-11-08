import mongoose from 'mongoose';
import Region from './models/region.model';
import Station from './models/station.model';
import { config } from './config';

const seedData = async () => {
  try {
    await mongoose.connect(config.mongoUri);

    // Create regions
    const regions = [
      { name: 'Northern Region' },
      { name: 'Southern Region' },
      { name: 'Eastern Region' },
      { name: 'Western Region' }
    ];

    const createdRegions = await Region.insertMany(regions);
    console.log('Regions created:', createdRegions);

    // Create stations for each region
    const stations = [
      { name: 'Central Police Station', regionId: createdRegions[0]._id },
      { name: 'North Police Station', regionId: createdRegions[0]._id },
      { name: 'South Police Station', regionId: createdRegions[1]._id },
      { name: 'East Police Station', regionId: createdRegions[2]._id },
      { name: 'West Police Station', regionId: createdRegions[3]._id }
    ];

    const createdStations = await Station.insertMany(stations);
    console.log('Stations created:', createdStations);

    console.log('Seed data created successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedData();
