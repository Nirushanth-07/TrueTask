# ⚡ TrueTask | Task, Course & Assignment Tracker

TrueTask is a premium, single-panel academic workspace dashboard that combines an interactive **Eisenhower Decision Matrix**, course management, category tracking, dynamic timelines, and a completed archives drawer. 

Built using standard modern web APIs (HTML5, Vanilla CSS, and modular ES6 JavaScript), TrueTask has **zero external build dependencies**, runs completely offline, and can be installed as a native Progressive Web Application (PWA) on desktop or mobile.

---

## ✨ Key Features

### 📅 Interactive Eisenhower Decision Matrix
* **Priority Quadrants:** Active tasks are color-coded in a clean 2x2 grid representing:
  * **Q1: Important & Urgent** (Rose gradient / Crimson border)
  * **Q2: Important & Not Urgent** (Amber gradient / Orange border)
  * **Q3: Urgent & Not Important** (Indigo gradient / Blue border)
  * **Q4: Not Urgent & Not Important** (Emerald gradient / Teal border)
* **Fluid Drag & Drop:** Drag tasks natively between quadrants to instantly update task priorities. State persists in local storage on release.

### ⏱️ Dynamic Timeline Calculations
* Real-time remaining time badges computed locally:
  * `🔴 Overdue by X days / hours` (with animated pulse-border alerts)
  * `🟡 Due today` or `🟡 Due in X hours`
  * `🟢 Tomorrow`
  * `🟢 X days left` (e.g. "3 days left", "4 days left")
  * `⚪ No Deadline`

### 🔄 Multi-View Layout
* **Matrix View:** Visually maps items by Eisenhower priority.
* **Timeline List:** Groups tasks chronologically (*Overdue*, *Due Today*, *Due Tomorrow*, *Upcoming*, and *No Deadline*).
* Swaps views instantly with smooth CSS transitions.

### 🏆 Completed Archives Slide-out Drawer
* A separate, elegant slide-out drawer houses completed tasks.
* Tracks historical completion times, sorts items (newest first), and provides instant controls to **restore** items to active status or **permanently delete** them.

### 💻 Course & Category Customizer
* Create custom classes (e.g., CS 301, MATH 202) with dynamic color themes.
* Quick-filter the entire dashboard by course with a single click.
* Safe-delete course references gracefully redirects tasks back to the default "General" category.

---

## 🛠️ Offline-First Architecture

TrueTask is designed to be **100% self-contained and run completely without internet**:
* **No Icon CDNs:** All dashboard icons are custom vector graphics (`SVG`) directly embedded in the HTML markup.
* **Offline Font Stack:** Gracefully falls back to high-grade local system fonts (`'Inter'`, `system-ui`, `-apple-system`, `BlinkMacSystemFont`) if Google Fonts cannot be fetched.
* **PWA Service Worker Caching:** Integrates `sw.js` using a **Cache-First** retrieval model. Once launched once, the app, manifest, and icons cache locally on your device for zero-latency, offline startup.
* **Local Storage Sandbox:** Your courses, tasks, and history are kept entirely secure and private, stored inside your browser's local memory (`localStorage`).

---

## 🚀 How to Run Locally

Since TrueTask uses native standard browser modules, **no build processes or installations are required**.

### Method 1: Direct File Launch (No Server Required)
Simply double-click **`index.html`** to open it instantly in any modern web browser (Chrome, Firefox, Safari, Edge).

### Method 2: Simple Local Server
To run a local server in the workspace directory (ideal for Service Worker registration):
```bash
# Python 3
python3 -m http.server 8000

# Node.js (npx serve)
npx -y serve
```
Then open `http://localhost:8000` or `http://localhost:3000` in your web browser.

---

## 📱 Progressive Web App (PWA) Installation

### On Desktop (Linux, macOS, Windows)
1. Open TrueTask in a Chromium-based browser (Chrome, Brave, Edge).
2. Click the **Install Icon** in the right side of the address bar, or go to Settings and click **"Install TrueTask..."**.
3. TrueTask will install on your desktop, get its own standalone window, and show in your OS application grid.

### On Mobile (Android, iOS)
1. Open the URL in your mobile browser (**Chrome** for Android, **Safari** for iOS).
2. Tap the browser options and select **"Add to Home Screen"**.
3. It will install with its custom vector checkmark app icon (`icon.svg`), remove the browser address bar, and behave like a native mobile app.

---

## 📁 File Structure

```text
  ├── index.html           
  ├── styles.css          
  ├── app.js              
  ├── sw.js                
  ├── manifest.json    
  └── icon.svg
```
