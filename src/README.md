# Gaming League Dashboard

A mobile-first dashboard interface for competitive gaming leagues with widget-based layout, real-time match lobbies, and interactive league management features.

![Dashboard Preview](https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop)

## Features

### 🏆 League Overview Widget
- User profile display with avatar and username
- Current week number and standings position
- Upcoming match information
- Payment status tracking with color-coded indicators
  - Green: Paid up
  - Yellow: Payment due soon
  - Red: Payment overdue (clickable to open payment modal)
- Format rules section with expandable tooltips

### 📅 Schedule Section
- Always-expanded view of upcoming matches
- Match details including date, time, and opponent
- Visual status indicators for each match
- Mobile-optimized touch-friendly interface

### 📊 Standings Drawer
- Slide-out drawer from the right side
- Higher z-index overlay design
- Complete league standings with rankings
- Win/loss records and points
- Smooth animation transitions

### 🎮 Match Lobby System
- Automatic lobby activation 5 minutes before scheduled matches
- Real-time countdown timer
- Two-player lobby display with avatars
- "Ready in Lobby" button (appears at 2 minutes)
- Game-by-game win/loss reporting interface
- Dual confirmation score submission system
- Automatic admin flagging for score disputes
- Best-of-3 match format support

### 💬 Messaging System
- In-dashboard chat interface
- Support for chat commands:
  - `/forfeit` - Forfeit current match
  - `/help` - Display available commands
  - `/stats` - Show player statistics
- Message history with timestamps
- Admin message indicators

### ℹ️ Info Modal
- Comprehensive dashboard tutorial
- Feature explanations
- Usage instructions
- Keyboard shortcuts and tips

## Tech Stack

- **React** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling and responsive design
- **Lucide React** - Icon library
- **Motion/React** - Animations and transitions

## Project Structure

```
├── App.tsx                          # Main application component
├── components/
│   ├── SidebarDemo.tsx             # Main dashboard with widgets
│   ├── MatchLobbyWidget.tsx        # Match lobby system
│   └── figma/
│       └── ImageWithFallback.tsx   # Image component with fallback
└── styles/
    └── globals.css                  # Global styles and design tokens
```

## Installation

1. Clone the repository:
```bash
git clone https://github.com/YOUR-USERNAME/gaming-league-dashboard.git
cd gaming-league-dashboard
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:5173](http://localhost:5173) in your browser

## Usage

### Navigation
- **Overview**: Static widget showing your league information
- **Schedule**: Tap to view all upcoming matches
- **Standings**: Tap to slide out the full standings drawer

### Match Lobby
- Lobby automatically appears 5 minutes before your scheduled match
- Click "Ready in Lobby" when you're prepared to play (available at 2 minutes)
- Report game results after each game in the match
- Both players must confirm the same score or it will be flagged for admin review

### Payment Status
- Click on yellow or red payment indicators to open the payment modal
- Complete payment to update your status

### Messaging
- Use the chat interface to communicate
- Type `/help` to see available commands
- Type `/forfeit` to forfeit a match (requires confirmation)

### Format Rules
- Click on format headers in the Overview section to view detailed rules
- Click outside or on the header again to close tooltips

## Mobile-First Design

This dashboard is optimized for mobile devices with:
- Touch-friendly button sizes
- Responsive flexbox layout
- Slide-out drawers instead of sidebars
- Optimized spacing for small screens
- Portrait and landscape orientation support

## Key Features Implementation

### Score Dispute System
When players submit different scores:
1. System detects mismatch
2. Match is automatically flagged
3. Admin notification is sent
4. Players see "Score under review" status

### Forfeit Protection
- Requires confirmation dialog
- Cannot be undone
- Updates standings immediately
- Notifies opponent

### Real-time Countdown
- Displays time until match start
- Updates every second
- Visual urgency indicators
- Auto-dismisses after match time

## Future Enhancements

- [ ] Backend integration with real-time database
- [ ] Push notifications for match reminders
- [ ] Video streaming integration
- [ ] Tournament bracket visualization
- [ ] Player statistics and history
- [ ] Social features and team chat
- [ ] Replay review system
- [ ] Achievement and badge system

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - feel free to use this project for your own gaming leagues!

## Contact

For questions or support, please open an issue on GitHub.

---

Built with ⚡ for competitive gamers
