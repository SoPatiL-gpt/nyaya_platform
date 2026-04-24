# 🚀 The Nyayadheesh Protocol: A Complete Technical Report
### *Explained Like a Sci-Fi Story for a Fifth Grader*

---

> **Project Name:** Nyayadheesh — Digital Legal Case Management Platform
> **Type:** Full Stack Web Application (Final Year Project)
> **Tech Stack:** React.js + Vite · Firebase Firestore · Firebase Storage · Tailwind CSS v4 · Google Gemini AI
> **Author:** Final Year Student · Computer Science / IT Department

---

## 🌌 Chapter 1: The Big Picture — What Are We Building?

Imagine the entire legal system of India is a giant, ancient castle. Inside this castle, there are two kinds of people:

- **Citizens (Clients)** — ordinary people who have a problem and need help. Maybe someone stole their land, or they are in a dispute with a neighbor.
- **Jedi Knights (Advocates)** — trained warriors of the law who know all the secret spells (legal sections) and can fight battles in the courtroom.

The problem? The castle is **huge, confusing, and has no map.** Citizens wander around lost. Advocates don't know who needs help. Documents get lost. Hearing dates are forgotten.

**Nyayadheesh** is the **magical control room** we built inside this castle. It is a glowing, digital command center where:
- Citizens can register their problems (cases)
- Advocates can find and accept those problems
- Both can talk to each other in real-time
- Hearing dates appear on a glowing calendar
- Documents are stored safely in a digital vault
- An AI robot answers legal questions instantly

---

## 🏗️ Chapter 2: The Technology Stack — Choosing Our Weapons

Before building anything, a smart engineer picks the right tools. Here is what we chose and **exactly why**:

---

### ⚛️ 2.1 Frontend: React.js + Vite

**What is React?**
React is like a set of magical LEGO bricks for building websites. Instead of writing one giant messy page, you build small pieces called **Components** (like a Login Box, a Case Card, a Button) and snap them together.

**What is Vite?**
Vite is the rocket booster. It takes all your LEGO bricks and assembles the spaceship in **milliseconds** instead of minutes. It is the fastest build tool available for React in 2025.

**Why did we choose React + Vite?**
- React updates only the part of the screen that changed — no full page reloads. When an advocate accepts a case, the client's dashboard updates **instantly** without refreshing.
- Vite makes development super fast with Hot Module Replacement (HMR) — save a file, see the change immediately.
- React has a massive ecosystem of ready-made components (like `react-calendar`, `react-router-dom`).
- It is the most popular frontend framework in the world — easy to find help and documentation.

**How is it implemented?**
Every page (Landing, ClientDashboard, AdvocateDashboard, etc.) is a React **functional component** — a JavaScript function that returns HTML-like code called JSX. The `useState` hook stores data (like the list of cases), and `useEffect` hook fetches data when the page loads.

---

### 🎨 2.2 Styling: Tailwind CSS v4

**What is Tailwind CSS?**
Tailwind is like a giant box of paint colors and brushes, but instead of mixing them yourself, you just write the color name directly on the wall. Instead of writing `color: #00f0ff`, you write `text-neonBlue` directly in your HTML.

**Why Tailwind?**
- No separate CSS files to manage — styles live right next to the component they style.
- Utility-first approach means you can build any design without leaving your JSX file.
- Tailwind v4 uses a new `@theme` system — we defined our custom colors (`neonBlue: #00f0ff`, `neonPurple: #9d00ff`, `darkBg: #0a0a0f`) once and used them everywhere.
- The dark, glowing, futuristic UI (inspired by modern legal tech platforms) was achieved entirely with Tailwind utility classes like `shadow-[0_0_20px_#00f0ff]` for neon glow effects.

**How is it implemented?**
In `index.css`, we define the theme:
```css
@import "tailwindcss";
@theme {
  --color-neonBlue: #00f0ff;
  --color-neonPurple: #9d00ff;
  --color-darkBg: #0a0a0f;
}
```
Then in every component, classes like `bg-darkBg text-neonBlue border-neonPurple` are used directly.

---

### 🔥 2.3 Backend + Database: Firebase Firestore

