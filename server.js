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

// Підключення до MongoDB
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
        console.error("Переконайтеся, що MongoDB встановлено і запущено на порту 27017");
        console.error("Детальна помилка:", err);
    });

const User = require("./chat-server/models/User");
const ChatRoom = require("./chat-server/models/ChatRoom");
const Message = require("./chat-server/models/Message");

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
            .populate("participants", "first_name last_name username avatar")
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
            "first_name last_name username avatar"
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

// Socket.io connection
const connectedUsers = new Map();

io.on("connection", (socket) => {
    console.log("Користувач підключився:", socket.id);

    // User authentication
    socket.on("authenticate", async (userData) => {
        try {
            const { userId } = userData;
            const user = await User.findById(userId);

            if (user) {
                // Store socket ID with user ID
                connectedUsers.set(userId, socket.id);
                socket.userId = userId;

                // Join all rooms where user is a participant
                const rooms = await ChatRoom.find({ participants: userId });
                rooms.forEach((room) => {
                    socket.join(room._id.toString());
                });

                // Update user status to online
                await User.findByIdAndUpdate(userId, { lastActive: new Date() });

                // Notify all rooms about user's online status
                rooms.forEach((room) => {
                    socket.to(room._id.toString()).emit("user_status", {
                        userId: userId,
                        status: "online",
                    });
                });

                socket.emit("authenticated", { success: true });
            } else {
                socket.emit("authenticated", { success: false, message: "Користувача не знайдено" });
            }
        } catch (err) {
            console.error("Помилка аутентифікації сокета:", err);
            socket.emit("authenticated", { success: false, message: "Помилка аутентифікації" });
        }
    });

    // Send message
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

            // Send message to all participants in the room
            io.to(roomId).emit("new_message", populatedMessage);

            // Send notification to users who are not in the room
            chatRoom.participants.forEach(async (participantId) => {
                const participantSocketId = connectedUsers.get(participantId.toString());

                if (participantSocketId && participantId.toString() !== socket.userId) {
                    const participant = await User.findById(participantId);

                    // Send notification to users who are not in the current room
                    io.to(participantSocketId).emit("message_notification", {
                        message: populatedMessage,
                        chatRoom: {
                            _id: chatRoom._id,
                            name: chatRoom.name,
                        },
                        sender: {
                            _id: populatedMessage.sender._id,
                            first_name: populatedMessage.sender.first_name,
                            last_name: populatedMessage.sender.last_name,
                        },
                    });
                }
            });

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

                // Notify other users that the message was read
                io.to(message.chatRoom.toString()).emit("message_read", {
                    messageId,
                    userId: socket.userId,
                    readAt: new Date(),
                });
            }

            socket.emit("read_success", { messageId });
        } catch (err) {
            console.error("Помилка позначення повідомлення прочитаним:", err);
            socket.emit("read_error", { message: "Помилка позначення повідомлення прочитаним" });
        }
    });

    // Add user to chat room
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
                .populate("participants", "first_name last_name username avatar")
                .populate("lastMessage");

            // Notify all participants about the new member
            io.to(roomId).emit("room_updated", updatedRoom);

            // Add the new user to the room
            const newMemberSocketId = connectedUsers.get(userId);
            if (newMemberSocketId) {
                const socket = io.sockets.sockets.get(newMemberSocketId);
                if (socket) {
                    socket.join(roomId);
                    socket.emit("new_chat_room", updatedRoom);
                }
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
                io.to(participantId.toString()).emit("chat_room_deleted", { roomId });
            });

            socket.emit("delete_room_success", { roomId });
        } catch (err) {
            console.error("Помилка видалення чату:", err);
            socket.emit("delete_room_error", { message: "Помилка видалення чату" });
        }
    });

    // Disconnect
    socket.on("disconnect", async () => {
        console.log("Користувач відключився:", socket.id);

        if (socket.userId) {
            // Update user's last active time
            await User.findByIdAndUpdate(socket.userId, { lastActive: new Date() });

            // Remove from connected users
            connectedUsers.delete(socket.userId);

            // Notify all rooms about user's offline status
            const rooms = await ChatRoom.find({ participants: socket.userId });
            rooms.forEach((room) => {
                io.to(room._id.toString()).emit("user_status", {
                    userId: socket.userId,
                    status: "offline",
                    lastActive: new Date(),
                });
            });
        }
    });
});

// Connect to MySQL before starting the server
connectToMySQL().then(() => {
    // Запуск сервера
    const PORT = 3000;
    server.listen(PORT, () => {
        console.log(`Сервер запущено на порту ${PORT}`);
    });
});
