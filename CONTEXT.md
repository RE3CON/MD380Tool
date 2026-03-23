# MD380Tool Development Context

## Project Overview

MD380Tool is a browser-based and Android app for managing Tytera MD380 radios.

**Repository:** https://github.com/RE3CON/MD380Tool

**Live Web App:** https://bright-path-2916.d.kiloapps.io/

## Architecture

### Web App (Next.js)
- `src/lib/md380/usb.ts` - WebUSB protocol implementation
- `src/lib/md380/codeplug.ts` - Binary codeplug parser
- `src/lib/md380/dmrdb.ts` - DMR database generator

### Android App
- Minimal working shell in `android/` folder
- Needs full feature implementation

## USB Protocol (from decompiled Android app)

Key commands:
- `0x91 0x01` - Enter programming mode
- `0x91 0x05` - Exit and reboot
- `0xa2 0x01-07` - State sync commands

VID/PID: 0x0483/0xDF11

## Codeplug Format

- Size: 262,709 bytes (fixed)
- Channel: 64 bytes × 1000 channels
- BCD frequency encoding (reversed bytes)

## Supported Radios

- Tytera MD-380 / MD-380G
- Tytera MD-390 / MD-390G
- Retevis RT3 / RT8

## Current Status

- Web app: Functional UI with tabs
- Android app: Minimal shell compiling
- USB/DFU code: Needs implementation in Android

## Key Files

- Web: `/src/app/page.tsx` - Main UI
- Android: `/android/app/src/main/AndroidManifest.xml`
- GitHub Actions: `/.github/workflows/`

## Links

- Original md380tools: https://github.com/travisgoodspeed/md380tools
- RadioID API: https://radioid.net/api/users
