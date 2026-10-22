# Card Clash - Local Multiplayer Card Game

A modern, real-time multiplayer card game built with React, Vite, Tailwind CSS, Express, and Web Audio API. Supports up to 8 players over your local Wi-Fi network with real-time sync, sound effects, and QR code pairing.

---

## How to Run Locally in VS Code

### 1. Prerequisites
Make sure you have **Node.js** (version 18 or newer) installed on your computer.
- Download Node.js: [https://nodejs.org/](https://nodejs.org/)
- Verify in your terminal / command prompt:
  ```bash
  node -v
  npm -v
  ```

---

### 2. Open the Project in VS Code
1. Open **Visual Studio Code**.
2. Click **File** > **Open Folder...** (or `Cmd + O` on macOS / `Ctrl + K, Ctrl + O` on Windows).
3. Select this project root folder (containing `package.json`).

---

### 3. Open the Integrated Terminal in VS Code
- In VS Code, press **`Ctrl + \``** (Backtick) on Windows/Linux or **`Cmd + \``** on macOS.
- Alternatively, go to the top menu: **Terminal** > **New Terminal**.

---

### 4. Install Dependencies
Run the following command in the VS Code terminal to install all required packages:
```bash
npm install
```

---

### 5. Start the Development Server
Run:
```bash
npm run dev
```

You will see:
```text
Card Clash Full-Stack server running on port 3000
```

---

### 6. Play in Your Browser
- Open your browser and navigate to:
  ```text
  http://localhost:3000
  ```

---

### 7. Play with Other Devices on the Same Wi-Fi (Phones, Laptops, Tablets)
1. Ensure both your computer and your other devices are connected to the **same Wi-Fi network**.
2. On your host computer, start a room in the game.
3. The lobby screen will automatically display your computer's local Wi-Fi IP (for example `http://192.168.1.15:3000`) and a join QR code.
4. **Scan the QR Code** with your phone's camera or type the address into your phone's browser:
   ```text
   http://<YOUR_COMPUTER_LOCAL_IP>:3000/?room=ROOMCODE
   ```
5. You can open multiple tabs on your computer (e.g. Incognito windows) or connect up to 8 mobile devices on the same Wi-Fi.

---

## Helpful Tips & Troubleshooting

- **Firewall Prompt (Windows / macOS):**
  When you run `npm run dev` for the first time, your operating system may ask:
  *"Allow Node.js / tsx to communicate on private networks?"*
  👉 **Click Allow / Accept**. Otherwise, other devices on Wi-Fi won't be able to connect to port 3000.

- **Find Your Local IP Manually:**
  - **Windows (Command Prompt / PowerShell):** run `ipconfig` (look for *IPv4 Address* under your Wi-Fi adapter).
  - **macOS / Linux (Terminal):** run `ifconfig` or `ip a` (look for `inet 192.168.x.x` or `10.x.x.x`).

- **Port 3000 in Use:**
  If another program is using port 3000, specify a different port:
  - On macOS / Linux: `PORT=3005 npm run dev`
  - On Windows (PowerShell): `$env:PORT="3005"; npm run dev`
