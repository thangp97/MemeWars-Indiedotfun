# WSL Setup Guide cho MemeWars

Hướng dẫn setup và test MemeWars trên WSL (Windows Subsystem for Linux).

## 🔧 Prerequisites

### 1. Cài đặt Solana CLI

```bash
# Trong WSL terminal
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"

# Thêm vào PATH (thêm vào ~/.bashrc hoặc ~/.zshrc)
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"

# Reload shell
source ~/.bashrc  # hoặc source ~/.zshrc

# Verify
solana --version
```

### 2. Cài đặt Anchor CLI

```bash
# Cài đặt Rust (nếu chưa có)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env

# Cài đặt Anchor Version Manager (AVM)
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force

# Cài đặt Anchor
avm install latest
avm use latest

# Verify
anchor --version
```

### 3. Cấu hình Solana

```bash
# Set cluster sang devnet
solana config set --url devnet

# Tạo keypair mới (nếu chưa có)
solana-keygen new

# Airdrop SOL cho testing
solana airdrop 2

# Kiểm tra balance
solana balance
```

## 📦 Setup Project

### 1. Cài đặt Dependencies

```bash
npm install
```

### 2. Tạo File .env

```bash
# Sử dụng script bash (cho WSL)
npm run setup:env

# Hoặc manual
cp .env.example .env
```

### 3. Build Program

```bash
# Sử dụng script bash (cho WSL)
npm run build

# Hoặc trực tiếp
anchor build
```

**Lưu ý:** Nếu gặp lỗi về `HOME` environment variable:

```bash
# Set HOME nếu chưa có
export HOME="$HOME"

# Hoặc thêm vào ~/.bashrc
echo 'export HOME="$HOME"' >> ~/.bashrc
source ~/.bashrc
```

## 🧪 Testing

### Test với Marinade Integration

```bash
# Test với Marinade (sẽ tự động build nếu cần)
npm run test:marinade
```

### Test không có Lending

```bash
# Test basic deposit
npm run test:devnet
```

## 🔍 Troubleshooting

### Lỗi: "Cannot find module '../target/types/memewars'"

**Nguyên nhân:** Program chưa được build.

**Giải pháp:**
```bash
npm run build
# hoặc
anchor build
```

### Lỗi: "Cannot find name 'describe'"

**Nguyên nhân:** Thiếu tsconfig.json hoặc types cho mocha.

**Giải pháp:**
- File `tsconfig.json` đã được tạo với cấu hình đúng
- Đảm bảo `@types/mocha` đã được cài: `npm install`

### Lỗi: "powershell: not found"

**Nguyên nhân:** Đang chạy script PowerShell trong WSL.

**Giải pháp:**
- Sử dụng script bash thay vì PowerShell:
  - `npm run setup:env` (dùng bash script)
  - `npm run build` (dùng bash script)
- Hoặc dùng script Windows: `npm run setup:env:windows` (chỉ khi chạy từ PowerShell)

### Lỗi: "Can't get home directory path"

**Nguyên nhân:** Environment variable `HOME` chưa được set.

**Giải pháp:**
```bash
export HOME="$HOME"
# Hoặc
export HOME="$HOME/.config"
```

### Lỗi: "solana: command not found"

**Nguyên nhân:** Solana CLI chưa được thêm vào PATH.

**Giải pháp:**
```bash
# Tìm đường dẫn Solana
ls -la ~/.local/share/solana/install/active_release/bin/

# Thêm vào PATH
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"

# Thêm vào ~/.bashrc để persistent
echo 'export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

### Lỗi: "anchor: command not found"

**Nguyên nhân:** Anchor CLI chưa được cài hoặc chưa trong PATH.

**Giải pháp:**
```bash
# Cài đặt lại Anchor
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install latest
avm use latest

# Verify
anchor --version
```

## 📝 Scripts Available

### WSL/Linux Scripts (Khuyến nghị)

- `npm run setup:env` - Tạo .env file (bash)
- `npm run build` - Build program (bash)
- `npm run test:marinade` - Test với Marinade
- `npm run get-marinade` - Lấy Marinade addresses

### Windows Scripts (Chỉ khi dùng PowerShell)

- `npm run setup:env:windows` - Tạo .env file (PowerShell)
- `npm run build:windows` - Build program (PowerShell)

## 🚀 Quick Start

```bash
# 1. Setup environment
npm run setup:env

# 2. Build program
npm run build

# 3. Test với Marinade
npm run test:marinade
```

## 📚 More Resources

- **Quick Test Guide:** `QUICK_TEST_MARINADE.md`
- **Marinade Testing:** `MARINADE_TESTING_GUIDE.md`
- **Devnet Testing:** `DEVNET_TESTING_GUIDE.md`

---

**Chúc bạn test thành công trên WSL! 🎉**

