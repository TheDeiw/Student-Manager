// Notification system for Student Manager
let socket;
let currentUserId;
let unreadNotifications = [];
let notificationBell = document.querySelector(".notification_bell");
let notificationSign = document.querySelector(".notification_sign");
let notificationContainer = document.querySelector(".notification__messages");
let notificationInitialized = false;

// API base URL - try local server first, fallback to relative path
const API_BASE_URL = window.location.hostname === "localhost" ? "http://localhost:3000" : "";

// Sound throttling to prevent audio spam
let lastSoundPlayedTime = 0;
const SOUND_THROTTLE_MS = 3000; // Only play sound every 3 seconds max

// Fix for notification sign showing as active by default in some HTML files
document.addEventListener("DOMContentLoaded", () => {
    const sign = document.querySelector(".notification_sign.active");
    if (sign && !unreadNotifications.length) {
        sign.classList.remove("active");
    }
});

// Initialize the notification system
function initNotifications(userId) {
    if (notificationInitialized) return;

    // Re-query DOM elements in case they weren't available when the script loaded
    notificationBell = notificationBell || document.querySelector(".notification_bell");
    notificationSign = notificationSign || document.querySelector(".notification_sign");
    notificationContainer = notificationContainer || document.querySelector(".notification__messages");

    if (!notificationBell || !notificationSign || !notificationContainer) {
        console.error("Notification elements not found in DOM");
        return;
    }

    currentUserId = userId;
    notificationInitialized = true;

    // Connect to socket if not already connected
    if (!socket) {
        try {
            // Use the shared socket configuration
            socket = window.getSocketConnection
                ? window.getSocketConnection()
                : io("http://localhost:3000", {
                      withCredentials: false,
                      transports: ["websocket", "polling"],
                  });

            // Add error handling for connection issues
            socket.on("connect_error", (err) => {
                console.error("Socket connection error:", err);
                // Try to reconnect after a delay
                setTimeout(() => {
                    console.log("Attempting to reconnect socket...");
                    socket.connect();
                }, 5000);
            });

            // Listen for authentication success
            socket.on("authenticated", (data) => {
                if (data.success) {
                    console.log("Socket authenticated successfully");
                    // Load existing notifications
                    loadNotifications();

                    // Set up listeners for new notifications
                    setupNotificationListeners();
                }
            });

            // Authenticate with socket
            socket.emit("authenticate", { userId });
        } catch (err) {
            console.error("Failed to initialize socket:", err);
        }
    } else {
        // Already connected, just load notifications
        loadNotifications();
    }

    // Setup notification UI events
    setupNotificationBellEvents();
}

