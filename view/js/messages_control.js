document.addEventListener("DOMContentLoaded", function () {
    // Add CSS for error message
    const style = document.createElement("style");
    style.textContent = `
        .error-message {
            position: fixed;
            top: 20px;
            right: 20px;
            background-color: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
            border-radius: 5px;
            padding: 15px;
            z-index: 1000;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
            max-width: 300px;
        }
        .error-message p {
            margin: 0 0 10px 0;
            font-size: 14px;
        }
        .retry-button {
            background-color: #721c24;
            color: white;
            border: none;
            border-radius: 3px;
            padding: 5px 10px;
            cursor: pointer;
            font-size: 12px;
        }
        .retry-button:hover {
            background-color: #5a171d;
        }
    `;
    document.head.appendChild(style);

    // Initialize Socket.io connection
    const socket = io("http://localhost:3000");

    // DOM Elements
    const chatList = document.querySelector(".chat_list");
    const messagesArea = document.querySelector(".messages_area");
    const messageInput = document.querySelector(".message_input_field");
    const sendButton = document.querySelector(".send_button");
    const chatRoomTitle = document.querySelector(".chat_room_title");
    const membersIcons = document.querySelector(".member_icons");
    const addMemberButton = document.querySelector(".add_member");
    const newChatButton = document.querySelector(".new_chat_button");
    const newChatRoomButton = document.querySelector(".new_chat_room");
    const notificationBell = document.querySelector(".notification_bell");
    const notificationSign = document.querySelector(".notification_sign");
    const notificationMessages = document.querySelector(".notification__messages");
    const deleteChatButton = document.querySelector(".delete_chat_button") || createDeleteChatButton();

    // State variables
    let currentUser = null;
    let currentChatRoomId = null;
    let chatRooms = [];
    let unreadMessages = new Map(); // Map of chat room ID to count of unread messages

    // Check if user is logged in
    checkLoginStatus();

    // Listen for authentication events from the server
    socket.on("authenticated", (response) => {
        if (response.success) {
            console.log("Socket authenticated successfully");
            loadChatRooms();
        } else {
            console.error("Socket authentication failed:", response.message);
        }
    });

    // Open new chat form
    function openNewChatForm() {
        // Get the form container
        const formContainer = document.querySelector(".form__new_chat");
        if (!formContainer) return;

        // Fetch available students from the server
        fetch("http://localhost:3000/api/chat/students")
            .then((response) => response.json())
            .then((data) => {
                if (data.success) {
                    // Get the select element
                    const membersSelect = document.getElementById("members");
                    if (membersSelect) {
                        // Clear existing options
                        membersSelect.innerHTML = "";

                        // Add all students as options
                        data.students.forEach((student) => {
                            // Skip current user
                            if (student._id === currentUser._id) return;

                            const option = document.createElement("option");
                            option.value = student._id;
                            option.textContent = `${student.first_name} ${student.last_name}`;
                            membersSelect.appendChild(option);
                        });
                    }

                    // Show the form
                    formContainer.classList.add("active");

                    // Add close event listeners
                    const closeButton = formContainer.querySelector(".modal_control__close");
                    const cancelButton = formContainer.querySelector(".cancel-button");

                    if (closeButton) {
                        closeButton.addEventListener("click", CloseForm);
                    }

                    if (cancelButton) {
                        cancelButton.addEventListener("click", CloseForm);
                    }
                } else {
                    console.error("Error fetching students:", data.message);
                }
            })
            .catch((error) => {
                console.error("Error fetching students:", error);
            });
    }

    // Helper function to close the form
    function CloseForm() {
        const formContainer = document.querySelector(".form__new_chat");
        if (formContainer) {
            formContainer.classList.remove("active");
            // Clear form inputs
            const form = formContainer.querySelector("form");
            if (form) form.reset();
        }
    }

    // New message listener
    socket.on("new_message", (message) => {
        if (currentChatRoomId === message.chatRoom.toString()) {
            appendMessage(message);
            scrollToBottom();
            markMessageAsRead(message._id);
        }
    });

    // Message notification listener
    socket.on("message_notification", (data) => {
        // Check if notification is for a different chat room than the current one
        if (currentChatRoomId !== data.chatRoom._id.toString()) {
            // Add to unread messages count
            const count = unreadMessages.get(data.chatRoom._id) || 0;
            unreadMessages.set(data.chatRoom._id, count + 1);

            // Update chat room in the list
            updateChatRoomUnreadCount(data.chatRoom._id);

            // Show notification
            showNotification(data);

            // Play notification sound
            playNotificationSound();

            // Display notification badge
            notificationSign.classList.add("active");
        }
    });

    // New chat room listener
    socket.on("new_chat_room", (chatRoom) => {
        chatRooms.push(chatRoom);
        renderChatRooms();
    });

    // Chat room updated listener
    socket.on("room_updated", (updatedRoom) => {
        // Update the chat room in the list
        const index = chatRooms.findIndex((room) => room._id === updatedRoom._id);
        if (index !== -1) {
            chatRooms[index] = updatedRoom;
            renderChatRooms();

            // If this is the current room, update the member icons
            if (currentChatRoomId === updatedRoom._id) {
                renderChatRoomMembers(updatedRoom);
            }
        }
    });

    // User status listener
    socket.on("user_status", (data) => {
        updateUserStatus(data.userId, data.status, data.lastActive);
    });

    // Message read listener
    socket.on("message_read", (data) => {
        updateMessageReadStatus(data.messageId, data.userId, data.readAt);
    });

    // Chat room deleted listener
    socket.on("chat_room_deleted", (data) => {
        handleChatRoomDeleted(data.roomId);
    });

    // Event listeners
    if (sendButton) {
        sendButton.addEventListener("click", sendMessage);
    }

    if (messageInput) {
        messageInput.addEventListener("keypress", function (e) {
            if (e.key === "Enter") {
                sendMessage();
            }
        });
    }

    if (addMemberButton) {
        addMemberButton.addEventListener("click", openAddMemberModal);
    }

    if (newChatButton) {
        newChatButton.addEventListener("click", openNewChatForm);
    }

    if (newChatRoomButton) {
        newChatRoomButton.addEventListener("click", openNewChatForm);
    }

    if (notificationBell) {
        notificationBell.addEventListener("click", function (event) {
            event.preventDefault();
            toggleNotifications();
        });
    }

    if (deleteChatButton) {
        deleteChatButton.addEventListener("click", deleteChatRoom);
    }

    // Handle new chat form submission
    const newChatForm = document.querySelector(".form__new_chat form");
    if (newChatForm) {
        newChatForm.addEventListener("submit", createNewChatRoom);
    }

    // Functions

    // Authentication and initialization
    async function checkLoginStatus() {
        try {
            const response = await fetch("http://localhost/Student-Manager/api/auth/user");
            if (!response.ok) {
                throw new Error("Error fetching user data");
            }

            const data = await response.json();
            if (data.success && data.user) {
                currentUser = data.user;

                // Authenticate socket with user ID
                try {
                    await syncUserToMongoDB(currentUser);
                } catch (error) {
                    console.warn("MongoDB sync failed:", error.message);

                    // Create a fallback user object for socket authentication
                    const fallbackUser = {
                        _id: `temp_${Date.now()}`,
                        first_name: currentUser.first_name,
                        last_name: currentUser.last_name,
                    };

                    // Use fallback user
                    currentUser = fallbackUser;

                    // Show an error message to the user
                    const errorMessage = document.createElement("div");
                    errorMessage.className = "error-message";
                    errorMessage.innerHTML = `
                        <p>Could not connect to the chat server. Some features may be limited.</p>
                        <button class="retry-button">Retry Connection</button>
                    `;

                    document.body.appendChild(errorMessage);

                    // Add retry button functionality
                    const retryButton = errorMessage.querySelector(".retry-button");
                    if (retryButton) {
                        retryButton.addEventListener("click", async () => {
                            errorMessage.remove();
                            try {
                                await syncUserToMongoDB(currentUser);
                                // Refresh page on successful connection
                                window.location.reload();
                            } catch (error) {
                                console.error("Retry failed:", error);
                                // Show error message again
                                document.body.appendChild(errorMessage);
                            }
                        });
                    }
                }
            } else {
                // Redirect to login if not authenticated
                window.location.href = "index.html";
            }
        } catch (error) {
            console.error("Error checking login status:", error);
        }
    }

    async function syncUserToMongoDB(user) {
        try {
            // Log the user data being sent
            console.log("Syncing user data:", {
                first_name: user.first_name,
                last_name: user.last_name,
                birthday: user.birthday,
            });

            // Sync user to MongoDB
            const response = await fetch("http://localhost:3000/api/chat/auth", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    first_name: user.first_name,
                    last_name: user.last_name,
                    birthday: user.birthday,
                }),
            });

            // Log the response status and headers
            console.log("Server response status:", response.status);
            console.log("Server response headers:", Object.fromEntries(response.headers.entries()));

            // Get the full response text for error cases
            const responseText = await response.text();
            let data;
            try {
                data = JSON.parse(responseText);
            } catch (e) {
                console.error("Failed to parse server response:", responseText);
                throw new Error("Invalid server response format");
            }

            if (data.success) {
                // Store MongoDB user object
                currentUser = data.user;

                // Authenticate socket
                socket.emit("authenticate", { userId: currentUser._id });
            } else {
                console.error("Server returned error:", data.message);
                throw new Error(data.message || "Error syncing user");
            }
        } catch (error) {
            console.error("Detailed sync error:", error);
            // Try to reconnect socket in case of disconnection
            if (socket.disconnected) {
                console.log("Attempting to reconnect socket...");
                socket.connect();
            }
            throw error;
        }
    }

    // Load chat rooms for the current user
    async function loadChatRooms() {
        try {
            const response = await fetch(`http://localhost:3000/api/chat/rooms/${currentUser._id}`);
            if (!response.ok) {
                throw new Error("Error fetching chat rooms");
            }

            const data = await response.json();
            if (data.success) {
                chatRooms = data.chatRooms;
                renderChatRooms();

                // If there are chat rooms, open the first one
                if (chatRooms.length > 0 && !currentChatRoomId) {
                    openChatRoom(chatRooms[0]._id);
                }
            }
        } catch (error) {
            console.error("Error loading chat rooms:", error);
        }
    }

    // Render chat rooms list
    function renderChatRooms() {
        if (!chatList) return;

        // Clear existing chat rooms except the "New chat room" button
        const newChatRoomButton = chatList.querySelector(".new_chat_room");
        chatList.innerHTML = "";

        if (newChatRoomButton) {
            chatList.appendChild(newChatRoomButton);
        }

        // Add chat rooms
        chatRooms.forEach((room) => {
            const chatItem = document.createElement("div");
            chatItem.className = "chat_item";

            if (currentChatRoomId === room._id) {
                chatItem.classList.add("active");
            }

            // Check if there are unread messages
            const unreadCount = unreadMessages.get(room._id) || 0;
            if (unreadCount > 0) {
                chatItem.classList.add("unread");
            }

            // Get the other participant for private chats, or the group name
            let chatName = room.name;
            let chatIcon = document.createElement("div");
            chatIcon.className = "chat_icon";

            // Add unread count badge if needed
            if (unreadCount > 0) {
                const badge = document.createElement("span");
                badge.className = "unread_badge";
                badge.textContent = unreadCount;
                chatItem.appendChild(badge);
            }

            chatItem.appendChild(chatIcon);

            const nameSpan = document.createElement("span");
            nameSpan.className = "chat_name";
            nameSpan.textContent = chatName;
            chatItem.appendChild(nameSpan);

            // Add click event
            chatItem.addEventListener("click", () => openChatRoom(room._id));

            chatList.appendChild(chatItem);
        });
    }

    // Open a chat room
    async function openChatRoom(roomId) {
        // Don't reload if it's the same room
        if (currentChatRoomId === roomId) return;

        currentChatRoomId = roomId;

        // Update active state in chat list
        const chatItems = document.querySelectorAll(".chat_item");
        chatItems.forEach((item) => {
            item.classList.remove("active");
            if (item.querySelector(".chat_name").textContent === getChatRoomById(roomId).name) {
                item.classList.add("active");
                item.classList.remove("unread"); // Remove unread highlight

                // Clear unread count
                unreadMessages.delete(roomId);
                const badge = item.querySelector(".unread_badge");
                if (badge) {
                    badge.remove();
                }
            }
        });

        // Load messages
        await loadMessages(roomId);

        // Update chat room header
        updateChatRoomHeader(roomId);
    }

    // Load messages for a chat room
    async function loadMessages(roomId) {
        try {
            const response = await fetch(`http://localhost:3000/api/chat/messages/${roomId}`);
            if (!response.ok) {
                throw new Error("Error fetching messages");
            }

            const data = await response.json();
            if (data.success) {
                renderMessages(data.messages);
                scrollToBottom();

                // Mark unread messages as read
                data.messages.forEach((message) => {
                    if (!message.readBy.some((read) => read.user === currentUser._id)) {
                        markMessageAsRead(message._id);
                    }
                });
            }
        } catch (error) {
            console.error("Error loading messages:", error);
        }
    }

    // Render messages in the chat
    function renderMessages(messages) {
        if (!messagesArea) return;

        messagesArea.innerHTML = "";

        messages.forEach((message) => {
            appendMessage(message);
        });
    }

    // Append a message to the chat
    function appendMessage(message) {
        if (!messagesArea) return;

        const messageItem = document.createElement("div");
        messageItem.className = "message_item";
        messageItem.dataset.id = message._id;

        // Check if this is the current user's message
        const isSelf = message.sender._id === currentUser._id;
        if (isSelf) {
            messageItem.classList.add("self");
        }

        const messageIcon = document.createElement("div");
        messageIcon.className = "message_icon";

        const messageContent = document.createElement("div");
        messageContent.className = "message_content";

        const messageAuthor = document.createElement("h4");
        messageAuthor.className = "message_author";
        messageAuthor.textContent = isSelf ? "Me" : `${message.sender.first_name} ${message.sender.last_name}`;

        const messageText = document.createElement("p");
        messageText.className = "message_text";
        messageText.textContent = message.content;

        // Add read status indicator for own messages
        if (isSelf) {
            const readStatus = document.createElement("span");
            readStatus.className = "read_status";

            // Check if anyone else has read the message
            const otherReaders = message.readBy.filter((read) => read.user !== currentUser._id);
            if (otherReaders.length > 0) {
                readStatus.classList.add("read");
                readStatus.title = `Read by ${otherReaders.length} member(s)`;
            } else {
                readStatus.title = "Delivered";
            }

            messageContent.appendChild(readStatus);
        }

        messageContent.appendChild(messageAuthor);
        messageContent.appendChild(messageText);

        messageItem.appendChild(messageIcon);
        messageItem.appendChild(messageContent);

        messagesArea.appendChild(messageItem);
    }

    // Update chat room header
    function updateChatRoomHeader(roomId) {
        const room = getChatRoomById(roomId);
        if (!room) return;

        // Update room title
        if (chatRoomTitle) {
            chatRoomTitle.textContent = room.name;
        }

        // Update member icons
        renderChatRoomMembers(room);
    }

    // Render chat room members
    function renderChatRoomMembers(room) {
        if (!membersIcons) return;

        // Clear existing members except the add button
        const addButton = membersIcons.querySelector(".add_member");
        membersIcons.innerHTML = "";

        // Add member icons
        room.participants.slice(0, 3).forEach((participant) => {
            const memberIcon = document.createElement("div");
            memberIcon.className = "member_icon";

            // Highlight current user
            if (participant._id === currentUser._id) {
                memberIcon.classList.add("current_user");
            }

            // Add tooltip with name
            memberIcon.title = `${participant.first_name} ${participant.last_name}`;

            membersIcons.appendChild(memberIcon);
        });

        // Add the "+" button back
        if (addButton) {
            membersIcons.appendChild(addButton);
        }
    }

    // Send a message
    function sendMessage() {
        if (!messageInput || !currentChatRoomId) return;

        const content = messageInput.value.trim();
        if (content === "") return;

        socket.emit("send_message", {
            roomId: currentChatRoomId,
            content: content,
        });

        // Clear input
        messageInput.value = "";
    }

    // Mark a message as read
    function markMessageAsRead(messageId) {
        socket.emit("mark_as_read", { messageId });
    }

    // Update message read status
    function updateMessageReadStatus(messageId, userId, readAt) {
        const messageElement = document.querySelector(`.message_item[data-id="${messageId}"]`);
        if (!messageElement) return;

        const readStatus = messageElement.querySelector(".read_status");
        if (readStatus) {
            readStatus.classList.add("read");

            // Update tooltip
            const room = getChatRoomById(currentChatRoomId);
            if (room) {
                const reader = room.participants.find((p) => p._id === userId);
                if (reader) {
                    const existingReaders = readStatus.title.includes("Read by")
                        ? parseInt(readStatus.title.match(/\d+/)[0])
                        : 0;
                    readStatus.title = `Read by ${existingReaders + 1} member(s)`;
                }
            }
        }
    }

    // Update user status
    function updateUserStatus(userId, status, lastActive) {
        // Find all messages from this user
        const userMessages = document.querySelectorAll(`.message_item:not(.self) .message_author`);

        userMessages.forEach((messageAuthor) => {
            const messageItem = messageAuthor.closest(".message_item");

            // Check if this message is from the user whose status changed
            const room = getChatRoomById(currentChatRoomId);
            if (room) {
                room.participants.forEach((participant) => {
                    if (participant._id === userId) {
                        const statusIndicator =
                            messageItem.querySelector(".user_status") || document.createElement("span");
                        statusIndicator.className = `user_status ${status}`;

                        if (status === "offline" && lastActive) {
                            statusIndicator.title = `Last seen: ${new Date(lastActive).toLocaleString()}`;
                        } else {
                            statusIndicator.title = status.charAt(0).toUpperCase() + status.slice(1);
                        }

                        if (!messageItem.querySelector(".user_status")) {
                            messageItem.appendChild(statusIndicator);
                        }
                    }
                });
            }
        });

        // Update in chat list
        updateChatListUserStatus(userId, status);
    }

    // Update chat list user status
    function updateChatListUserStatus(userId, status) {
        // For each chat room that contains this user
        chatRooms.forEach((room) => {
            if (room.participants.some((p) => p._id === userId)) {
                const chatItem = Array.from(document.querySelectorAll(".chat_item")).find(
                    (item) => item.querySelector(".chat_name").textContent === room.name
                );

                if (chatItem) {
                    // Update status indicator
                    let statusDot = chatItem.querySelector(".status_indicator");
                    if (!statusDot) {
                        statusDot = document.createElement("span");
                        statusDot.className = "status_indicator";
                        chatItem.querySelector(".chat_icon").appendChild(statusDot);
                    }

                    statusDot.className = `status_indicator ${status}`;
                }
            }
        });
    }

    // Open add member modal
    function openAddMemberModal() {
        if (!currentChatRoomId) return;

        // Fetch all students who are not already in the room
        fetchAvailableStudents().then((students) => {
            // Create a modal for adding members
            const modal = createAddMemberModal(students);
            document.body.appendChild(modal);
            modal.classList.add("active");
        });
    }

    // Create modal for adding members
    function createAddMemberModal(students) {
        const room = getChatRoomById(currentChatRoomId);
        const currentParticipantIds = room.participants.map((p) => p._id);

        const modal = document.createElement("div");
        modal.className = "form__add_member modal_window_style";

        modal.innerHTML = `
            <div class="modal_window_container">
                <div class="modal_windows__control">
                    <h2 class="modal_control__heading">Add Members</h2>
                    <button class="modal_control__close">
                        <img class="modal_control__close_icon" src="assets/img/modal-windows/close.svg" alt="Close">
                    </button>
                </div>
                <form class="modal_window__form">
                    <div class="form__student_group">
                        <label for="new_members" class="form__student_label">Select Members</label>
                        <select multiple required id="new_members" class="form__student_input">
                            ${students
                                .filter((student) => !currentParticipantIds.includes(student._id))
                                .map(
                                    (student) => `
                                    <option value="${student._id}">${student.first_name} ${student.last_name}</option>
                                `
                                )
                                .join("")}
                        </select>
                        <div class="form__error_text"></div>
                    </div>
                    <div class="form__student_buttons">
                        <button type="button" class="form__student_button cancel-button">Cancel</button>
                        <button type="submit" class="form__student_button interact_student_button">Add</button>
                    </div>
                </form>
            </div>
        `;

        // Add event listeners
        modal.querySelector(".modal_control__close").addEventListener("click", () => {
            modal.remove();
        });

        modal.querySelector(".cancel-button").addEventListener("click", () => {
            modal.remove();
        });

        modal.querySelector("form").addEventListener("submit", (event) => {
            event.preventDefault();

            const selectedMembers = Array.from(modal.querySelector("#new_members").selectedOptions).map(
                (option) => option.value
            );

            if (selectedMembers.length > 0) {
                addMembersToRoom(currentChatRoomId, selectedMembers);
                modal.remove();
            }
        });

        return modal;
    }

    // Fetch available students for adding to chats
    async function fetchAvailableStudents() {
        try {
            const response = await fetch("http://localhost:3000/api/chat/students");
            if (!response.ok) {
                throw new Error("Error fetching students");
            }

            const data = await response.json();
            return data.success ? data.students : [];
        } catch (error) {
            console.error("Error fetching available students:", error);
            return [];
        }
    }

    // Add members to a chat room
    function addMembersToRoom(roomId, memberIds) {
        memberIds.forEach((memberId) => {
            socket.emit("add_chat_member", { roomId, userId: memberId });
        });
    }

    // Create a new chat room
    async function createNewChatRoom(event) {
        event.preventDefault();

        const nameInput = document.getElementById("chat_name");
        const membersSelect = document.getElementById("members");

        if (!nameInput || !membersSelect) return;

        const name = nameInput.value.trim();
        const selectedMembers = Array.from(membersSelect.selectedOptions).map((option) => option.value);

        if (name === "" || selectedMembers.length === 0) {
            // Show error
            const errorElement = document.querySelector(".form__new_chat .form__error_text");
            if (errorElement) {
                errorElement.textContent = "Please fill in all fields";
            }
            return;
        }

        try {
            // Create participant IDs array - selected members plus current user
            const participantIds = [...selectedMembers];

            // Always include current user
            if (!participantIds.includes(currentUser._id)) {
                participantIds.push(currentUser._id);
            }

            // Create chat room
            const response = await fetch("http://localhost:3000/api/chat/rooms", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name,
                    participants: participantIds,
                    createdBy: currentUser._id,
                }),
            });

            const data = await response.json();
            if (data.success) {
                // Add new chat room to the list
                chatRooms.push(data.chatRoom);
                renderChatRooms();

                // Open the new chat room
                openChatRoom(data.chatRoom._id);

                // Close the form
                CloseForm();
            } else {
                throw new Error(data.message || "Error creating chat room");
            }
        } catch (error) {
            console.error("Error creating chat room:", error);

            // Show error
            const errorElement = document.querySelector(".form__new_chat .form__error_text");
            if (errorElement) {
                errorElement.textContent = error.message || "Error creating chat room";
            }
        }
    }

    // Show notification
    function showNotification(data) {
        if (!notificationMessages) return;

        // Create notification
        const notification = document.createElement("div");
        notification.className = "notification__massage";
        notification.dataset.roomId = data.chatRoom._id;

        notification.innerHTML = `
            <div class="message__icon"></div>
            <div class="message__text">
                <h3 class="message_text__header">${data.sender.first_name} ${data.sender.last_name}</h3>
                <p class="message_text__text">${data.message.content}</p>
            </div>
        `;

        // Add click event to open the chat room
        notification.addEventListener("click", () => {
            openChatRoom(data.chatRoom._id);
            hideNotifications();
        });

        // Add to notifications container
        notificationMessages.prepend(notification);

        // Remove oldest notification if there are more than 3
        const notifications = notificationMessages.querySelectorAll(".notification__massage");
        if (notifications.length > 3) {
            notifications[notifications.length - 1].remove();
        }
    }

    // Play notification sound
    function playNotificationSound() {
        const audio = new Audio("assets/sounds/notification.mp3");
        audio.play().catch((err) => console.log("Error playing notification sound:", err));
    }

    // Toggle notifications panel
    function toggleNotifications() {
        if (notificationMessages) {
            notificationMessages.classList.toggle("active");

            // If opening notifications, clear notification badge
            if (notificationMessages.classList.contains("active")) {
                notificationSign.classList.remove("active");
            }
        }
    }

    // Hide notifications panel
    function hideNotifications() {
        if (notificationMessages) {
            notificationMessages.classList.remove("active");
        }
    }

    // Update chat room unread count in UI
    function updateChatRoomUnreadCount(roomId) {
        const unreadCount = unreadMessages.get(roomId) || 0;

        // Find chat item
        const chatItems = document.querySelectorAll(".chat_item");
        chatItems.forEach((item) => {
            if (item.querySelector(".chat_name").textContent === getChatRoomById(roomId).name) {
                // Add unread class
                item.classList.add("unread");

                // Update or add badge
                let badge = item.querySelector(".unread_badge");
                if (!badge) {
                    badge = document.createElement("span");
                    badge.className = "unread_badge";
                    item.appendChild(badge);
                }

                badge.textContent = unreadCount;
            }
        });
    }

    // Helper to get chat room by ID
    function getChatRoomById(roomId) {
        return chatRooms.find((room) => room._id === roomId);
    }

    // Scroll chat to bottom
    function scrollToBottom() {
        if (messagesArea) {
            messagesArea.scrollTop = messagesArea.scrollHeight;
        }
    }

    // Handle chat room deletion
    function handleChatRoomDeleted(roomId) {
        // Find and remove the chat room from the list
        const index = chatRooms.findIndex((room) => room._id === roomId);
        if (index !== -1) {
            chatRooms.splice(index, 1);
            renderChatRooms();

            // If this was the current chat room, clear the messages area
            if (currentChatRoomId === roomId) {
                currentChatRoomId = null;
                messagesArea.innerHTML = "";
                chatRoomTitle.textContent = "Виберіть чат";
                membersIcons.innerHTML = "";

                // If there are other chat rooms, open the first one
                if (chatRooms.length > 0) {
                    openChatRoom(chatRooms[0]._id);
                }
            }

            // Show notification
            showNotification({
                chatRoom: { _id: roomId, name: "Система" },
                sender: { first_name: "Система", last_name: "" },
                message: { content: "Чат було видалено" },
            });
        }
    }

    // Delete current chat room
    function deleteChatRoom() {
        if (!currentChatRoomId || !currentUser) return;

        if (confirm("Ви впевнені, що хочете видалити цей чат?")) {
            console.log("Deleting chat room:", currentChatRoomId);

            // Try both methods - API and socket
            // 1. API method
            fetch(`http://localhost:3000/api/chat/rooms/${currentChatRoomId}?userId=${currentUser._id}`, {
                method: "DELETE",
            })
                .then((response) => response.json())
                .then((data) => {
                    if (data.success) {
                        console.log("Chat room deleted via API");
                        handleChatRoomDeleted(currentChatRoomId);
                    }
                })
                .catch((error) => {
                    console.error("Error deleting chat room via API:", error);

                    // 2. Socket method as fallback
                    socket.emit("delete_chat_room", { roomId: currentChatRoomId });
                });
        }
    }

    // Create delete chat button if it doesn't exist
    function createDeleteChatButton() {
        const button = document.createElement("button");
        button.className = "delete_chat_button";
        button.innerHTML = '<img src="assets/img/delete.svg" alt="Delete Chat" />';
        button.title = "Видалити чат";

        // Add to the chat room header
        const chatRoomHeader = document.querySelector(".chat_room_header");
        if (chatRoomHeader) {
            chatRoomHeader.appendChild(button);
        }

        return button;
    }
});
