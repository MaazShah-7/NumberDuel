# Number Duel - Mobile Game

This repository contains the complete source code for **Number Duel**, a real-time multiplayer mobile game where players guess each other's secret number.

## Architecture
- **Backend:** Node.js, Express, Socket.io
- **Frontend:** React Native (Expo)

## Prerequisites
To run this project, you need:
1. **Node.js** (v18 or higher recommended)
2. **npm** (comes with Node.js)
3. **Expo CLI** (Install globally via `npm install -g expo-cli`)
4. An **Expo Account** (if you want to build the APK via EAS in the cloud) or **Android Studio** (for local compilation).

---

## 1. Running the Backend Server

The backend manages the matchmaking queues, private lobbies, and game state validation.

```bash
cd backend
npm install
npm start
```
The server will start on `http://localhost:3000`.

---

## 2. Running the Frontend Mobile App

The frontend is built with React Native and Expo.

1. Open `frontend/src/services/socketService.js`.
2. Change `SOCKET_URL` from `'http://localhost:3000'` to your machine's local IP address (e.g., `'http://192.168.1.100:3000'`) so your mobile device can connect to the server.
3. Start the Expo development server:

```bash
cd frontend
npm install
npm start
```

You can test the app on your physical mobile device by downloading the **Expo Go** app from the App Store / Google Play and scanning the QR code in the terminal.

---

## 3. Compiling the Android APK (Via GitHub Actions)

You do **not** need an Expo account, EAS, or the Android SDK installed on your machine. We have provided a completely free, automated GitHub Actions workflow to build the APK for you in the cloud!

1. Push this entire repository (`h:\Game`) to a new repository on your GitHub account.
2. Once pushed, go to the **Actions** tab in your GitHub repository.
3. On the left sidebar, click on **Build Android APK**.
4. Click the **Run workflow** drop-down button on the right side, and click the green **Run workflow** button.
5. GitHub will now automatically provision a server, install Java/Android SDK, build the React Native code, and compile the `.apk`. This usually takes about 5-10 minutes.
6. When the workflow finishes with a green checkmark, click into the workflow run. Scroll down to the **Artifacts** section at the bottom.
7. Click on **number-duel-apk** to download your compiled, ready-to-install Android `.apk` file!