**What is Firebase?**
Firebase is Google's magical cloud brain. Instead of building your own server (which requires setting up Node.js, Express, databases, hosting — very complex), Firebase gives you a ready-made brain that you just plug into your app.

**What is Firestore?**
Firestore is the **real-time database** inside Firebase. Think of it as a giant, magical notebook in the cloud. When you write something in it, **everyone who is reading that page sees the update instantly** — no refreshing needed.

**Why Firebase Firestore?**
- **No backend server needed** — Firebase IS the backend. This eliminates the need for Node.js/Express/Django entirely.
- **Real-time listeners** (`onSnapshot`) — when an advocate accepts a case, the client's dashboard updates in real-time without any polling or page refresh.
- **Free tier (Spark Plan)** is generous enough for a college project — 50,000 reads/day, 20,000 writes/day.
- **Seamless integration** with React — the Firebase SDK works directly in the browser.
- **No SQL knowledge needed** — Firestore is a NoSQL document database. Data is stored as JSON-like documents in collections.

**How is it implemented?**
```javascript
// firebase.js — Initialize once, use everywhere
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
```

**Firestore Collections (Database Structure):**

| Collection | Purpose | Key Fields |
|---|---|---|
| `users` | Stores all Client and Advocate profiles | `uid`, `role`, `email`, `barId` (advocate), `firstName/lastName` (client) |
| `cases` | Stores all registered legal cases | `clientId`, `advocateId`, `status`, `caseType`, `court`, `legalAct` |
| `hearings` | Stores all scheduled hearings | `caseId`, `advocateId`, `date`, `note`, `timelineStatus` |
| `documents` | Stores uploaded document metadata | `caseId`, `fileUrl`, `fileName`, `uploadedBy` |
| `messages` | Stores all chat messages | `sender`, `text`, `timestamp`, `type` |

---

### 🗄️ 2.4 File Storage: Firebase Storage

**What is Firebase Storage?**
Firebase Storage is the **secure digital vault**. When a client uploads a PDF or image as evidence, it goes into this vault. The vault gives back a secret URL (a web link) that only authorized people can use to view the file.

**Why Firebase Storage?**
- Directly integrated with Firestore — after uploading, we save the download URL in Firestore so it can be displayed anywhere.
- Handles files of any format (PDF, JPG, PNG, DOCX, etc.).
- Files are stored on Google's servers — reliable, fast, and secure.
- No separate file server needed.

**How is it implemented?**
```javascript
// UploadDocs.jsx
const fileRef = ref(storage, `documents/${Date.now()}_${file.name}`);
await uploadBytes(fileRef, file);
const url = await getDownloadURL(fileRef);
// Save URL to Firestore
await addDoc(collection(db, "documents"), { fileUrl: url, fileName: file.name, caseId });
```

---

### 🤖 2.5 AI Legal Assistant: Google Gemini API

**What is Gemini AI?**
Gemini is Google's most powerful AI brain. It can read your question and give you a detailed, intelligent answer — like having a very smart lawyer friend available 24/7.

**Why Gemini?**
- Free API tier available for development.
- Excellent at understanding legal questions in plain English.
- Simple REST API — just send a POST request with the question, get the answer back.
- No complex AI setup needed.

**How is it implemented?**
```javascript
// AiChat.jsx
const res = await axios.post(
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${API_KEY}`,
  { contents: [{ parts: [{ text: `You are a legal assistant. Answer clearly: ${input}` }] }] }
);
```

---

### 🗺️ 2.6 Routing: React Router DOM v7

**What is React Router?**
React Router is the **GPS system** of our app. When you click "Login as Client," it navigates you to `/client-login`. When you click "My Cases," it takes you to `/client-dashboard`. Without a router, a React app is just one page.

**How is it implemented?**
```javascript
// App.jsx
<Routes>
  <Route path="/" element={<Landing />} />
  <Route path="/client-login" element={<ClientLogin />} />
  <Route path="/client-dashboard" element={<ProtectedRoute><ClientDashboard /></ProtectedRoute>} />
  ...
