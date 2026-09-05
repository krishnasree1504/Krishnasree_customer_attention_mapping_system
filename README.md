# CAMS India - Consumer Attention Mapping System

A full-stack web application organized with modular **Frontend**, **Backend**, and **Database** architectures.

## 📁 Project Structure

```
cams-india-app/
├── 📁 frontend/          # React 18 + Vite + Tailwind CSS User Interface
│   └── src/
│       ├── components/   # UI components (Navbar, Sidebar, Badges)
│       ├── context/      # AuthContext state management
│       ├── lib/          # API Axios client
│       ├── pages/        # Dashboard, Stores, Shelves, Cameras, Users, Settings, Login, Register
│       ├── App.tsx
│       ├── main.tsx
│       └── index.css
│
├── 📁 backend/           # Node.js + Express REST API Server
│   ├── routes/           # Modular API endpoints (Auth, Stores, Shelves, Cameras, Users, Dashboard)
│   └── server.ts         # Express server configuration
│
├── 📁 database/          # In-memory Database & Collections Schema
│   ├── schema.ts         # TypeScript interfaces & types
│   └── db.ts             # Initial seed data (India Branches: Mumbai, Bengaluru, Delhi, Hyderabad)
│
├── server.ts             # Root entry point
├── package.json          # Node dependencies & scripts
├── vite.config.ts        # Vite configuration
└── README.md             # Running instructions
```

---
## System Architecture

