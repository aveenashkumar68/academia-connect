import bcrypt from 'bcryptjs';
import User from './models/User.js';
import Department from './models/Department.js';

export const seedSuperAdmin = async () => {
    try {
        const superAdminExists = await User.findOne({ role: 'super-admin' });

        if (!superAdminExists) {
            // Create a default super-admin
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('superadmin123', salt);

            const newSuperAdmin = new User({
                email: 'superadmin@example.com',
                password: hashedPassword,
                role: 'super-admin',
                name: 'Super Admin',
            });

            await newSuperAdmin.save();
            console.log('Super-Admin seeded successfully: superadmin@example.com / superadmin123');
        }
    } catch (error) {
        console.error('Error seeding super-admin:', error);
    }
};

export const seedDepartments = async () => {
    try {
        const count = await Department.countDocuments();
        if (count > 0) return;

        const depts = [
            { name: 'Aero', domains: ['Drone Technology', 'Aircraft Design', 'Propulsion Systems', 'Avionics', 'Flight Simulation', 'UAV Systems', 'Aerospace Materials', 'Aerodynamics'] },
            { name: 'Agri', domains: ['Smart Farming', 'Agri IoT', 'Soil & Water Management', 'Farm Machinery', 'Crop Analytics', 'Food Processing', 'Renewable Energy in Agriculture'] },
            { name: 'AI & DS', domains: ['Machine Learning', 'Deep Learning', 'Big Data Analytics', 'Data visualization', 'AI for Health care', 'Natural Language Processing', 'Data Security'] },
            { name: 'AI & ML', domains: ['Artificial Intelligence', 'computer vision', 'Neural Network', 'Reinforcement Learning', 'Generative AI', 'Edge AI', 'Automation system'] },
            { name: 'BME', domains: ['Medical Imaging', 'Bio informatic', 'Biomechanics', 'Health care IOT', 'Cleanical data analytics', 'Wearable Devices', 'Rehabilation Engineering'] },
            { name: 'CSE', domains: ['Data Science', 'Artificial Intelligence', 'Blockchain', 'Cyber Security', 'Ethical Hacking', 'Software Development', 'Cloud Computing', 'Testing'] },
            { name: 'CS BS', domains: ['Enterprise Systems', 'Business Analytics', 'ERP Management', 'FinTech Application', 'E-Commerce Systems', 'Data-Driven Decision Making', 'Cloud ERP'] },
            { name: 'Civil', domains: ['Structural Engineering', 'Smart Cities', 'Construction Management', 'Surveying & GIS', 'Sustainable Design', 'Transportation Systems', 'Environmental Engineering'] },
            { name: 'ECE', domains: ['Embedded Systems', 'VLSI Design', 'Internet of Things (IoT)', 'Robotics', 'Communication Networks', 'Signal Processing', 'Automation Systems'] },
            { name: 'EEE', domains: ['Power Systems', 'Renewable Energy', 'Electric Vehicles', 'Smart Grids', 'Industrial Automation', 'Control Systems', 'Energy Management'] },
            { name: 'Food Tech', domains: ['Food Processing & Inspection', 'Quality Control & Waste Mgt', 'Food Packaging', 'Food Safety & Hygiene Practices', 'Nutraceuticals & HACCP', 'Food Biotechnology', 'Product Development', 'Food Microbiology'] },
            { name: 'IT', domains: ['Cloud Computing', 'Full Stack Development', 'Mobile Application Development', 'Cyber Security', 'UI/UX Design', 'Data Analytics', 'DevOps'] },
            { name: 'Mech Engg', domains: ['CAD/CAM', 'Thismal Engineering', 'Robotics', 'Manufacturing Systems', 'Mechatronics', '3D Printing', 'Automotive Systems', 'Industrial Design'] },
            { name: 'M.Tech CSE', domains: ['Advanced AI', 'Cloud Architecture', 'Distributed Computing', 'Research Methodologies', 'Data Engineering', 'Deep Learning', 'DevOps', 'Quantum Computing'] },
            { name: 'MBA', domains: ['Marketing Management', 'Financial Analytics', 'Human resource Management', 'Operations and supply chain', 'Entrepreneurship', 'Digital Business', 'Business Stratergy'] },
            { name: 'MCA', domains: ['Software Engineering', 'Database Management', 'Web Technologies', 'Cloud Services', 'AI Applications', 'Mobile Computing', 'System Integration'] },
            { name: 'FSE', domains: ['Fire Detection and Alarm System', 'Fire Suppression Technologies', 'Buiding Fire Protection Design', 'Emergencey Response Management', 'Industrial Fire Safety', 'Electrical Fire Prevention', 'WildFire Monitoring System', 'Firesafety Training and Simualation'] },
            { name: 'PCT', domains: ['Petrochemical Production', 'PCT - R&D', 'Medicines from Petrochemicals', 'LPG', 'Refining & Processing', 'Distillery Prodn & Applications', 'Petrochemicals for Agriculture', 'IOT & AI DS in PCT'] }
        ];

        await Department.insertMany(depts);
        console.log('Departments seeded successfully');
    } catch (error) {
        console.error('Error seeding departments:', error);
    }
};