// Load notifications from the server
function loadNotifications() {
    console.log("Loading notifications for user:", currentUserId);

    fetch(`${API_BASE_URL}/api/notifications/${currentUserId}`)
        .then((response) => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then((data) => {
            if (data.success) {
                console.log("Loaded notifications:", data.notifications.length);
                unreadNotifications = data.notifications;
                updateNotificationDisplay();
            } else {
                console.error("Failed to load notifications:", data.message || "Unknown error");
            }
        })
        .catch((error) => {
            console.error("Error loading notifications:", error);
            // Show a user-friendly error in the notification area
            if (notificationContainer) {
                const errorMsg = document.createElement("div");
                errorMsg.className = "notification-error";
                errorMsg.textContent = "Помилка завантаження сповіщень";
                notificationContainer.appendChild(errorMsg);
            }
        });
}

// Set up listeners for new notifications
function setupNotificationListeners() {
    // Listen for new notifications
    socket.on("new_notification", (notification) => {
        // Add to unread notifications
        unreadNotifications.unshift(notification);
        updateNotificationDisplay();

        // Make notification bell blink
        makeNotificationBlink();
    });
}

// Update notification display
function updateNotificationDisplay() {
    // Update notification dot visibility
    if (unreadNotifications.length > 0) {
        notificationSign.classList.add("active");
        // If this is a new notification (not initial load), animate the bell
        if (socket && socket.connected) {
            makeNotificationBlink();
        }
    } else {
        notificationSign.classList.remove("active");
    }
    // Clear notification container
    notificationContainer.innerHTML = "";

    // Add notifications to container
    if (unreadNotifications.length === 0) {
        const emptyMessage = document.createElement("div");
        emptyMessage.className = "empty-notification";
        emptyMessage.textContent = "Немає нових сповіщень";
        notificationContainer.appendChild(emptyMessage);
    } else {
        // Add max 5 notifications to avoid overloading the UI
        const notificationsToShow = unreadNotifications.slice(0, 5);

        notificationsToShow.forEach((notification) => {
            const notificationElement = createNotificationElement(notification);
            notificationContainer.appendChild(notificationElement);
        });

        // If there are more notifications, add a "show all" link
        if (unreadNotifications.length > 5) {
            const showAllElement = document.createElement("div");
            showAllElement.className = "show-all-notifications";
            showAllElement.textContent = `Показати всі ${unreadNotifications.length} сповіщення`;
            showAllElement.addEventListener("click", () => {
                window.location.href = "messages.html";
            });
            notificationContainer.appendChild(showAllElement);
        }
    }

    // Add mark all as read button if it doesn't exist yet
    if (notificationContainer) {
        // Remove existing button if any
        const existingButton = notificationContainer.querySelector(".mark-all-read");
        if (existingButton) {
            existingButton.remove();
        }

        // Create new button
        const markAllReadButton = document.createElement("div");
        markAllReadButton.className = "mark-all-read";
        markAllReadButton.textContent = "Позначити всі як прочитані";

        // Add event listener with explicit binding
        markAllReadButton.addEventListener("click", function (e) {
            e.stopPropagation();
            e.preventDefault();
            console.log("Mark all as read button clicked");
            markAllNotificationsAsRead(e);
        });

        // Insert at the beginning of the notification container
        notificationContainer.insertBefore(markAllReadButton, notificationContainer.firstChild);
    }
}

// Create a notification element
function createNotificationElement(notification) {
    const notificationDiv = document.createElement("div");
    notificationDiv.className = "notification__massage";
    notificationDiv.dataset.id = notification._id;

    // Create icon div
    const iconDiv = document.createElement("div");
    iconDiv.className = "message__icon";
    // if (notification.sender && notification.sender.avatar) {
    //     iconDiv.style.backgroundImage = `url(${
    //         notification.sender.avatar !== "default-avatar.png"
    //             ? notification.sender.avatar
    //             : "assets/img/default-avatar.png"
    //     })`;
    // }

    // Create text div
    const textDiv = document.createElement("div");
    textDiv.className = "message__text";

    // Create header
    const header = document.createElement("h3");
    header.className = "message_text__header";
    header.textContent = notification.sender
        ? `${notification.sender.first_name} ${notification.sender.last_name}`
        : "Користувач";

    // Create message text
    const messageText = document.createElement("p");
    messageText.className = "message_text__text";
    messageText.textContent = notification.content;

    // Assemble elements
    textDiv.appendChild(header);
    textDiv.appendChild(messageText);
    notificationDiv.appendChild(iconDiv);
    notificationDiv.appendChild(textDiv);

    // Add click event
    notificationDiv.addEventListener("click", () => {
        markNotificationAsRead(notification._id);
        navigateToChatRoom(notification.chatRoom._id);
    });

    return notificationDiv;
}

// Mark notification as read
function markNotificationAsRead(notificationId) {
    console.log("Marking notification as read:", notificationId);
    fetch(`${API_BASE_URL}/api/notifications/${notificationId}/read`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
        },
    })
        .then((response) => response.json())
        .then((data) => {
            if (data.success) {
                // Remove from unread list
                unreadNotifications = unreadNotifications.filter((n) => n._id !== notificationId);
                updateNotificationDisplay();
            }
        })
        .catch((error) => console.error("Error marking notification as read:", error));
}

