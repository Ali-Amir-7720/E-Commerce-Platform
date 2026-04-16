const db = require('../config/db');
const { hashPassword, comparePassword } = require('../utils/hash');
const { generateToken } = require('../utils/jwt');

const register = async (req, res) => {
    const { full_name, phone_number, role_name } = req.body;
    const email = req.body.email?.toLowerCase().trim();
    const password = req.body.password;

    if (!full_name || !email || !password || !role_name) {
        return res.status(400).json({ error: 'Missing required fields: full_name, email, password, role_name' });
    }
    if (password.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    try {
        const roleResult = await db.query(
            'SELECT id FROM User_roles WHERE role_name = $1',
            [role_name]
        );
        if (roleResult.rows.length === 0) {
            return res.status(400).json({ error: `Invalid role: '${role_name}'` });
        }
        const role_id = roleResult.rows[0].id;

        const userExist = await db.query(
            'SELECT id FROM Users WHERE email = $1',
            [email]
        );
        if (userExist.rows.length > 0) {
            return res.status(409).json({ error: 'Email already registered' });
        }

        const hashedPassword = await hashPassword(password);

        const insertResult = await db.query(
            `INSERT INTO Users (role_id, full_name, email, password, phone_number)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING id, role_id, full_name, email, status, created_at`,
            [role_id, full_name, email, hashedPassword, phone_number || null]
        );

        const newUser = insertResult.rows[0];

        return res.status(201).json({
            message: 'User registered successfully',
            user: {
                id: newUser.id,
                full_name: newUser.full_name,
                email: newUser.email,
                role_name,
                status: newUser.status,
            },
        });
    } catch (error) {
        console.error('Error in register:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

const login = async (req, res) => {
    const email = req.body.email?.toLowerCase().trim();
    const password = req.body.password;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    try {
        const { rows } = await db.query(
            `SELECT u.id, u.role_id, u.password, u.full_name, u.email, u.status,
                    r.role_name
             FROM Users u
             JOIN User_roles r ON u.role_id = r.id
             WHERE u.email = $1`,
            [email]
        );

        if (rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = rows[0];

        if (user.status === 'blocked') {
            return res.status(403).json({ error: 'Your account has been blocked. Contact support : nexus@admin.com' });
        }
        if (user.status === 'inactive') {
            return res.status(403).json({ error: 'Your account is inactive. Contact support : nexus@admin.com' });
        }

        const isMatch = await comparePassword(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = generateToken({
            id: user.id,
            role_id: user.role_id,
            role_name: user.role_name,
            email: user.email,
        });

        return res.status(200).json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                full_name: user.full_name,
                email: user.email,
                role_id: user.role_id,
                role_name: user.role_name,
                status: user.status,
            },
        });
    } catch (error) {
        console.error('Error in login:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

const getMe = async (req, res) => {
    try {
        const { rows } = await db.query(
            `SELECT u.id, u.full_name, u.email, u.phone_number,
                    u.status, u.created_at, r.role_name
             FROM Users u
             JOIN User_roles r ON u.role_id = r.id
             WHERE u.id = $1`,
            [req.user.id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        return res.status(200).json(rows[0]);
    } catch (error) {
        console.error('Error fetching user profile:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = { register, login, getMe };