```text
                         ┌──────────────────────────┐
                         │          USER            │
                         │                          │
                         │  Login / Upload Video    │
                         └────────────┬─────────────┘
                                      │
                                      ▼
┌────────────────────────────────────────────────────────────────┐
│                         FRONTEND                               │
│                    React + TypeScript                          │
│                                                                │
│ Dashboard | Stores | Shelves | Cameras | Video Analysis       │
│ Analytics | Reports | Users | Settings                         │
│                                                                │
│                    VIDEO ANALYSIS PAGE                         │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Video Upload                                             │  │
│  │                                                          │  │
│  │ Processed Video                                         │  │
│  │ • Customer Bounding Boxes                               │  │
│  │ • Customer IDs                                          │  │
│  │ • Gaze Direction                                        │  │
│  │                                                          │  │
│  │ Shopper Tracking | Gaze | Dwell | Shelf Attention       │  │
│  │ Product Detection | Attention Report                    │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────┬───────────────────────────────────┘
                             │
                             │ REST API
                             ▼
┌────────────────────────────────────────────────────────────────┐
│                         BACKEND                                │
│                    Node.js + TypeScript                        │
│                                                                │
│  ┌──────────────────────┐    ┌──────────────────────────────┐  │
│  │ Authentication       │    │ Video Processing API          │  │
│  │ Login / Register     │    │ Upload / Analyze / Results    │  │
│  └──────────────────────┘    └──────────────┬───────────────┘  │
│                                             │                  │
│                                             ▼                  │
│                          Python Process Launcher               │
└────────────────────────────┬───────────────────────────────────┘
                             │
                             ▼
┌────────────────────────────────────────────────────────────────┐
│                  COMPUTER VISION ENGINE                        │
│                     Python + OpenCV                            │
│                                                                │
│  ┌──────────────────────┐                                     │
│  │ YOLOv8n              │                                     │
│  │ Person Detection     │                                     │
│  └──────────┬───────────┘                                     │
│             │                                                 │
│             ▼                                                 │
│  ┌──────────────────────┐                                     │
│  │ ByteTrack            │                                     │
│  │ Shopper Tracking     │                                     │
│  │ Persistent IDs       │                                     │
│  └──────────┬───────────┘                                     │
│             │                                                 │
│             ├─────────────────────────┐                       │
│             ▼                         ▼                       │
│  ┌──────────────────────┐   ┌────────────────────────────┐   │
│  │ MediaPipe Face       │   │ SKU-110K YOLO Model        │   │
│  │ Landmarker           │   │ best.pt                    │   │
│  │                      │   │                            │   │
│  │ Gaze Estimation      │   │ Product/Object Detection   │   │
│  │ • UP                 │   └────────────────────────────┘   │
│  │ • DOWN                                                      │
│  │ • LEFT               │                                     │
│  │ • RIGHT              │                                     │
│  │ • FORWARD            │                                     │
│  │ • UNKNOWN            │                                     │
│  └──────────┬───────────┘                                     │
│             │                                                 │
│             ▼                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ Shelf Zone Analysis                                     │  │
│  │ • Customer-Shelf Association                            │  │
│  │ • Shelf Visits                                           │  │
│  │ • Spatial Position                                       │  │
│  └─────────────────────────┬───────────────────────────────┘  │
│                            │                                  │
│                            ▼                                  │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ Dwell Time Analytics                                    │  │
│  │ • Customer Dwell                                        │  │
│  │ • Shelf Dwell                                           │  │
│  │ • Visit Duration                                        │  │
│  └─────────────────────────┬───────────────────────────────┘  │
│                            │                                  │
│                            ▼                                  │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ Attention Analysis Engine                               │  │
│  │ • Gaze                                                   │  │
│  │ • Dwell Time                                             │  │
│  │ • Shelf Interaction                                      │  │
│  │ • Product/Object Engagement                              │  │
│  └─────────────────────────┬───────────────────────────────┘  │
└────────────────────────────┼──────────────────────────────────┘
                             │
                             ▼
┌────────────────────────────────────────────────────────────────┐
│                        OUTPUT LAYER                            │
│                                                                │
│  ┌──────────────────────┐    ┌─────────────────────────────┐  │
│  │ Analysis JSON        │    │ Processed MP4 Video         │  │
│  │                      │    │                             │  │
│  │ Customer Data        │    │ • Bounding Boxes            │  │
│  │ Tracking Data        │    │ • Customer IDs              │  │
│  │ Gaze Data            │    │ • Gaze Direction            │  │
│  │ Dwell Time           │    │ • Shelf Annotations         │  │
│  │ Shelf Metrics        │    │                             │  │
│  │ Product Metrics      │    │                             │  │
│  │ Attention Scores     │    └──────────────┬──────────────┘  │
│  │ Heatmap Data         │                   │                 │
│  └──────────┬───────────┘                   │                 │
│             └──────────────────┬────────────┘                 │
│                                ▼                              │
│                    ┌─────────────────────────┐                │
│                    │ Attention Report / PDF  │                │
│                    │                         │                │
│                    │ Shopper Tracking        │                │
│                    │ Gaze Analysis           │                │
│                    │ Dwell Time              │                │
│                    │ Shelf Attention         │                │
│                    │ Product Engagement      │                │
│                    │ Insights                │                │
│                    └─────────────────────────┘                │
└────────────────────────────────────────────────────────────────┘


## 🚀 How to Run in VS Code on Your Computer

### Step 1: Open the Project in VS Code
1. Extract the downloaded `cams-india-app.zip` file to a folder on your computer.
2. Open **VS Code**.
3. Click **File** > **Open Folder...** (or `Ctrl + O` / `Cmd + O`) and select the extracted `cams-india-app` folder.

---

### Step 2: Open the Integrated Terminal in VS Code
1. In VS Code, open a new terminal by clicking **Terminal** > **New Terminal** (or pressing ``Ctrl + ` ``).

---

### Step 3: Install Dependencies
Run the following command in the VS Code terminal:

```bash
npm install
```

---

### Step 4: Start the Development Server
Run the dev command:

```bash
npm run dev
```

You will see the output in the terminal:
```
CAMS India App server running on http://localhost:3000
```

---

### Step 5: Open in Your Browser
Open your browser and navigate to:
👉 **[http://localhost:3000](http://localhost:3000)**

---

## 🔑 Demo Login Credentials

- **Admin Account**: `admin@cams.com` (Password: `admin123`)
- **Store Manager Account**: `manager@cams.com` (Password: `manager123`)
- **Analyst Account**: `analyst@cams.com` (Password: `analyst123`)
