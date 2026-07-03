# Office Energy Dashboard — Final Frontend Design Specification

## 1. Design Direction

The frontend should use a **minimal dark glassmorphism style** that feels modern, premium, calm, and uncluttered.

The design should preserve the visual language of the approved concept:

- Deep navy background
- Frosted translucent panels
- Soft blue glow
- Rounded cards
- Thin borders
- Spacious layout
- Minimal use of accent colors
- Clear data hierarchy
- Strong focus on the office floor plan
- No unnecessary decoration
- No excessive widgets

The interface should look like a premium operations dashboard rather than a generic admin template.

---

## 2. Core Visual Style

### Background

Use a full-page dark navy gradient.

```css
background:
  radial-gradient(circle at top left, rgba(57, 103, 213, 0.10), transparent 32%),
  radial-gradient(circle at top right, rgba(59, 130, 246, 0.08), transparent 28%),
  linear-gradient(135deg, #07111f 0%, #0b1728 48%, #0a1422 100%);
```

### Glass Panels

```css
background: rgba(255, 255, 255, 0.055);
backdrop-filter: blur(18px);
-webkit-backdrop-filter: blur(18px);
border: 1px solid rgba(255, 255, 255, 0.08);
box-shadow: 0 12px 35px rgba(0, 0, 0, 0.20);
border-radius: 22px;
```

### Main Colors

| Purpose | Color |
|---|---|
| Main background | `#07111F` |
| Secondary background | `#0B1728` |
| Glass surface | `rgba(255,255,255,0.055)` |
| Primary text | `#F4F7FB` |
| Secondary text | `#A9B4C7` |
| Muted text | `#718096` |
| Primary blue | `#5B8CFF` |
| Soft blue glow | `rgba(91,140,255,0.35)` |
| Green live state | `#63E6A5` |
| Yellow light state | `#FFC85C` |
| Red alert | `#FF6B6B` |
| Gray inactive device | `#6B7280` |

### Typography

Recommended font:

```css
font-family: Inter, "SF Pro Display", "Segoe UI", sans-serif;
```

- Page greeting: `28–32px`, semibold
- Section titles: `17–20px`, semibold
- KPI values: `28–34px`, semibold
- Card labels: `13–15px`
- Supporting text: `12–14px`
- Table labels: `12–13px`

---

## 3. App Layout

```text
┌──────────────────────────────────────────────────────────────┐
│ Sidebar │ Main Dashboard Area                               │
│         │ Header                                            │
│         │ Office Overview + KPI Cards                       │
│         │ Power Trend                                       │
│         │ Room Summary + Device Status + Alerts + Controls  │
│         │ Footer Status Bar                                 │
└──────────────────────────────────────────────────────────────┘
```

Recommended dimensions:

- Sidebar width: `220–240px`
- Main content maximum width: `1600px`
- Page gap: `16–20px`
- Card gap: `14–18px`
- Outer padding: `18–24px`

---

## 4. Sidebar

### Top Section

- Office Energy logo
- Product name: **Office Energy**
- Subtitle: **Dashboard**

### Navigation Items

1. Overview
2. Rooms
3. Devices
4. Alerts
5. Analytics
6. Reports
7. Settings

### Active Navigation

```css
background: linear-gradient(
  90deg,
  rgba(73, 113, 230, 0.32),
  rgba(73, 113, 230, 0.14)
);
border: 1px solid rgba(91, 140, 255, 0.45);
box-shadow: inset 0 0 20px rgba(91, 140, 255, 0.15);
```

### Bottom Sidebar Area

#### Office Hours Card

- Green status indicator
- Text: `Office Hours`
- Time: `9:00 AM – 5:00 PM`

#### User Card

- User avatar
- Name: `Alex Morgan`
- Role: `Facility Manager`
- Dropdown icon

---

## 5. Header

### Left Side

```text
Good morning, Alex 👋
Here’s your office energy overview.
```

### Right Side

Use compact glass pills for:

