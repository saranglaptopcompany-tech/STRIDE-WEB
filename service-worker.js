// Makes the site installable, and now also handles incoming push notifications
// (the website equivalent of the bot's morning/evening Telegram message).

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  self.clients.claim();
});

// Fired when a push arrives from the server (see clients.py -> send_push, called from
// send_morning_missions.py / send_evening_prompt.py). The payload is whatever JSON
// object was passed as `data` when the push was sent.
self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { title: "Stride", body: event.data ? event.data.text() : "" };
  }

  const title = payload.title || "Stride";
  const options = {
    body: payload.body || "",
    tag: payload.tag || "stride-notification",
    data: { url: payload.url || "/" },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Fired when the user taps the notification — bring them to the app (or a specific
// task if the payload included a URL), focusing an existing tab if one's already open.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientsList) => {
      for (const client of clientsList) {
        if ("focus" in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});
