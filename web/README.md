# MemeWars Frontend

Giao diện web cho MemeWars - Thị Trường Dự Đoán Không Mất Vốn.

## 🚀 Quick Start

### 1. Cài đặt dependencies

```bash
cd web
npm install
```

### 2. Cấu hình environment

Tạo file `.env.local`:

```env
# Network: mainnet-beta hoặc devnet
NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta

# RPC Endpoint (optional, khuyến khích dùng RPC nhanh)
# NEXT_PUBLIC_RPC_ENDPOINT=https://rpc.helius.xyz/?api-key=YOUR_KEY

# Program ID
NEXT_PUBLIC_PROGRAM_ID=Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS
```

### 3. Chạy development server

```bash
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000) để xem kết quả.

## 📁 Cấu trúc thư mục

```
web/
├── src/
│   ├── app/                 # Next.js App Router pages
│   │   ├── page.tsx         # Trang chủ - Battle Arena
│   │   ├── history/         # Lịch sử battles
│   │   └── leaderboard/     # Bảng xếp hạng
│   ├── components/          # React components
│   │   ├── WalletProvider   # Solana wallet integration
│   │   ├── Header           # Navigation header
│   │   ├── BattleCard       # Card hiển thị battle
│   │   └── DepositModal     # Modal deposit SOL
│   ├── hooks/               # Custom React hooks
│   │   └── useProgram       # Hook tương tác với smart contract
│   └── lib/                 # Utilities & constants
│       └── program          # Program addresses & PDAs
├── public/                  # Static assets
└── tailwind.config.ts       # Tailwind CSS config
```

## 🎨 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS với custom theme
- **Animation**: Framer Motion
- **Wallet**: Solana Wallet Adapter
- **Icons**: Lucide React

## 🎮 Features

### ✅ Đã hoàn thành

- [x] **Battle Arena**: Hiển thị các cuộc chiến đang diễn ra
- [x] **Team Selection**: Chọn phe (Token A vs Token B)
- [x] **Deposit Flow**: Form nạp SOL và xác nhận giao dịch
- [x] **TVL Display**: Hiển thị tổng giá trị đã stake
- [x] **Countdown Timer**: Đếm ngược thời gian kết thúc
- [x] **Wallet Integration**: Kết nối ví Phantom, Solflare, etc.
- [x] **History Page**: Xem lịch sử các battles đã tham gia
- [x] **Leaderboard**: Bảng xếp hạng người chơi
- [x] **Responsive Design**: Giao diện mobile-friendly
- [x] **Neon Cyber Theme**: Theme gaming đẹp mắt

### 🔄 Đang phát triển

- [ ] **Real-time Data**: Fetch dữ liệu thực từ blockchain
- [ ] **Claim Rewards**: Logic claim thưởng
- [ ] **Price Feed**: Tích hợp Pyth Oracle
- [ ] **Notifications**: Thông báo khi battle kết thúc

## 🎨 Design System

### Colors

- **Primary**: Magenta (#FF00FF) - Chủ đạo
- **Secondary**: Cyan (#00FFFF) - Accent
- **Accent**: Gold (#FFD700) - Highlights
- **BONK**: Orange (#F7931A) - Team A
- **WIF**: Purple (#8B5CF6) - Team B

### Components

```tsx
// Buttons
<button className="btn-primary">Primary</button>
<button className="btn-secondary">Secondary</button>
<button className="btn-accent">Accent</button>
<button className="btn-outline">Outline</button>

// Cards
<div className="glass">Glass card</div>
<div className="glass-primary">Primary glass</div>
<div className="glass-secondary">Secondary glass</div>

// Text
<span className="text-gradient">Gradient text</span>
<span className="glow-text">Glowing text</span>
```

## 🔧 Development

### Scripts

```bash
npm run dev      # Start dev server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_SOLANA_NETWORK` | Solana network | `mainnet-beta` |
| `NEXT_PUBLIC_RPC_ENDPOINT` | Custom RPC URL | Public RPC |
| `NEXT_PUBLIC_PROGRAM_ID` | MemeWars program ID | See code |

## 📱 Screenshots

### Battle Arena
- Hiển thị các cuộc chiến memecoin
- Chọn phe và xem TVL
- Countdown timer

### Deposit Flow
- Nhập số lượng SOL
- Xem estimated returns
- Xác nhận giao dịch

### History & Leaderboard
- Xem lịch sử battles
- Claim rewards
- Top warriors ranking

## 🚀 Deployment

### Vercel (Recommended)

```bash
npm install -g vercel
vercel
```

### Manual Build

```bash
npm run build
npm run start
```

## 📚 Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Solana Wallet Adapter](https://github.com/solana-labs/wallet-adapter)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Framer Motion](https://www.framer.com/motion/)

## 🤝 Contributing

1. Fork the repo
2. Create feature branch
3. Commit changes
4. Push to branch
5. Open Pull Request

---

Built with ❤️ for the Solana ecosystem
