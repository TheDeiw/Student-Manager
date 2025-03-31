const init_or_not_init = true;

if (init_or_not_init) {
    if ("serviceWorker" in navigator) {
        window.addEventListener("load", () => {
            navigator.serviceWorker
                .register("/Student-Manager/service-worker.js")
                .then((registration) => {
                    console.log("Service Worker registered successfully:", registration);
                })
                .catch((error) => {
                    console.error("Service Worker registration failed:", error);
                });
        });
    }
}

localStorage.clear();
