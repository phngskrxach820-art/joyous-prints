# Photobooth LAN Server

Local file delivery server for the Heng Photobooth. Runs on the **MacBook**
that powers the booth and serves photos/GIFs to customer phones over the
**same WiFi**.

## Setup (one time)

```bash
cd server
npm install
```

## Run

```bash
cd server
npm start
```

The server listens on port `3000` and prints all detected LAN URLs, e.g.:

```
📸 Photobooth LAN server running on port 3000
Local URLs: http://192.168.1.42:3000
Outputs folder: /.../outputs
```

Make sure macOS firewall allows incoming connections on port 3000:
**System Settings → Network → Firewall → Options → Allow `node`.**

## How the app uses it

1. The web app POSTs the rendered `photo.jpg` and `animated.gif` to:
   - `POST /upload/:sessionId/photo` (multipart `file`)
   - `POST /upload/:sessionId/gif`
2. The QR codes shown to the customer encode:
   - `http://<MAC_LAN_IP>:3000/d/<sessionId>/photo`
   - `http://<MAC_LAN_IP>:3000/d/<sessionId>/gif`
3. Customer's phone (on the same WiFi) scans → file downloads.

The app auto-detects the LAN base URL via WebRTC. You can override it from
**Admin → Local Server**.

## Cleanup

Sessions older than 24 hours are auto-deleted from `/outputs/` every hour.

## Files

```
server/
  index.js         # Express server
  package.json
  ../outputs/      # auto-created, holds {sessionId}/photo.jpg + animated.gif
```