</Routes>
```

**ProtectedRoute** is a guard component — if you are not logged in (no `mock_uid` in localStorage), it redirects you back to the home page. This prevents unauthorized access.

---

## 📁 Chapter 3: The File Structure — The Map of Our Castle

```
nyayadheesh-platform/
├── src/
│   ├── pages/
│   │   ├── Landing.jsx          ← Home page with two login buttons
│   │   ├── ClientLogin.jsx      ← Client login form
│   │   ├── AdvocateLogin.jsx    ← Advocate login (BAR ID + password)
│   │   ├── Register.jsx         ← Client registration form
│   │   ├── AdvocateRegister.jsx ← Advocate registration (BAR, state, etc.)
│   │   ├── ClientDashboard.jsx  ← Full client dashboard (cases, schedule)
│   │   ├── AdvocateDashboard.jsx← Full advocate dashboard (cases, hearings)
│   │   ├── CaseView.jsx         ← Advocate's detailed case management page
│   │   ├── NewCase.jsx          ← New case registration form
│   │   ├── Hearing.jsx          ← Schedule hearing (legacy, still accessible)
│   │   ├── Schedule.jsx         ← Shared schedule page (calendar + slider)
│   │   ├── Chat.jsx             ← Real-time messaging with email display
│   │   ├── AiChat.jsx           ← AI Legal Assistant (Gemini)
│   │   └── UploadDocs.jsx       ← Document upload to Firebase Storage
│   ├── components/
│   │   └── ProtectedRoute.jsx   ← Route guard (login check)
│   ├── firebase.js              ← Firebase initialization
│   ├── App.jsx                  ← Route definitions
│   ├── main.jsx                 ← React app entry point
│   └── index.css                ← Tailwind + custom theme
├── package.json                 ← Dependencies list
└── vite.config.js               ← Vite build configuration
```

---

## 🧭 Chapter 4: The Complete User Journey — The Story

### 👤 4.1 The Client's Journey

**Step 1: Landing Page**
The citizen arrives at the Nyayadheesh platform. They see a beautiful dark-themed page with two glowing cards: "Login as Client" (blue glow) and "Login as Advocate" (purple glow). They click "Login as Client."

**Step 2: Client Login**
They enter their email and password. The system checks the `users` collection in Firestore. If credentials match and `role === "client"`, they are logged in. Their `uid`, `email`, `name`, and `role` are saved in `localStorage` for the session.

**Step 3: Client Registration (New Users)**
New users click "Register here." They fill in:
- First Name + Last Name
- Mobile Number
- Government ID (Aadhaar/PAN)
- Email Address
- City of Residence
- Password + Confirm Password

A new document is created in the `users` Firestore collection with a unique `uid` (timestamp-based). They are redirected to the login page.

**Step 4: Client Dashboard**
The dashboard has:
- **Top-left hamburger menu** → opens the Home Menu with Nyayasamhita Rules (PDF links), Supreme Court News (10 latest items), AI Assistant, and Logout.
- **Top-right Messages button** → shows unread message count badge, opens Chat.
- **Welcome Banner** → "Welcome to Nyayadheesh Platform ⚖️"
- **Two tabs:** My Cases | Upcoming Schedule

**Step 5: My Cases Tab**
Each case card has 4 sub-tabs:
- **My Case** — shows all case details (type, court, act, section, petitioner, respondent)
- **Advocate Details** — shows the assigned advocate's profile, contact, and clickable email
- **Timeline / Progress** — read-only flowchart of hearing history with status badges (Success, Postponed, Won, Lost)
- **Documents** — shows uploaded files with links + Upload button

**Step 6: Upcoming Schedule Tab**
A `react-calendar` component shows the current month. Dates with hearings are highlighted in neon blue. Clicking a date shows all hearings for that day with case name, court, notes, and status.

**Step 7: New Case Registration (FAB Button)**
The floating "+" button opens the New Case form with 4 sections:
1. Basic Case Selection (Jurisdiction dropdown)
2. Case Details (Case Type, Matter Description)
3. Petitioner Details (Name, Gender, DOB, Mobile, Email, Address)
4. Respondent/Accused Details (same fields + Legal Act + Section dropdown — 10 Civil, 10 Criminal options)

---

### ⚖️ 4.2 The Advocate's Journey

**Step 1: Advocate Login**
The advocate enters their BAR ID and password. The system checks `users` collection for `barId` match and `role === "advocate"`.

**Step 2: Advocate Registration**
New advocates fill in:
- BAR ID + State (dropdown of all 36 Indian states/UTs)
- Name, DOB (auto-calculates age), Education Qualifications
- Practice Court Type (High Court / District Court / Both / Supreme Court)
- Years Active
- Mobile, Email, Govt ID, Full Address
- Password

**Step 3: Advocate Dashboard**
- **Top-left hamburger menu** → same as client (Nyayasamhita, SC News, AI, Logout)
- **Top-right Messages button** → opens Chat
- **Welcome Banner** → "Welcome to Nyayadheesh Platform ⚖️"
- **Two tabs:** My Cases | Upcoming Hearings

**Step 4: My Cases Tab**
Two sections:
- **My Active Cases** — accepted cases with "Open Case →" button
- **Pending Case Requests** — new cases from clients with Accept ✓ / Reject ✕ buttons

When **Accept** is clicked:
1. The case `status` is updated to `"accepted"` in Firestore
2. The advocate's `uid` is saved as `advocateId` on the case
3. An automated system message is sent to the client: "✅ Your case has been accepted!"

When **Reject** is clicked:
1. The case `status` is updated to `"rejected"`
2. An automated message is sent: "❌ We regret to inform you that your case request has been declined."

**Step 5: Open Case → CaseView Page**
Clicking "Open Case →" saves the `caseId` to localStorage and navigates to `/case-view`. This page has 5 tabs:

- **Case Details** — all information entered by the client (petitioner, respondent, legal act, section, matter)
- **Schedule Hearing** — date picker + notes textarea. Submitting creates a new document in the `hearings` collection. This immediately appears on the client's calendar.
- **Client Information** — client's profile (name, city, govt ID, mobile, clickable email)
- **Timeline / Progress** — flowchart of all hearings. For each hearing (except the last), the advocate can set: ✓ Success or ⏸ Postponed. For the **final hearing**, they can set: 🏆 Won, ❌ Lost, or ⏸ Postponed. These statuses update in real-time on the client's dashboard.
- **Documents** — all files uploaded by the client, clickable to open in a new tab.

**Step 6: Upcoming Hearings Tab**
A custom slider (built with React `useState`) shows hearings one by one. Each slide shows:
- Date in DD-MM-YYYY format
- Day of the week
- Hearing notes
- Status badge

Navigation arrows (← →) cycle through all hearings. Counter shows "2 / 7" etc.

---

### 💬 4.3 The Messaging System

Both Client and Advocate can access the Chat page from their respective dashboards.

**Connection Check:** The chat first verifies that there is at least one `accepted` case connecting the current user to a partner. If not, a "No Active Connection" screen is shown.

**Partner Info Display:** The partner's name and email are displayed in the top-right corner of the chat header. The email is a **clickable `mailto:` link** — clicking it opens the user's default email client with a pre-filled subject line: "Regarding Your Case on Nyayadheesh Platform."

**Real-time Messages:** Messages are stored in the `messages` Firestore collection with `sender`, `text`, and `timestamp`. The `onSnapshot` listener updates the chat in real-time — no polling, no refresh needed.

**System Messages:** When a case is accepted or rejected, automated system messages appear in the chat as centered notification bubbles (different from regular chat bubbles).

---

## 🔐 Chapter 5: Authentication — The Security System

Since this is a college project (not a production app), we use a **mock authentication system** instead of Firebase Auth (which requires phone/email verification):

- On login, credentials are checked against the `users` Firestore collection manually.
- On success, `mock_uid`, `mock_role`, `mock_email`, and `mock_name` are stored in `localStorage`.
- `ProtectedRoute` checks for `mock_uid` in localStorage — if absent, redirects to `/`.
- On logout, `localStorage.clear()` removes all session data.

**Why not Firebase Auth?**
Firebase Auth requires email verification, which needs a real email server. For a local college demo, mock auth is simpler and equally demonstrable.

---

## 📜 Chapter 6: The Nyayasamhita Rules Feature

The Home Menu in both dashboards includes direct PDF links to India's three new criminal laws (2023):

1. **Bharatiya Nyaya Sanhita (BNS) 2023** — Replaces the Indian Penal Code (IPC) 1860
2. **Bharatiya Nagarik Suraksha Sanhita (BNSS) 2023** — Replaces the Code of Criminal Procedure (CrPC) 1973
3. **Bharatiya Sakshya Adhiniyam (BSA) 2023** — Replaces the Indian Evidence Act 1872

These are official PDFs from `legislative.gov.in` — the Government of India's official legislative portal.

---

## 📰 Chapter 7: Supreme Court News Feature

Both dashboards include a "Supreme Court News" section in the Home Menu showing the **10 latest news items** from the Supreme Court of India. These are curated, real news items from 2025 covering:
- Bail guidelines
- Judicial vacancy orders
- New e-filing systems
- Bharatiya Nyaya Sanhita clarifications
- Live-streaming of hearings

In a production version, this would be connected to a live news API (like the SC's official RSS feed or a news aggregator API).

---

## 🗓️ Chapter 8: The Calendar System

**For Clients:** The `react-calendar` library renders a full monthly calendar. Dates that have hearings are highlighted with a neon blue background using the `tileClassName` prop. Clicking any date shows all hearings for that day in a panel on the right.

**For Advocates:** The Schedule tab in the Advocate Dashboard (and the `/schedule` route) shows a custom slider with hearing cards. The `react-slick` library was **intentionally removed** because it is incompatible with React 19 (it uses deprecated `ReactDOM.findDOMNode` API). The replacement is a simple `useState`-based slider that is lighter, faster, and fully compatible.

---

## 🔄 Chapter 9: Real-Time Data Flow — How Everything Connects

```
Client registers case → Firestore "cases" collection
         ↓
