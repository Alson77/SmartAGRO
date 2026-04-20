const mongoose = require('mongoose');
const Expert = require('./models/Expert');
require('dotenv').config();

const experts = [
  {
    name: 'Dr. Bebish Shrestha',
    role: 'Crop Disease Specialist',
    crops: ['Tomato', 'Potato', 'Pepper', 'Eggplant'],
    specialization: ['Disease Control', 'Pesticide Management', 'Integrated Pest Management'],
    phone: '+977-9801234567',
    whatsapp: '+977-9801234567',
    email: 'bebish.shrestha@agri.gov.np',
    district: 'Kathmandu',
    bio: 'PhD in Plant Pathology with 15 years of field experience in vegetable crop diseases.',
    experience: 15,
    rating: 4.8,
    totalReviews: 127,
    languages: ['Nepali', 'English', 'Hindi'],
    certifications: ['PhD Plant Pathology', 'IPM Certified', 'Pesticide License'],
    isOnline: true,
    consultationFee: 500,
    responseTime: 2,
    totalConsultations: 450
  },
  {
    name: 'Manish Puri',
    role: 'Organic Farming Expert',
    crops: ['Rice', 'Wheat', 'Corn', 'Soybean', 'Lentils'],
    specialization: ['Organic Methods', 'Soil Health', 'Composting', 'Biofertilizers'],
    phone: '+977-9812345678',
    whatsapp: '+977-9812345678',
    email: 'manish.puri@smartagro.np',
    district: 'Itahari',
    bio: 'Certified organic farming consultant with 10+ years experience in sustainable agriculture.',
    experience: 10,
    rating: 4.9,
    totalReviews: 89,
    languages: ['Nepali', 'English', 'Maithili'],
    certifications: ['IFOAM Certified', 'Organic Farming License', 'Soil Health Expert'],
    isOnline: true,
    consultationFee: 300,
    responseTime: 4,
    totalConsultations: 320
  },
  {
    name: 'Mishan Katuwal',
    role: 'Horticulture Advisor',
    crops: ['Apple', 'Grape', 'Strawberry', 'Kiwi', 'Pear'],
    specialization: ['Fruit Production', 'Post-Harvest', 'Cold Storage', 'Export Quality'],
    phone: '+977-9823456789',
    whatsapp: '+977-9823456789',
    email: 'mishan.katuwal@agri.np',
    district: 'Urlabari',
    bio: 'Horticulture specialist focused on hill region fruit crops and value addition.',
    experience: 12,
    rating: 4.7,
    totalReviews: 156,
    languages: ['Nepali', 'English'],
    certifications: ['MSc Horticulture', 'Post-Harvest Technology', 'GAP Certified'],
    isOnline: false,
    consultationFee: 400,
    responseTime: 6,
    totalConsultations: 280
  },
  {
    name: 'Nigam Shrestha',
    role: 'Soil & Fertilizer Expert',
    crops: ['Soybean', 'Squash', 'Peach', 'Rice', 'Wheat'],
    specialization: ['Soil Testing', 'Nutrient Management', 'Fertilizer Optimization', 'pH Management'],
    phone: '+977-9834567890',
    whatsapp: '+977-9834567890',
    email: 'nigam.shrestha@krishi.np',
    district: 'Dharan',
    bio: 'Soil scientist helping farmers optimize fertilizer use and improve soil health.',
    experience: 8,
    rating: 4.6,
    totalReviews: 94,
    languages: ['Nepali', 'English', 'Bengali'],
    certifications: ['MSc Soil Science', 'Fertilizer License', 'Soil Testing Certified'],
    isOnline: true,
    consultationFee: 350,
    responseTime: 3,
    totalConsultations: 210
  },
  {
    name: 'Sita Pandey',
    role: 'Women Farmer Support Specialist',
    crops: ['Vegetables', 'Herbs', 'Spices', 'Flowers'],
    specialization: ['Women Empowerment', 'Kitchen Gardening', 'Value Addition', 'Marketing'],
    phone: '+977-9845678901',
    whatsapp: '+977-9845678901',
    email: 'sita.pandey@smartagro.np',
    district: 'Pokhara',
    bio: 'Supporting women farmers with technical knowledge and business development.',
    experience: 7,
    rating: 4.9,
    totalReviews: 78,
    languages: ['Nepali', 'English'],
    certifications: ['Women Entrepreneurship', 'Agri-Business', 'Extension Services'],
    isOnline: true,
    consultationFee: 250,
    responseTime: 5,
    totalConsultations: 190
  },
  {
    name: 'Rajesh Thapa',
    role: 'Irrigation & Water Management Expert',
    crops: ['Rice', 'Wheat', 'Sugarcane', 'Vegetables'],
    specialization: ['Drip Irrigation', 'Sprinkler Systems', 'Water Conservation', 'Climate Smart Agriculture'],
    phone: '+977-9856789012',
    whatsapp: '+977-9856789012',
    email: 'rajesh.thapa@irrigation.np',
    district: 'Chitwan',
    bio: 'Irrigation engineer specializing in efficient water use for agriculture.',
    experience: 11,
    rating: 4.8,
    totalReviews: 112,
    languages: ['Nepali', 'English', 'Hindi'],
    certifications: ['BE Irrigation Engineering', 'Water Management', 'Climate Adaptation'],
    isOnline: true,
    consultationFee: 450,
    responseTime: 4,
    totalConsultations: 340
  }
];

mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    await Expert.deleteMany({});
    await Expert.insertMany(experts);
    console.log('✅ Experts seeded successfully');
    process.exit();
  })
  .catch((err) => {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
  });