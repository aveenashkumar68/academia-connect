import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const drop = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('Collections:', collections.map(c => c.name));
        
        await mongoose.connection.db.collection('studentupdates').dropIndex('student_1_date_1_type_1');
        console.log('Index student_1_date_1_type_1 dropped successfully');
    } catch (error) {
        console.error('Error dropping index:', error.message);
    } finally {
        await mongoose.disconnect();
    }
};

drop();
