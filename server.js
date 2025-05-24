const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const mongoose = require("mongoose");
const mysql = require("mysql2/promise");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
    },
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static("view"));

// MySQL connection configuration
const mysqlConfig = {
    host: "localhost",
    user: "root",
    password: "",
    database: "student_manager",
};

let mysqlConnection;

// Function to establish MySQL connection
async function connectToMySQL() {
    try {
        mysqlConnection = await mysql.createConnection(mysqlConfig);
        console.log("Підключено до MySQL");
    } catch (err) {
        console.error("Помилка підключення до MySQL:", err);
    }
}

mongoose
    .connect("mongodb://localhost:27017/student_chat", {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 5000,
    })
    .then(() => {
        console.log("Підключено до MongoDB");
    })
    .catch((err) => {
        console.error("Помилка підключення до MongoDB:", err.message);
        console.error("Детальна помилка:", err);
    });

const User = require("./chat-server/models/User");
const ChatRoom = require("./chat-server/models/ChatRoom");
const Message = require("./chat-server/models/Message");
const Notification = require("./chat-server/models/Notification");

// Function to sync user from MySQL to MongoDB
async function syncUser(first_name, last_name, birthday) {
    try {
        console.log(`Attempting to sync user: ${first_name} ${last_name}, birthday: ${birthday}`);

        // Create query conditions
        const query = { first_name, last_name };

        // Add birthday to query if provided
        if (birthday) {
            query.birthday = birthday;
            console.log("Using birthday in query:", birthday);
        } else {
            console.log("Birthday not provided, using name-only query");
        }

        console.log("MongoDB query:", JSON.stringify(query));

        // Check if user exists in MongoDB
        let user = await User.findOne(query);
        console.log("User found in MongoDB:", user ? "Yes" : "No");

        if (!user) {
            // Generate username
            const username = `${first_name.toLowerCase()}_${last_name.toLowerCase()}`;
            console.log("Generated username:", username);

            // Create user data
            const userData = {
                first_name,
                last_name,
                username,
                email: `${username}@example.com`, // Default email
                password: "defaultpassword", // Default password
            };

            // Add birthday if provided
            if (birthday) {
                userData.birthday = birthday;
            } else {
                // Use a default birthday if not provided
                userData.birthday = new Date("2000-01-01");
                console.log("Using default birthday:", userData.birthday);
            }

            console.log("Creating new user with data:", JSON.stringify(userData));

            // If user doesn't exist, create new user
            try {
                user = await User.create(userData);
                console.log(`Новий користувач синхронізований: ${first_name} ${last_name}, ID: ${user._id}`);
            } catch (createErr) {
                console.error("Error creating user in MongoDB:", createErr);
                if (createErr.code === 11000) {
                    // Handle duplicate key error
                    console.log("Duplicate key error. Trying to find existing user with username:", username);
                    user = await User.findOne({ username });
                    if (user) {
                        console.log("Found user by username:", user._id);
                        return user;
                    }
                }
                throw createErr;
            }
        }

        return user;
    } catch (err) {
        console.error("Детальна помилка синхронізації користувача:", err);
        console.error("Stack trace:", err.stack);
        return null;
    }
}

