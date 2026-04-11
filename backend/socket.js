const jwt = require('jsonwebtoken');
const db = require('./config/db');


const initSocket = (server) => {
    const { Server } = require('socket.io');

    const io = new Server(server, {
        cors: {
            origin: [
                'http://localhost:5173',
                'http://localhost:5174',
                'http://127.0.0.1:5173',
                'http://127.0.0.1:5174',
            ],
            methods: ['GET', 'POST'],
            credentials: true,
        },
    });

    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth?.token
                || socket.handshake.headers?.authorization?.replace('Bearer ', '');

            if (!token) return next(new Error('No token provided'));

            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            const { rows } = await db.query(
                `SELECT u.id, u.full_name, u.role_id, u.status, r.role_name
                 FROM Users u
                 JOIN User_roles r ON u.role_id = r.id
                 WHERE u.id = $1`,
                [decoded.id]
            );

            if (rows.length === 0) return next(new Error('User not found'));
            if (rows[0].status === 'blocked') return next(new Error('Account is blocked'));

            socket.user = rows[0];
            next();
        } catch (err) {
            next(new Error('Invalid token'));
        }
    });

    io.on('connection', (socket) => {
        console.log(`[Socket] Connected: ${socket.user.full_name} (${socket.user.role_name})`);

        socket.on('join_product', async ({ productId }) => {
            try {
                const { rows } = await db.query(
                    `SELECT id, vendor_id FROM Products WHERE id = $1`, [productId]
                );
                if (rows.length === 0) {
                    return socket.emit('error', { message: 'Product not found' });
                }

                const product = rows[0];
                const userId = socket.user.id;
                const roleId = socket.user.role_id;

                const isVendor = roleId === 4 && product.vendor_id === userId;
                const isCustomer = roleId === 2;

                if (!isVendor && !isCustomer) {
                    return socket.emit('error', { message: 'Not authorised for this chat' });
                }

                const room = `product:${productId}`;
                socket.join(room);
                console.log(`[Socket] ${socket.user.full_name} joined room ${room}`);
            } catch (err) {
                socket.emit('error', { message: 'Failed to join product chat' });
            }
        });

        socket.on('join_order', async ({ orderId }) => {
            try {
                const { rows } = await db.query(
                    `SELECT o.id, o.user_id AS customer_id, od.courier_id
                     FROM Orders o
                     LEFT JOIN order_deliveries od ON od.order_id = o.id
                     WHERE o.id = $1`,
                    [orderId]
                );

                if (rows.length === 0) {
                    return socket.emit('error', { message: 'Order not found' });
                }

                const order = rows[0];
                const userId = socket.user.id;
                const isCustomer = order.customer_id === userId;
                const isCourier = order.courier_id === userId;

                if (!isCustomer && !isCourier) {
                    return socket.emit('error', { message: 'Not authorised for this chat' });
                }

                const room = `order:${orderId}`;
                socket.join(room);
                console.log(`[Socket] ${socket.user.full_name} joined room ${room}`);
            } catch (err) {
                socket.emit('error', { message: 'Failed to join order chat' });
            }
        });

        socket.on('send_message', async ({ room_type, room_id, message }) => {
            try {
                if (!message?.trim()) return;
                if (!['product', 'order'].includes(room_type)) return;

                const room = `${room_type}:${room_id}`;

                if (!socket.rooms.has(room)) {
                    return socket.emit('error', { message: 'You must join the room first' });
                }
                const { rows } = await db.query(
                    `INSERT INTO messages (room_type, room_id, sender_id, message)
                     VALUES ($1, $2, $3, $4)
                     RETURNING id, created_at`,
                    [room_type, room_id, socket.user.id, message.trim()]
                );

                const payload = {
                    id: rows[0].id,
                    sender_id: socket.user.id,
                    sender_name: socket.user.full_name,
                    sender_role: socket.user.role_id,
                    message: message.trim(),
                    created_at: rows[0].created_at,
                    room_type,
                    room_id,
                };

                io.to(room).emit('message', payload);

            } catch (err) {
                console.error('[Socket] Error sending message:', err);
                socket.emit('error', { message: 'Failed to send message' });
            }
        });

        socket.on('disconnect', () => {
            console.log(`[Socket] Disconnected: ${socket.user.full_name}`);
        });
    });

    return io;
};

module.exports = initSocket;