// Mark all notifications as read
function markAllNotificationsAsRead(e) {
    // Prevent event bubbling and default behavior
    if (e) {
        e.stopPropagation();
        e.preventDefault();
    }

    if (unreadNotifications.length === 0) return;

    console.log("Marking all notifications as read");

    fetch(`${API_BASE_URL}/api/notifications/${currentUserId}/read-all`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
        },
    })
        .then((response) => response.json())
        .then((data) => {
            if (data.success) {
                console.log("All notifications marked as read");
                unreadNotifications = [];
                updateNotificationDisplay();
            }
        })
        .catch((error) => console.error("Error marking all notifications as read:", error));
}

// Navigate to chat room
function navigateToChatRoom(chatRoomId) {
    window.location.href = `messages.html?room=${chatRoomId}`;
}

// Make the notification bell blink and shake
function makeNotificationBlink() {
    if (!notificationBell || !notificationSign) return;

    // Add blink to the notification dot
    notificationSign.classList.add("blink");

    // Force reflow to restart animation if needed
    void notificationBell.offsetWidth;

    // Add shake animation to the bell - using both our custom and existing animations
    notificationBell.classList.add("active");
    notificationBell.classList.add("shake");

    // Play notification sound
    playNotificationSound();

    // Remove animation classes after animation completes
    setTimeout(() => {
        notificationSign.classList.remove("blink");
        notificationBell.classList.remove("active");
        notificationBell.classList.remove("shake");
    }, 3000);
}

// Play notification sound
function playNotificationSound() {
    const now = Date.now();
    // Don't play sound if less than SOUND_THROTTLE_MS has passed since last sound
    if (now - lastSoundPlayedTime < SOUND_THROTTLE_MS) {
        return;
    }

    try {
        const audio = new Audio("assets/sounds/notification.mp3");
        audio.volume = 0.5;
        audio.play().catch((err) => {
            console.warn("Could not play notification sound:", err);
        });

        lastSoundPlayedTime = now;
    } catch (err) {
        console.warn("Error playing notification sound:", err);
    }
}

// Set up notification bell hover events
function setupNotificationBellEvents() {
    const notificationBellContainer = document.querySelector(".account_control__notification");

    if (notificationBellContainer) {
        // Show notifications on hover
        notificationBellContainer.addEventListener("mouseenter", () => {
            if (notificationContainer) {
                notificationContainer.classList.add("show");
            }
        });

        // Hide notifications when mouse leaves
        notificationBellContainer.addEventListener("mouseleave", () => {
            if (notificationContainer) {
                notificationContainer.classList.remove("show");
            }
        });

        // Navigate to messages page on bell click
        const bellLink = notificationBellContainer.querySelector("a");
        if (bellLink) {
            bellLink.addEventListener("click", (e) => {
                // Allow normal navigation to messages.html
                // Clear notification indicator when navigating to messages
                if (notificationSign) {
                    notificationSign.classList.remove("active");
                }
            });
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
    // Always set up notification bell events
    setupNotificationBellEvents();

    // Initialize with delay to ensure all elements are loaded
    setTimeout(() => {
        // Check if user is logged in (from auth.js)
        if (typeof isLoggedIn === "function" && isLoggedIn()) {
            const userData = getUserData();
            if (userData && userData._id) {
                initNotifications(userData._id);
            }
        }
    }, 500);
});

// Check for DOM changes in case elements are added dynamically
const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
        if (mutation.type === "childList") {
            const notificationElements = document.querySelector(".notification_bell");
            if (notificationElements && !notificationBell) {
                setupNotificationBellEvents();

                // If user is logged in, initialize notifications
                if (typeof isLoggedIn === "function" && isLoggedIn()) {
                    const userData = getUserData();
                    if (userData && userData._id) {
                        initNotifications(userData._id);
                    }
                }
            }
        }
    }
});

// Start observing the document with the configured parameters
observer.observe(document.body, { childList: true, subtree: true });