// API routes
app.post("/api/chat/auth", async (req, res) => {
    try {
        console.log("Auth request received:", req.body);
        const { first_name, last_name, birthday } = req.body;

        if (!first_name || !last_name) {
            console.log("Missing required fields:", { first_name, last_name });
            return res.status(400).json({ success: false, message: "First name and last name are required" });
        }

        // Create query conditions
        const conditions = { first_name, last_name };

        // Add birthday to conditions if provided
        if (birthday) {
            conditions.birthday = birthday;
        }

        console.log("MySQL query conditions:", conditions);

        // Check in MySQL first - if birthday is missing, search by name only
        let query = "SELECT * FROM students WHERE first_name = ? AND last_name = ?";
        let params = [first_name, last_name];

        if (birthday) {
            query += " AND birthday = ?";
            params.push(birthday);
        }

        console.log("MySQL query:", query);
        console.log("MySQL params:", params);

        try {
            const [rows] = await mysqlConnection.execute(query, params);
            console.log("MySQL query result:", rows.length > 0 ? "User found" : "User not found");

            if (rows.length > 0) {
                // If found in MySQL, sync to MongoDB
                const birthdayDate = birthday ? new Date(birthday) : null;
                console.log("Syncing to MongoDB with birthday:", birthdayDate);

                const user = await syncUser(first_name, last_name, birthdayDate);

                if (user) {
                    console.log("User synced successfully, returning user data");
                    return res.json({ success: true, user });
                } else {
                    console.error("User sync failed - syncUser returned null");
                    return res.status(500).json({
                        success: false,
                        message: "Помилка синхронізації користувача",
                        details: "syncUser function returned null",
                    });
                }
            } else {
                // If not found with exact match, try finding by name only
                if (birthday) {
                    console.log("Trying name-only search in MySQL");
                    const [nameOnlyRows] = await mysqlConnection.execute(
                        "SELECT * FROM students WHERE first_name = ? AND last_name = ?",
                        [first_name, last_name]
                    );

                    console.log("Name-only search result:", nameOnlyRows.length > 0 ? "User found" : "User not found");

                    if (nameOnlyRows.length > 0) {
                        // Found by name only, sync to MongoDB
                        const user = await syncUser(first_name, last_name, null);
                        if (user) {
                            console.log("User synced successfully with name-only search");
                            return res.json({ success: true, user });
                        } else {
                            console.error("User sync failed after name-only search");
                        }
                    }
                }

                console.log("User not found in MySQL database");
                return res.status(401).json({ success: false, message: "Користувача не знайдено" });
            }
        } catch (sqlError) {
            console.error("MySQL query error:", sqlError);
            return res.status(500).json({
                success: false,
                message: "Помилка бази даних MySQL",
                details: sqlError.message,
            });
        }
    } catch (err) {
        console.error("General authentication error:", err);
        return res.status(500).json({
            success: false,
            message: "Внутрішня помилка сервера",
            details: err.message,
        });
    }
});

// Get all chat rooms for a user
app.get("/api/chat/rooms/:userId", async (req, res) => {
    try {
        const userId = req.params.userId;
        const chatRooms = await ChatRoom.find({
            participants: userId,
        })
            .populate("participants", "first_name last_name username avatar status lastActive")
            .populate("lastMessage");

        res.json({ success: true, chatRooms });
    } catch (err) {
        console.error("Помилка отримання чатів:", err);
        res.status(500).json({ success: false, message: "Внутрішня помилка сервера" });
    }
});

// Get messages for a specific chat room
app.get("/api/chat/messages/:roomId", async (req, res) => {
    try {
        const roomId = req.params.roomId;
        const messages = await Message.find({
            chatRoom: roomId,
        })
            .populate("sender", "first_name last_name username avatar")
            .sort({ createdAt: 1 });

        res.json({ success: true, messages });
    } catch (err) {
        console.error("Помилка отримання повідомлень:", err);
        res.status(500).json({ success: false, message: "Внутрішня помилка сервера" });
    }
});

// Create a new chat room
app.post("/api/chat/rooms", async (req, res) => {
    try {
        const { name, participants, createdBy } = req.body;

        const chatRoom = await ChatRoom.create({
            name,
            participants,
            createdBy,
            type: participants.length > 2 ? "group" : "private",
        });

        const populatedRoom = await ChatRoom.findById(chatRoom._id).populate(
            "participants",
            "first_name last_name username avatar status lastActive"
        );

        // Notify all participants about the new chat room
        participants.forEach((participantId) => {
            io.to(participantId).emit("new_chat_room", populatedRoom);
        });

        res.json({ success: true, chatRoom: populatedRoom });
    } catch (err) {
        console.error("Помилка створення чату:", err);
        res.status(500).json({ success: false, message: "Внутрішня помилка сервера" });
    }
});

// Get all students (potential chat members)
app.get("/api/chat/students", async (req, res) => {
    try {
        // Get all students from MySQL database
        const [students] = await mysqlConnection.execute("SELECT * FROM students");

        // For each student, check if they exist in MongoDB, if not - create them
        const mongoStudents = [];

        for (const student of students) {
            // Try to find or create user in MongoDB
            const mongoUser = await syncUser(student.first_name, student.last_name, new Date(student.birthday));

            if (mongoUser) {
                // Add MySQL ID for reference
                mongoUser._mysqlId = student.id;
                mongoStudents.push(mongoUser);
            }
        }

        res.json({ success: true, students: mongoStudents });
    } catch (err) {
        console.error("Помилка отримання списку студентів:", err);
        res.status(500).json({ success: false, message: "Внутрішня помилка сервера" });
    }
});

