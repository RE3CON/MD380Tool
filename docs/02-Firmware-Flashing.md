# Firmware Flashing Guide

This guide explains how to flash firmware on your MD380 radio using the web interface.

## ⚠️ Warning

Flashing firmware can brick your radio if done incorrectly. Always:
- Backup your current firmware first
- Use the correct firmware for your radio model
- Ensure your radio battery is fully charged
- Don't disconnect during the flashing process

## Supported Radio Models

| Model | Firmware Type | Notes |
|-------|--------------|-------|
| MD-380 (non-GPS) | D02, D13 | Most common |
| MD-380G (GPS) | S13 | GPS variant |
| MD-390 (non-GPS) | D02, D13 | Newer variant |
| MD-390G (GPS) | S13 | GPS variant |
| Retevis RT3 | D02, D13 | Rebranded MD-380 |
| Retevis RT8 | S13 | Rebranded MD-390G |

## Flashing Methods

### Method 1: Quick Flash (Easiest)

1. Go to the **Firmware** tab
2. Under "Quick Flash", select a firmware version
3. Click the button to download and flash

### Method 2: Flash from URL

1. Get a direct link to a firmware `.bin` file
2. Go to **Firmware** → "Flash from URL"
3. Paste the URL
4. Click "Flash"

### Method 3: Flash from Device

1. Download firmware to your phone/computer
2. Go to **Firmware** → "Flash from Device"
3. Tap "Select Firmware File"
4. Choose your `.bin` file
5. Confirm flashing

### Method 4: Backup Current Firmware

1. Connect your radio
2. Go to **Firmware** → "Backup Firmware"
3. Click "Backup Firmware from Radio"
4. Save the downloaded `.bin` file safely

## Firmware Sources

### Official md380tools
- Latest patched: [GitHub Releases](https://github.com/travisgoodspeed/md380tools/releases)
- Pre-built binaries available

### Building Custom Firmware

For advanced users who want to build from source:

```bash
# Clone the repository
git clone https://github.com/travisgoodspeed/md380tools.git
cd md380tools

# Install dependencies
sudo apt-get install gcc-arm-none-eabi libnewlib-arm-none-eabi

# Build
make clean
make patch-D13
make
```

## Troubleshooting

### "Device Not Found"
- Ensure radio is in programming mode
- Try a different USB cable
- Check USB debugging settings on your device

### "Flash Failed"
- Battery too low (charge first)
- Firmware file corrupted (re-download)
- Wrong firmware for your radio model

### Radio Bricked
Don't panic! The MD380 has a recovery mode:

1. Disconnect USB
2. Hold PTT + Channel Up + Power
3. Connect USB while holding
4. Flash stock firmware via DFU mode
