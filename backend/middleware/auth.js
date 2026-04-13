import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            // Check if user still exists and if token version matches
            const user = await User.findById(decoded.id);
            
            if (!user) {
                return res.status(401).json({ message: 'User no longer exists' });
            }

            // Check token version for multi-device session management
            const dbTokenVersion = Number(user.tokenVersion || 0);
            const jwtTokenVersion = Number(decoded.tokenVersion || 0);

            if (dbTokenVersion !== jwtTokenVersion) {                return res.status(401).json({ message: 'Session expired, please login again' });
            }

            req.user = decoded; // { id, role, tokenVersion }
            return next();
        } catch (error) {
            console.error(error);
            return res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }
};

export const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ message: `User role ${req.user ? req.user.role : 'none'} is not authorized to access this route` });
        }
        next();
    };
};
