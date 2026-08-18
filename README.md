# WARENEX - Intelligent Warehouse Decision & Fulfillment Platform

WARENEX is a full-stack, offline-capable smart warehouse operations control tower. Instead of merely displaying logs, it analyzes queues, flags exceptions, runs deterministic engines to resolve conflicts, and explains the impact of every suggestion.

```
       [ CUSTOMER ORDERS ]
               │
               ▼
┌──────────────────────────────┐
│     WARENEX REST APIs        │
└──────────────┬───────────────┘
               │
               ├──────────────────────────────┐
               ▼                              ▼
┌──────────────────────────────┐    ┌──────────────────────────────┐
│  SQLite Database             │    │  Decision Engine             │
│  - Products, Orders, Items   │    │  - Priority Scoring Rules    │
│  - Exceptions, Route Logs    │    │  - Stock Allocation Rules    │
│  - Pickers, Reorder propose  │    │  - Routing & Risk Indicators │
└──────────────────────────────┘    └──────────────────────────────┘
               ▲
               │
┌──────────────┴───────────────┐
│     Vite React Frontend      │
│  - Command Center Gauges     │
│  - Dynamic Picker Router     │
│  - Interactive Simulator     │
│  - Copilot Insight Drawer    │
└──────────────────────────────┘
```

---

## 1. Problem & Solution

### The Problem
Traditional Warehouse Management Systems (WMS) behave like static databases: they display quantities but leave allocation conflicts, safety thresholds, QC damages, and SLA delays to manual human resolution, leading to delivery penalties and shipping errors.

### The WARENEX Solution
An intelligent decision-support platform that implements **Exception → Decision → Resolution**:
1. **Understand**: Tracks live order queues and inventory states.
2. **Detect**: Automatically flags shortages, damage incidents, and bottleneck queues.
3. **Resolve**: Recommends replenishment and replacement actions.
4. **Explain**: Generates clear, mathematical factors explaining why every score and priority was assigned.

---

## 2. Core Decision Engines

- **Priority Score Engine (0-100)**: Evaluates delivery deadlines, customer segments, value ranges, and available stocks to assign priority classifications (*Critical*, *High*, *Medium*, *Low*).
- **Smart Stock Allocation Engine**: Solves competing stock requests by assigning limited units to highest-priority orders, triggering partial allocations, holding low-priority requests, and proposing safety reorder lines.
- **SLA Risk Engine**: Dynamically estimates remaining minutes vs. average stage durations to flag orders likely to breach shipping agreements.
- **Route serpentine Optimizer**: Traverses product bin locations (Zone-Aisle-Bin) and sorts sequences to minimize travel distance (reducing travel time by ~38%).
- **Replenishment Reorder Engine**: Suggests order quantities based on weekly projected demand when safety stocks decline.

---

## 3. Database Schema

We use **SQLite3** containing ten structured tables with proper relations:
- `products`: Base table storing SKU, name, aisle location, counts (available, reserved, damaged), and reorder thresholds.
- `orders`: Stores customer tier details, priority score, stage status, and calculated SLA risk status.
- `order_items`: Maps orders to SKUs and keeps track of quantity stages (allocated, picked, packed, damaged).
- `exceptions`: Registers incident reports, quantities, and their three-step resolution recommendations.
- `pickers` & `picking_batches`: Registers picker assignments and optimized picking path strings.
- `reorder_recommendations`: Proposed replenishment units and approvals.
- `workflow_events`: Complete chronologically-ordered audit log trails for every order.
- `notifications`: Broadcast warnings and critical stock exceptions.
- `decision_log`: Core repository auditing what decisions the engines applied and why.

---

## 4. Technology Stack

- **Frontend**: React (v18), Vite, Tailwind CSS, Recharts (visualizations), Lucide React (icons).
- **Backend**: Python (v3), Flask (REST APIs), Flask-CORS.
- **Database**: SQLite3.

---

## 5. Installation & Run Guide

### Backend Setup
1. Open a terminal in the `backend/` directory:
   ```bash
   pip install -r requirements.txt
   ```
2. Launch the backend server (starts on port `5000` and seeds the database):
   ```bash
   python app.py
   ```

### Frontend Setup
1. Open a terminal in the `frontend/` directory.
2. If `npm` is not in your global system PATH, add your local node directory (e.g. portable Node) to PATH, then install dependencies:
   ```bash
   npm install
   ```
3. Launch the Vite dev server (runs on port `3000` and proxies `/api` to the backend):
   ```bash
   npm run dev
   ```
4. Access the platform at: `http://localhost:3000`.

---

## 6. End-to-End Demo Walkthrough Scenario

To demonstrate the full power of WARENEX, click the **"Run Smart Warehouse Demo"** button on the Top Bar to launch the step-by-step scenario wizard:
1. **Initial Shortage**: Order `ORD-104` requests 10 Wireless Headphones (SKU `P-101`) but available stock is only 7 units. A competing low-priority order `ORD-118` requests 5 units.
2. **Allocation Run**: The engine allocates 7 units to `ORD-104`, puts `ORD-118` on hold, logs a shortage exception, and creates a reorder suggestion for 30 units.
3. **Serpentine Route**: Picker John Doe is assigned the ticket and runs route optimization to Zone A. The order moves to the packing bench.
4. **QC Damage**: During QC, 1 unit package is reported damaged. Packing halts and exception `EXP-104-QC-DAMAGE` is raised.
5. **Resolution Swap**: Operator resolves the exception by finding a replacement from the emergency bin, clearing the exception. QC passes.
6. **Dispatch Outbound**: The order is shipped via FedEx. Reserved inventory is updated, timeline events are archived, and dashboard health statistics refresh.