- `Live`
- `Office Hours`
- `9:00 AM – 5:00 PM`
- Current time
- Notification icon
- User avatar

---

## 6. Main Dashboard Grid

### Row 1

- Office floor overview
- Four KPI cards

### Row 2

- Office floor overview continues on the left
- Power trend chart on the right

### Row 3

- Room summary
- Live device status
- Active alerts
- Discord bot commands
- Simulation controls

The office floor overview should remain the strongest visual element.

---

## 7. Office Floor Overview

### Rooms

The system has exactly **3 rooms**:

1. Drawing Room
2. Work Room 1
3. Work Room 2

### Devices

Each room has exactly:

- 2 fans
- 3 lights

Total:

- 6 fans
- 9 lights
- 15 devices

### Visual Rules

Each room must visibly contain:

- 2 fan icons
- 3 light icons

Device states:

- Fan ON: glowing blue, rotating animation
- Fan OFF: muted gray, no animation
- Light ON: warm yellow glow
- Light OFF: muted gray

Room labels should show room name and live power, for example:

```text
Drawing Room
186 W
```

### Interaction

On hover, a device tooltip should show:

- Device name
- Room
- Status
- Current wattage
- Last changed time

```text
Fan 1
Work Room 1
ON · 60 W
Changed 12 minutes ago
```

Do not add floor tabs because the project has one office layout only.

---

## 8. KPI Cards

Use four compact glass cards.

### Total Power

```text
586 W
Live Consumption
```

### Devices ON

```text
11 / 15
73% of Devices
```

### Today’s Energy

```text
4.32 kWh
+12% vs yesterday
```

### Active Alerts

```text
2
Requires attention
```

KPI cards should remain compact and avoid excessive chart details.

---

## 9. Live Power Trend

Show:

- Title: `Power Trend (Live)`
- Filter: `Today`
- Y-axis in watts
- X-axis by time
- Smooth blue line
- Soft blue area fill
- Current point tooltip

```text
10:24 AM · 586 W
```

Use minimal grid lines, no heavy borders, and a subtle glow on the active point.

---

## 10. Room Summary

| Room | Power | ON / Total |
|---|---:|---:|
| Drawing Room | 186 W | 5 / 5 |
| Work Room 1 | 200 W | 4 / 5 |
| Work Room 2 | 200 W | 2 / 5 |
| Total | 586 W | 11 / 15 |

Use:

- Green dot for normal state
- Yellow dot for partial alert state
- No unnecessary progress bars

---

## 11. Live Device Status

### Summary Row

- Fans: `6 total · 4 ON`
- Lights: `9 total · 7 ON`
- Devices: `15 total · 11 ON`

### Room Rows

```text
Drawing Room   [Fan ON] [Fan ON] [Light ON] [Light ON] [Light ON]    5 / 5
Work Room 1    [Fan ON] [Fan ON] [Light ON] [Light ON] [Light OFF]   4 / 5
Work Room 2    [Fan OFF] [Fan OFF] [Light ON] [Light OFF] [Light ON] 2 / 5
```

Do not show a full device table on the overview page. Detailed data belongs on the Devices page.

---

## 12. Active Alerts

Show no more than three alerts on the overview page.

Each alert includes:

- Severity icon
- Short message
- Timestamp

Examples:

```text
Work Room 2: 2 devices are still ON after office hours.
10:15 AM
```

```text
All devices in Work Room 1 have been ON for over 2 hours.
09:40 AM
```

```text
Drawing Room power consumption is above average.
09:10 AM
```

Use red for critical, yellow for warning, and blue for informational alerts.

---

## 13. Discord Bot Commands

Card title:

```text
Discord Bot Commands
```

Commands:

```text
!status
Get overall office status
```

```text
!room work1
View Work Room 1 details
```

```text
!usage
Show today’s energy usage
```

Include a small Discord icon and an online indicator.

---

## 14. Simulation Controls

Controls:

- Run Simulation
- Pause
- After-hours Mode
- Trigger Alert

