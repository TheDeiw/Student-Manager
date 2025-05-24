/**
 * Socket.IO configuration for Student Manager
 * This file centralizes the Socket.IO connection settings
 */

// Global socket configuration
let sharedSocket = null;

// Function to get or create a socket connection
function getSocketConnection() {
    if (sharedSocket === null) {
        console.log("Creating new Socket.IO connection");

        try {
            sharedSocket = io("http://localhost:3000", {
                withCredentials: false,
                transports: ["websocket", "polling"],
            });

            // Add global error handling
            sharedSocket.on("connect_error", (err) => {
                console.error("Socket.IO connection error:", err.message);
                // Reset connection on error to allow reconnect attempt
                // sharedSocket = null;
            });

            sharedSocket.on("connect", () => {
                console.log("Socket.IO connected successfully with ID:", sharedSocket.id);
            });

            sharedSocket.on("disconnect", (reason) => {
                console.log("Socket.IO disconnected:", reason);
            });
        } catch (e) {
            console.error("Failed to create Socket.IO connection:", e);
            return null;
        }
    } else {
        console.log("Reusing existing Socket.IO connection");
    }

    return sharedSocket;
}

// Make function available globally
window.getSocketConnection = getSocketConnection;
