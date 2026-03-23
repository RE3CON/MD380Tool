# MD380 Web Tools

A browser-based firmware and codeplug management tool for Tytera MD380 radios and equivalents, powered by WebUSB.

**🚀 Live Demo (Primary):** [https://bright-path-2916.d.kiloapps.io/](https://bright-path-2916.d.kiloapps.io/)

**📦 GitHub Pages (Mirror):** [https://re3con.github.io/MD380Tool/](https://re3con.github.io/MD380Tool/)

## Supported Radios

| Model | GPS | Vocoder | Firmware |
|-------|-----|---------|----------|
| Tytera MD-380 | No | Old/New | D02, D13 |
| Tytera MD-380G | Yes | New | S13 |
| Tytera MD-390 | No | New | D02, D13 |
| Tytera MD-390G | Yes | New | S13 |
| Retevis RT3 | No | Old/New | D02, D13 |
| Retevis RT8 | Yes | New | S13 |

## Features

### 🔌 USB Connection
- Direct browser-to-radio communication via WebUSB
- No drivers required (Chrome, Edge, Chromium-based browsers)
- Automatic device detection and firmware version identification

### 📟 Codeplug Management
- Read/write configuration binary (262,709 bytes)
- Parse channel, contact, zone, and RX group data
- BCD frequency encoding/decoding
- Virtualized list rendering for large codeplugs

### 💾 Firmware Operations
- Flash custom patched firmware
- Read raw firmware from radio
- SPI Flash memory access for database updates

### 📡 DMR Database
- Query RadioID.net API for user callsigns
- Flash global DMR ID database to SPI Flash
- Regional filtering to save memory

### 🔧 Advanced
- Hex viewer for raw binary inspection
- Promiscuous mode configuration
- USB logging (dmesg-style)
- Real-time packet capture

## Technical Architecture

### WebUSB Protocol

The MD380 uses a non-standard DFU protocol. Key commands:

| Command | Description |
|---------|-------------|
| `0x91 0x01` | Enter programming mode |
| `0xa2 0x01` | Get hardware IDs |
| `0xa2 0x02` | Read sync |
| `0xa2 0x03` | Generic sync |
| `0xa2 0x31` | Firmware flash staging |
| `0x91 0x31` | Firmware flash execute |
| `0x91 0x05` | Exit programming mode |

### Codeplug Format

- **Size:** 262,709 bytes (fixed)
- **Channel:** 64 bytes × 1000 channels
- **BCD Encoding:** Reversed byte order for frequencies
- **Indices:** Relational pointers between tables

### Dependencies

Built with:
- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- WebUSB API

## Getting Started

### Local Development

```bash
npm install
npm run dev
```

### Build for Production

```bash
npm run build
npm start
```

### Deployment

Deploy to any Next.js hosting:
- Vercel
- Netlify
- KiloApps
- Self-hosted

## Usage

1. Connect your MD380 radio via USB
2. Press and hold the radio's PTT button while turning on
3. Select "PC Program USB Mode" on the radio display
4. Click "Connect Device" in the web interface
5. Read, edit, or flash as needed

## Browser Compatibility

- Google Chrome (recommended)
- Microsoft Edge
- Opera
- Brave

Firefox and Safari do not support WebUSB.

## Security Considerations

- 🔒 Content Security Policy enforced
- ✅ Firmware SHA-256 hash verification before flashing
- 🔑 Device access requires explicit user permission
- 🚫 No data leaves your browser except to the connected radio

## Credits

Based on the md380tools project by Travis Goodspeed:
- https://github.com/travisgoodspeed/md380tools

Original research and protocol documentation by the DMR hacking community.

## License

GPL-3.0 - Same as md380tools project
