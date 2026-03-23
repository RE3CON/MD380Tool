# Open Development Tasks for MD380Tool

This document tracks open tasks for the MD380Tool Android app development.

---

## Task 1: USB DFU Implementation

**Priority:** High
**Status:** Open

Implement USB device connection and firmware flashing:

- Connect to MD380 radio via USB OTG
- Enter programming mode (0x91 0x01 command)
- Read codeplug (262KB)
- Write codeplug
- Flash firmware

**Reference:** See `src/lib/md380/usb.ts` in web app for protocol details.

---

## Task 2: Codeplug Editor

**Priority:** High
**Status:** Open

Implement configuration editor:

- Parse 262,709 byte codeplug binary
- Edit channels (64 bytes each)
- Edit contacts and talkgroups
- Edit zones and RX groups
- BCD frequency encoding/decoding

---

## Task 3: DMR Database Integration

**Priority:** Medium
**Status:** Open

Add caller ID database:

- Query RadioID.net API
- Filter by country/state
- Build binary search tree
- Flash to SPI Flash at 0x100000

---

## Task 4: UI Improvements

**Priority:** Medium
**Status:** Open

Current UI is minimal. Needs:

- Material Design interface
- Navigation drawer
- Progress indicators
- Error handling UI

---

## Contributing

1. Pick an open task
2. Create a branch: `git checkout -b feature/task-name`
3. Implement and test
4. Submit PR

---

Last updated: 2026-03-23