```text
[ Run Simulation ]
[ Pause          ]
[ After-hours ○  ]
[ Trigger Alert  ]
```

- Run Simulation: blue primary button
- Pause: neutral glass button
- After-hours: toggle
- Trigger Alert: red-tinted glass button

These controls should remain visually secondary.

---

## 15. Footer Status Bar

Use one slim horizontal glass bar.

Left:

```text
Last updated: 10:24 AM · 30 seconds ago
```

Center:

```text
All systems operational
```

Right:

```text
Data accuracy: 98%
```

---

## 16. Animation Guidelines

### Fans

```css
animation: spin 1.4s linear infinite;
```

Only ON fans rotate.

### Lights

```css
filter: drop-shadow(0 0 8px rgba(255, 200, 92, 0.75));
```

### Live Indicator

```css
animation: pulse 2s ease-in-out infinite;
```

### Cards

```css
transform: translateY(-2px);
border-color: rgba(91, 140, 255, 0.18);
```

Do not overuse motion.

---

## 17. Responsive Behaviour

### Desktop

- Full sidebar
- Office map and chart side by side
- Bottom cards arranged in one compact row where possible

### Tablet

- Collapsed sidebar
- Office map full width
- KPI cards in a 2×2 grid
- Bottom cards in two columns

### Mobile

- Bottom navigation instead of sidebar
- KPI cards in a horizontal scroll row
- Simplified or horizontally scrollable office map
- Cards stacked vertically
- Simulation controls inside a drawer

---

## 18. Pages

### Overview

Contains the complete main dashboard.

### Rooms

Shows exactly three rooms. Each room page contains:

- 2 fans
- 3 lights
- Current power
- Active duration
- Recent events
- Room-specific alerts

### Devices

Detailed table of all 15 devices:

- Device name
- Room
- Type
- Status
- Power draw
- Last changed
- Active duration

### Alerts

- Active alerts
- Resolved alerts
- Severity
- Room
- Timestamp
- Alert reason

### Analytics

- Live office power
- Daily usage
- Per-room comparison
- Peak usage
- Historical trends

### Reports

- Daily summary
- Estimated energy cost
- Usage by room
- Export options

### Settings

- Office hours
- Simulation speed
- Discord channel
- Electricity cost per kWh
- Alert thresholds

---

## 19. UX Rules

1. The office floor plan is the main visual focus.
2. Never show more than 15 devices.
3. Always preserve the correct structure: 3 rooms, 2 fans per room, 3 lights per room.
4. Avoid oversized text.
5. Avoid unnecessary charts.
6. Avoid decorative gradients inside every card.
7. Use color only for status and emphasis.
8. Keep corner radius and spacing consistent.
9. Maintain clear separation between major sections.
10. The dashboard should be understandable within five seconds.

---

## 20. Final Component Structure

```text
App
├── Sidebar
│   ├── Logo
│   ├── Navigation
│   ├── OfficeHoursCard
│   └── UserCard
├── Header
│   ├── Greeting
│   ├── LiveStatus
│   ├── OfficeHoursStatus
│   ├── CurrentTime
│   └── UserActions
├── Dashboard
│   ├── OfficeFloorOverview
│   ├── KPICards
│   │   ├── TotalPowerCard
│   │   ├── DevicesOnCard
│   │   ├── TodayEnergyCard
│   │   └── ActiveAlertsCard
│   ├── PowerTrendChart
│   ├── RoomSummary
│   ├── LiveDeviceStatus
│   ├── ActiveAlerts
│   ├── DiscordBotCommands
│   └── SimulationControls
└── FooterStatusBar
```

---

## 21. Final Design Goal

The completed dashboard should feel:

- Minimal
- Premium
- Calm
- Technical
- Easy to understand
- Visually impressive during the demo
- Correct according to the hackathon requirements
- Spacious rather than cluttered

The final design must closely follow the approved dark glassmorphism concept while always using the correct project structure:

```text
3 Rooms
6 Fans
9 Lights
15 Total Devices
```
