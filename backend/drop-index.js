import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const drop = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const collections = await mongoose.connection.db.listCollections().toArray();
        
        await mongoose.connection.db.collection('studentupdates').dropIndex('student_1_date_1_type_1');
    } catch (error) {
        console.error('Error dropping index:', error.message);
    } finally {
        await mongoose.disconnect();
    }
};

drop();