Advocate's dashboard updates instantly (onSnapshot)
         ↓
Advocate clicks Accept → case.status = "accepted", case.advocateId = uid
         ↓
System message sent to "messages" collection
         ↓
Client's dashboard updates: case shows "accepted" status
         ↓
Advocate schedules hearing → Firestore "hearings" collection
         ↓
Client's calendar highlights the hearing date instantly
         ↓
Client uploads document → Firebase Storage → URL saved in "documents" collection
         ↓
Advocate's CaseView Documents tab shows the file instantly
         ↓
Advocate updates timeline status → "hearings" document updated
         ↓
Client's Timeline tab shows new status badge instantly
```

Every step uses `onSnapshot` — Firebase's real-time listener. This is like having a magical walkie-talkie that broadcasts every change to everyone who is listening.

---

## 🛠️ Chapter 10: How to Run the Project Locally

### Prerequisites
- Node.js v20+ installed
- A Firebase project with Firestore and Storage enabled

### Steps

```bash
# 1. Navigate to the project folder
cd "nyayadheesh-platform"

# 2. Install all dependencies
npm install

# 3. Start the development server
npm run dev

# 4. Open in browser
# http://localhost:5173
```

### Firebase Setup
1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Create a new project named `nyaya-platform`
3. Enable **Firestore Database** (start in test mode)
4. Enable **Storage** (start in test mode)
5. Copy your config into `src/firebase.js`

### First Time Use
1. Go to `/advocate-register` → Register an advocate with a BAR ID
2. Go to `/register` → Register a client
3. Login as client → Create a new case
4. Login as advocate → Accept the case
5. Both can now chat, schedule hearings, upload documents

---

## 📊 Chapter 11: Component Summary Table

| Component | File | Purpose |
|---|---|---|
| Landing | `Landing.jsx` | Home page with two login portals |
| ClientLogin | `ClientLogin.jsx` | Client authentication form |
| AdvocateLogin | `AdvocateLogin.jsx` | Advocate BAR ID login |
| Register | `Register.jsx` | Client registration (all fields) |
| AdvocateRegister | `AdvocateRegister.jsx` | Advocate registration (BAR, state, etc.) |
| ClientDashboard | `ClientDashboard.jsx` | Full client portal (cases, schedule, menu) |
| AdvocateDashboard | `AdvocateDashboard.jsx` | Full advocate portal (cases, hearings, menu) |
| CaseView | `CaseView.jsx` | Advocate's detailed case management |
| NewCase | `NewCase.jsx` | 4-section new case registration form |
| Hearing | `Hearing.jsx` | Legacy hearing scheduler |
| Schedule | `Schedule.jsx` | Shared schedule (calendar + slider) |
| Chat | `Chat.jsx` | Real-time messaging + email display |
| AiChat | `AiChat.jsx` | Gemini AI legal assistant |
| UploadDocs | `UploadDocs.jsx` | Firebase Storage file upload |
| ProtectedRoute | `ProtectedRoute.jsx` | Route authentication guard |

---

## 🌟 Chapter 12: Why This Tech Stack is Perfect for This Project

| Requirement | Solution | Why |
|---|---|---|
| Simple, no complex backend | Firebase | No Node.js/Express server needed |
| Real-time updates | Firestore `onSnapshot` | Instant sync without polling |
| File storage | Firebase Storage | Integrated with Firestore |
| Fast UI development | React + Tailwind | Component-based, utility-first |
| AI assistant | Google Gemini API | Free, powerful, simple REST API |
| Local compatibility | All browser-based | No server setup, runs on `npm run dev` |
| Database management | Firestore console | Visual UI to view/edit all data |
| Routing | React Router v7 | Industry standard, simple API |

---

## 🎯 Chapter 13: Features Checklist

### Client Side ✅
- [x] Landing page with dual login portals
- [x] Client login (email/username + password)
- [x] Client registration (First/Last Name, Contact, Govt ID, Email, City, Password)
- [x] Dashboard with hamburger Home Menu
- [x] Nyayasamhita Rules (PDF links to BNS, BNSS, BSA 2023)
- [x] Supreme Court News (10 latest items)
- [x] AI Legal Assistant
- [x] Logout
- [x] Welcome Banner
- [x] My Cases tab with 4 sub-tabs (Case Details, Advocate Info, Timeline, Documents)
- [x] Upcoming Schedule tab with highlighted calendar
- [x] New Case Registration (4 sections, all fields)
- [x] New Messages button with unread count badge
- [x] Real-time case status updates
- [x] Document upload to Firebase Storage
- [x] Read-only timeline/progress flowchart

### Advocate Side ✅
- [x] Advocate login (BAR ID + password)
- [x] Advocate registration (BAR ID, State, Name, DOB/Age, Education, Court Type, Years, Contact, Govt ID, Address, Password)
- [x] Dashboard with hamburger Home Menu (same as client)
- [x] Welcome Banner
- [x] My Cases tab (Active Cases + Pending Requests with Accept/Reject)
- [x] Automated messages on Accept/Reject
- [x] Open Case → CaseView with 5 tabs
- [x] Case Details (all client-entered info)
- [x] Schedule Hearing (date + notes → Firestore → client calendar updates)
- [x] Client Information (profile + clickable email)
- [x] Timeline/Progress (editable flowchart with Success/Postponed/Won/Lost buttons)
- [x] Documents (view client-uploaded files in new tab)
- [x] Upcoming Hearings slider (custom, React 19 compatible)
- [x] Messages button with unread count

### Messaging ✅
- [x] Real-time chat (Firestore `onSnapshot`)
- [x] Partner name + email displayed in chat header
- [x] Clickable email → opens mailto with pre-filled subject
- [x] System messages for case accept/reject
- [x] Connection check (only works with accepted case)

---

## 🚀 Epilogue: The Mission is Complete

We built a **complete, full-stack, real-time legal case management platform** using the simplest possible technology stack that is:

- **Compatible** — React + Firebase work seamlessly together
- **Simple** — No separate backend server, no SQL, no complex setup
- **Real-time** — Every change propagates instantly to all connected users
- **Scalable** — Firebase can handle thousands of users without any infrastructure changes
- **Demonstrable** — Runs locally with a single `npm run dev` command

The Nyayadheesh Space Station is now fully operational. Citizens can dock their ships, Jedi Advocates can accept their missions, and justice can be served — digitally, efficiently, and in real-time. ⚖️✨

---

*Report generated for Final Year Project submission · Nyayadheesh Platform · 2025*