// Delete a chat room
app.delete("/api/chat/rooms/:roomId", async (req, res) => {
    try {
        const roomId = req.params.roomId;
        const userId = req.query.userId; // User who is deleting the room

        // Check if room exists
        const chatRoom = await ChatRoom.findById(roomId);
        if (!chatRoom) {
            return res.status(404).json({ success: false, message: "Чат не знайдено" });
        }

        // Check if user is a participant
        if (!chatRoom.participants.includes(userId)) {
            return res.status(403).json({ success: false, message: "Ви не є учасником чату" });
        }

        // Delete all messages in the chat room
        await Message.deleteMany({ chatRoom: roomId });

        // Delete the chat room
        await ChatRoom.findByIdAndDelete(roomId);

        // Notify all participants about the deleted chat room
        chatRoom.participants.forEach((participantId) => {
            const socketId = connectedUsers.get(participantId.toString());
            if (socketId) {
                io.to(socketId).emit("chat_room_deleted", { roomId });
            }
        });

        res.json({ success: true, message: "Чат успішно видалено" });
    } catch (err) {
        console.error("Помилка видалення чату:", err);
        res.status(500).json({ success: false, message: "Внутрішня помилка сервера" });
    }
});

// Get student interaction history
app.get("/api/chat/student/:studentId/history", async (req, res) => {
    try {
        const studentId = req.params.studentId;
        const currentUserId = req.query.currentUserId;

        if (!currentUserId) {
            return res.status(400).json({ success: false, message: "Не вказано поточного користувача" });
        }

        // Find the MongoDB user by MySQL ID
        const [rows] = await mysqlConnection.execute("SELECT * FROM students WHERE id = ?", [studentId]);

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: "Студента не знайдено" });
        }

        const student = rows[0];

        // Find or create MongoDB user for this student
        const studentMongoUser = await syncUser(student.first_name, student.last_name, new Date(student.birthday));

        if (!studentMongoUser) {
            return res.status(404).json({ success: false, message: "Не вдалося знайти студента в MongoDB" });
        }

        // Find private chat room between these two users
        const chatRoom = await ChatRoom.findOne({
            type: "private",
            participants: {
                $all: [currentUserId, studentMongoUser._id],
            },
        }).populate("participants", "first_name last_name username avatar");

        let messages = [];
        let roomData = null;

        // If chat room exists, get messages
        if (chatRoom) {
            messages = await Message.find({ chatRoom: chatRoom._id })
                .populate("sender", "first_name last_name username avatar")
                .sort({ createdAt: 1 });

            roomData = {
                _id: chatRoom._id,
                name: chatRoom.name,
                type: chatRoom.type,
                participants: chatRoom.participants,
            };
        }

        // Get student details from MySQL
        const studentDetails = {
            id: student.id,
            first_name: student.first_name,
            last_name: student.last_name,
            group_name: student.group_name,
            gender: student.gender,
            birthday: student.birthday,
            mongoId: studentMongoUser._id,
        };

        res.json({
            success: true,
            student: studentDetails,
            chatRoom: roomData,
            messages: messages,
        });
    } catch (err) {
        console.error("Помилка отримання історії взаємодії:", err);
        res.status(500).json({ success: false, message: "Внутрішня помилка сервера" });
    }
});

