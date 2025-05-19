/**
 * Socket.IO configuration for Student Manager
 * This file centralizes the Socket.IO connection settings
 */

// Create a function to get a consistent socket connection
function getSocketConnection() {
    // Always use explicit server URL to avoid 404 errors
    return io("http://localhost:3000", {
        withCredentials: false,
        transports: ["websocket", "polling"],
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 20000,
    });
}

// Export the socket function
window.getSocketConnection = getSocketConnection;
