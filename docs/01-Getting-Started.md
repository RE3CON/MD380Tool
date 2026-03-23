# Getting Started with MD380 Web Tools

Welcome to MD380 Web Tools! This guide will help you get up and running with flashing your MD380 radio from your browser.

## What You Need

### Hardware
- Tytera MD-380, MD-380G, MD-390, or MD-390G radio
- Retevis RT3 or RT8 radio
- USB cable (data-capable, not charge-only)

### Software
- Chrome, Edge, or any Chromium-based browser
- WebUSB support (not available in Firefox or Safari)

## Quick Start Guide

### Step 1: Connect Your Radio

1. Power off your radio
2. Press and hold the PTT button while turning on the radio
3. The display should show "PC Program USB Mode"
4. Connect the radio to your computer/phone via USB

### Step 2: Open the Web App

1. Visit [https://bright-path-2916.d.kiloapps.io/](https://bright-path-2916.d.kiloapps.io/)
2. Click "Connect to Radio"
3. Select your radio from the device list

### Step 3: Read Your Codeplug

1. Go to the **Codeplug** tab
2. Click "Read from Radio"
3. Wait for the read to complete
4. Your codeplug data will be displayed

### Step 4: Make Changes

Navigate through the tabs to view/edit:
- **Channels** - Add or modify radio channels
- **Contacts** - Manage DMR contacts
- **Zones** - Organize channels into zones

### Step 5: Write Changes

1. Click "Write to Radio" in the Codeplug tab
2. Wait for the write to complete
3. Your radio is now updated!

## Installing as an App (PWA)

On mobile devices, you can install this as a native-like app:

### Android (Chrome)
1. Tap the three dots menu
2. Select "Install App" or "Add to Home Screen"

### iOS (Safari)
1. Tap the share button
2. Select "Add to Home Screen"

## Troubleshooting

### Radio Not Detected
- Make sure you're in "PC Program USB Mode"
- Try a different USB cable (some are charge-only)
- Try a different USB port

### Connection Errors
- Close other apps that might be using the radio
- Disconnect and reconnect the radio
- Refresh the page

### Write Failures
- Ensure radio battery is fully charged
- Don't disconnect during the write process

## Next Steps

- [Flashing Firmware](./02-Firmware-Flashing.md)
- [Using Patches](./03-Patches.md)
- [DMR Database](./04-DMR-Database.md)