// Get user's unread notifications
app.get("/api/notifications/:userId", async (req, res) => {
    try {
        const userId = req.params.userId;

        const notifications = await Notification.find({
            recipient: userId,
            isRead: false,
        })
            .populate("sender", "first_name last_name username avatar")
            .populate("chatRoom", "name type")
            .sort({ createdAt: -1 });

        res.json({ success: true, notifications });
    } catch (err) {
        console.error("Error getting notifications:", err);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
});

// Mark notification as read
app.put("/api/notifications/:notificationId/read", async (req, res) => {
    try {
        const notificationId = req.params.notificationId;

        const notification = await Notification.findByIdAndUpdate(notificationId, { isRead: true }, { new: true });

        if (!notification) {
            return res.status(404).json({ success: false, message: "Notification not found" });
        }

        res.json({ success: true, notification });
    } catch (err) {
        console.error("Error marking notification as read:", err);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
});

// Mark all notifications as read
app.put("/api/notifications/:userId/read-all", async (req, res) => {
    try {
        const userId = req.params.userId;

        await Notification.updateMany({ recipient: userId, isRead: false }, { isRead: true });

        res.json({ success: true, message: "All notifications marked as read" });
    } catch (err) {
        console.error("Error marking all notifications as read:", err);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
});

// Map to track connected users (userId -> socketId)
const connectedUsers = new Map();

// Socket.io connection handler
io.on("connection", (socket) => {
    console.log("Новий клієнт підключений:", socket.id);

    // Authentication handler
    socket.on("authenticate", async (data) => {
        try {
            const { userId } = data;
            if (!userId) {
                socket.emit("authenticated", { success: false, message: "User ID is required" });
                return;
            }

            const user = await User.findById(userId);
            if (!user) {
                socket.emit("authenticated", { success: false, message: "User not found" });
                return;
            }

            // Associate socket with user
            socket.userId = userId;
            connectedUsers.set(userId, socket.id);

            // Join all rooms where user is a participant
            const rooms = await ChatRoom.find({ participants: userId });
            rooms.forEach((room) => {
                const roomId = room._id.toString();
                socket.join(roomId);
                console.log(`User ${userId} joined room ${roomId}`);
            });

            // Update user status to online
            user.status = "online";
            user.lastActive = new Date();
            await user.save();

            // Broadcast user status to all chat rooms they're in
            const userChatRooms = await ChatRoom.find({ participants: userId });
            userChatRooms.forEach((room) => {
                room.participants.forEach((participantId) => {
                    if (participantId.toString() !== userId && connectedUsers.has(participantId.toString())) {
                        io.to(connectedUsers.get(participantId.toString())).emit("user_status", {
                            userId,
                            status: "online",
                        });
                    }
                });
            });

            socket.emit("authenticated", { success: true });
            console.log(`Користувач ${userId} автентифікований`);
        } catch (err) {
            console.error("Помилка автентифікації:", err);
            socket.emit("authenticated", { success: false, message: "Authentication error" });
        }
    });

    // Status update handler
    socket.on("update_status", async (data) => {
        try {
            const userId = socket.userId;
            if (!userId) return;

            // Simplify to only online/offline
            // "away" is treated as "online" for simplicity
            let status = data.status;
            if (status === "away") status = "online";

            // Update user status
            const user = await User.findById(userId);
            if (user) {
                user.status = status;
                user.lastActive = new Date();
                await user.save();

                // Broadcast status update to all users in the same chat rooms
                const userChatRooms = await ChatRoom.find({ participants: userId });
                userChatRooms.forEach((room) => {
                    room.participants.forEach((participantId) => {
                        if (participantId.toString() !== userId && connectedUsers.has(participantId.toString())) {
                            io.to(connectedUsers.get(participantId.toString())).emit("user_status", {
                                userId,
                                status,
                                lastActive: user.lastActive,
                            });
                        }
                    });
                });
            }
        } catch (err) {
            console.error("Error updating user status:", err);
        }
    });

    // Send message handler
    socket.on("send_message", async (messageData) => {
        try {
            const { roomId, content, attachments = [] } = messageData;

            if (!socket.userId) {
                socket.emit("message_error", { message: "Користувач не авторизований" });
                return;
            }

            // Check if chat room exists and user is a participant
            const chatRoom = await ChatRoom.findById(roomId);
            if (!chatRoom) {
                socket.emit("message_error", { message: "Чат не знайдено" });
                return;
            }

            if (!chatRoom.participants.includes(socket.userId)) {
                socket.emit("message_error", { message: "Ви не є учасником чату" });
                return;
            }

            // Create new message
            const newMessage = await Message.create({
                chatRoom: roomId,
                sender: socket.userId,
                content,
                attachments,
                readBy: [{ user: socket.userId }],
            });

            // Update chat room's last message
            await ChatRoom.findByIdAndUpdate(roomId, { lastMessage: newMessage._id });

            // Get populated message
            const populatedMessage = await Message.findById(newMessage._id).populate(
                "sender",
                "first_name last_name username avatar"
            );

            // Get sender info for notifications
            const sender = await User.findById(socket.userId);

            // Send message to all participants in the room using socket.io room
            io.to(roomId).emit("new_message", populatedMessage);

            // Create notifications and send to users who aren't the sender
            const notificationPromises = chatRoom.participants
                .filter((participantId) => participantId.toString() !== socket.userId)
                .map(async (participantId) => {
                    try {
                        console.log(`Creating notification for user ${participantId} about message in room ${roomId}`);

                        // Create notification data
                        const notificationData = {
                            recipient: participantId,
                            sender: socket.userId,
                            chatRoom: roomId,
                            message: newMessage._id,
                            content: content.length > 50 ? content.substring(0, 50) + "..." : content,
                            isRead: false,
                        };

                        console.log("Notification data:", notificationData);

                        // Create notification in database
                        const notification = await Notification.create(notificationData);
                        console.log(`Created notification: ${notification._id}`);

                        // Populate notification data for the socket event
                        const populatedNotification = await Notification.findById(notification._id)
                            .populate("sender", "first_name last_name username avatar")
                            .populate("chatRoom", "name type");

                        console.log("Populated notification:", {
                            _id: populatedNotification._id,
                            chatRoom: populatedNotification.chatRoom
                                ? typeof populatedNotification.chatRoom === "object"
                                    ? populatedNotification.chatRoom._id
                                    : populatedNotification.chatRoom
                                : "missing",
                            sender: populatedNotification.sender
                                ? `${populatedNotification.sender.first_name} ${populatedNotification.sender.last_name}`
                                : "missing",
                        });

                        // Get socket ID of recipient if they're connected
                        const participantSocketId = connectedUsers.get(participantId.toString());
                        if (participantSocketId) {
                            // Emit notification event to the recipient
                            io.to(participantSocketId).emit("new_notification", populatedNotification);
                            console.log(`Sent notification to socket ${participantSocketId}`);

                            // Also send message notification (keeping existing functionality)
                            io.to(participantSocketId).emit("message_notification", {
                                message: populatedMessage,
                                chatRoom: {
                                    _id: chatRoom._id,
                                    name: chatRoom.name,
                                },
                                sender: {
                                    _id: sender._id,
                                    first_name: sender.first_name,
                                    last_name: sender.last_name,
                                },
                            });
                        } else {
                            console.log(`User ${participantId} not connected, notification will be shown later`);
                        }

                        return notification;
                    } catch (notificationError) {
                        console.error(`Error creating notification for user ${participantId}:`, notificationError);
                        return null;
                    }
                });

            // Wait for all notifications to be created
            await Promise.all(notificationPromises);

            socket.emit("message_sent", { success: true, message: populatedMessage });
        } catch (err) {
            console.error("Помилка надсилання повідомлення:", err);
            socket.emit("message_error", { message: "Помилка надсилання повідомлення" });
        }
    });

    // Mark message as read
    socket.on("mark_as_read", async (data) => {
        try {
            const { messageId } = data;

            if (!socket.userId) {
                socket.emit("read_error", { message: "Користувач не авторизований" });
                return;
            }

            const message = await Message.findById(messageId);
            if (!message) {
                socket.emit("read_error", { message: "Повідомлення не знайдено" });
                return;
            }

            // Check if user already read the message
            const userAlreadyRead = message.readBy.some((read) => read.user.toString() === socket.userId);

            if (!userAlreadyRead) {
                message.readBy.push({
                    user: socket.userId,
                    readAt: new Date(),
                });

                await message.save();

                // Get the chat room to notify participants
                const chatRoom = await ChatRoom.findById(message.chatRoom);
                if (chatRoom) {
                    // Notify other users that the message was read
                    chatRoom.participants.forEach((participantId) => {
                        if (
                            participantId.toString() !== socket.userId &&
                            connectedUsers.has(participantId.toString())
                        ) {
                            io.to(connectedUsers.get(participantId.toString())).emit("message_read", {
                                messageId,
                                userId: socket.userId,
                                readAt: new Date(),
                            });
                        }
                    });
                }
            }

            socket.emit("read_success", { messageId });
        } catch (err) {
            console.error("Помилка позначення повідомлення прочитаним:", err);
            socket.emit("read_error", { message: "Помилка позначення повідомлення прочитаним" });
        }
    });

    // Add member to chat room
    socket.on("add_chat_member", async (data) => {
        try {
            const { roomId, userId } = data;

            if (!socket.userId) {
                socket.emit("add_member_error", { message: "Користувач не авторизований" });
                return;
            }

            const chatRoom = await ChatRoom.findById(roomId);
            if (!chatRoom) {
                socket.emit("add_member_error", { message: "Чат не знайдено" });
                return;
            }

            // Check if the user making the request is in the room
            if (!chatRoom.participants.includes(socket.userId)) {
                socket.emit("add_member_error", { message: "Ви не є учасником чату" });
                return;
            }

            // Check if user is already in the room
            if (chatRoom.participants.includes(userId)) {
                socket.emit("add_member_error", { message: "Користувач вже є учасником чату" });
                return;
            }

            // Add user to room
            chatRoom.participants.push(userId);
            if (chatRoom.participants.length > 2) {
                chatRoom.type = "group";
            }

            await chatRoom.save();

            // Get updated room with populated participants
            const updatedRoom = await ChatRoom.findById(roomId)
                .populate("participants", "first_name last_name username avatar status lastActive")
                .populate("lastMessage");

            // Notify all participants about the new member
            chatRoom.participants.forEach((participantId) => {
                if (connectedUsers.has(participantId.toString())) {
                    io.to(connectedUsers.get(participantId.toString())).emit("room_updated", updatedRoom);
                }
            });

            // Add the new user to the room's socket room
            const newMemberSocketId = connectedUsers.get(userId);
            if (newMemberSocketId) {
                io.to(newMemberSocketId).emit("new_chat_room", updatedRoom);
            }

            socket.emit("add_member_success", { room: updatedRoom });
        } catch (err) {
            console.error("Помилка додавання користувача до чату:", err);
            socket.emit("add_member_error", { message: "Помилка додавання користувача до чату" });
        }
    });

    // Delete chat room
    socket.on("delete_chat_room", async (data) => {
        try {
            const { roomId } = data;

            if (!socket.userId) {
                socket.emit("delete_room_error", { message: "Користувач не авторизований" });
                return;
            }

            // Check if chat room exists
            const chatRoom = await ChatRoom.findById(roomId);
            if (!chatRoom) {
                socket.emit("delete_room_error", { message: "Чат не знайдено" });
                return;
            }

            // Check if user is a participant
            if (!chatRoom.participants.includes(socket.userId)) {
                socket.emit("delete_room_error", { message: "Ви не є учасником чату" });
                return;
            }

            // Delete all messages in the chat room
            await Message.deleteMany({ chatRoom: roomId });

            // Delete the chat room
            await ChatRoom.findByIdAndDelete(roomId);

            // Notify all participants about the deleted chat room
            chatRoom.participants.forEach((participantId) => {
                if (connectedUsers.has(participantId.toString())) {
                    io.to(connectedUsers.get(participantId.toString())).emit("chat_room_deleted", { roomId });
                }
            });

            socket.emit("delete_room_success", { roomId });
        } catch (err) {
            console.error("Помилка видалення чату:", err);
            socket.emit("delete_room_error", { message: "Помилка видалення чату" });
        }
    });

    // Disconnect handler
    socket.on("disconnect", async () => {
        try {
            const userId = socket.userId;
            if (userId) {
                // Remove from connectedUsers map
                connectedUsers.delete(userId);

                // Update user status to offline
                const user = await User.findById(userId);
                if (user) {
                    user.status = "offline";
                    user.lastActive = new Date();
                    await user.save();

                    // Broadcast offline status
                    const userChatRooms = await ChatRoom.find({ participants: userId });
                    userChatRooms.forEach((room) => {
                        room.participants.forEach((participantId) => {
                            if (participantId.toString() !== userId && connectedUsers.has(participantId.toString())) {
                                io.to(connectedUsers.get(participantId.toString())).emit("user_status", {
                                    userId,
                                    status: "offline",
                                    lastActive: user.lastActive,
                                });
                            }
                        });
                    });
                }
            }
            console.log("Клієнт відключений:", socket.id);
        } catch (err) {
            console.error("Error handling disconnect:", err);
        }
    });
});

// API endpoint to update user status (for handling page unload/beacon API)
app.post("/api/chat/status/:userId/:status", async (req, res) => {
    try {
        const { userId, status } = req.params;

        if (!["online", "away", "offline"].includes(status)) {
            return res.status(400).json({ success: false, message: "Invalid status value" });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        user.status = status;
        user.lastActive = new Date();
        await user.save();

        // Broadcast status update
        const userChatRooms = await ChatRoom.find({ participants: userId });
        userChatRooms.forEach((room) => {
            room.participants.forEach((participantId) => {
                if (participantId.toString() !== userId && connectedUsers.has(participantId.toString())) {
                    io.to(connectedUsers.get(participantId.toString())).emit("user_status", {
                        userId,
                        status,
                        lastActive: user.lastActive,
                    });
                }
            });
        });

        res.json({ success: true });
    } catch (err) {
        console.error("Error updating user status via API:", err);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
});

// Function to check if user is online based on PHP sessions
async function isUserOnline(userId) {
    try {
        // First get the MySQL student ID for this MongoDB user
        const user = await User.findById(userId);
        if (!user) {
            return false;
        }

        // Query to find student by name
        const [students] = await mysqlConnection.execute(
            "SELECT id FROM students WHERE first_name = ? AND last_name = ?",
            [user.first_name, user.last_name]
        );

        if (students.length === 0) {
            return false;
        }

        const studentId = students[0].id;

        // Check for active session in the database
        // PHP typically stores session data in the database or filesystem
        // Here we'll check if there's a recent login activity
        const [loginActivity] = await mysqlConnection
            .execute(
                "SELECT * FROM login_activity WHERE user_id = ? AND login_time > DATE_SUB(NOW(), INTERVAL 30 MINUTE) ORDER BY login_time DESC LIMIT 1",
                [studentId]
            )
            .catch(() => {
                // If the login_activity table doesn't exist, try an alternative approach
                return [[]];
            });

        // If we found recent login activity
        if (loginActivity && loginActivity.length > 0) {
            return true;
        }

        // Fallback: Check if the user has any recent activity in the system
        // This could be any recent interaction with the database
        const [recentActivity] = await mysqlConnection
            .execute("SELECT * FROM students WHERE id = ? AND last_updated > DATE_SUB(NOW(), INTERVAL 30 MINUTE)", [
                studentId,
            ])
            .catch(() => {
                // If the students table doesn't have a last_updated column
                return [[]];
            });

        if (recentActivity && recentActivity.length > 0) {
            return true;
        }

        // If we have socket connection for this user, they're definitely online
        if (connectedUsers.has(userId.toString())) {
            return true;
        }

        return false;
    } catch (err) {
        console.error("Error checking user online status:", err);
        return false;
    }
}

// Update user statuses from MySQL sessions periodically
async function updateUserStatusesFromSQL() {
    try {
        // Get all MongoDB users
        const users = await User.find({});

        for (const user of users) {
            const isOnline = await isUserOnline(user._id);

            // Only update if the status has changed
            if ((isOnline && user.status !== "online") || (!isOnline && user.status !== "offline")) {
                const newStatus = isOnline ? "online" : "offline";

                user.status = newStatus;
                if (newStatus === "offline") {
                    user.lastActive = new Date();
                }
                await user.save();

                // Broadcast status change to all relevant rooms
                const userChatRooms = await ChatRoom.find({ participants: user._id });
                userChatRooms.forEach((room) => {
                    room.participants.forEach((participantId) => {
                        if (
                            participantId.toString() !== user._id.toString() &&
                            connectedUsers.has(participantId.toString())
                        ) {
                            io.to(connectedUsers.get(participantId.toString())).emit("user_status", {
                                userId: user._id,
                                status: newStatus,
                                lastActive: user.lastActive,
                            });
                        }
                    });
                });
            }
        }
    } catch (err) {
        console.error("Error updating user statuses from SQL:", err);
    }
}

// Set up periodic status updates (every 1 minute)
setInterval(updateUserStatusesFromSQL, 60000);

// Connect to MySQL before starting the server
connectToMySQL().then(() => {
    // Запуск сервера
    const PORT = 3000;
    server.listen(PORT, () => {
        console.log(`Сервер запущено на порту ${PORT}`);
    });
});
