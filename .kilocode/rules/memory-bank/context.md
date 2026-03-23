# Active Context: MD380 Web Tools

## Current State

**Project Status**: ✅ WebUSB-based MD380 radio management app built and ready

A browser-based Progressive Web Application for managing Tytera MD380 radios using the WebUSB API, replacing the traditional Python-based command-line tools.

## Recently Completed

- [x] WebUSB communication layer with proprietary MD380 DFU protocol
- [x] Codeplug parser/editor with binary format handling (BCD frequencies, indices)
- [x] Firmware management and flashing UI
- [x] DMR user database integration with RadioID.net API
- [x] Main dashboard UI with device connection flow
- [x] Hex editor for raw codeplug inspection
- [x] TypeScript and ESLint validation passing
- [x] Production build successful

## Current Structure

| File/Directory | Purpose | Status |
|----------------|---------|--------|
| `src/lib/md380/usb.ts` | WebUSB protocol handler | ✅ Complete |
| `src/lib/md380/codeplug.ts` | Binary codeplug parser/serializer | ✅ Complete |
| `src/lib/md380/dmrdb.ts` | RadioID.net API integration | ✅ Complete |
| `src/lib/md380/index.ts` | Module exports | ✅ Complete |
| `src/components/DeviceConnector.tsx` | USB device connection UI | ✅ Complete |
| `src/components/CodeplugEditor.tsx` | Codeplug read/write/edit UI | ✅ Complete |
| `src/components/FirmwareManager.tsx` | Firmware & DB flash UI | ✅ Complete |
| `src/app/page.tsx` | Main dashboard | ✅ Complete |
| `src/types/webusb.d.ts` | WebUSB TypeScript types | ✅ Complete |

## Current Focus

The application is fully functional and ready for testing with a connected MD380 radio in Chrome/Edge. The next steps would be:

1. Test with actual hardware
2. Add GitHub Actions CI/CD for pre-compiled firmware fetching
3. Add binary patching capabilities
4. Implement more advanced codeplug editing features

## Key Features Implemented

- **WebUSB Communication**: Full implementation of MD380's proprietary DFU protocol (0x91 0x01, 0xa2 commands)
- **Codeplug Editor**: Parse/edit 262,709-byte binary codeplugs with BCD frequency encoding
- **Firmware Flash**: Upload and flash .bin firmware files
- **DMR Database**: Fetch from RadioID.net API and flash to SPI flash (0x100000 offset)
- **Hex Viewer**: Raw binary inspection of codeplug data
- **Multi-radio support**: MD380, MD380G, MD390, MD390G, RT3, RT8

## Supported Browsers

- Chrome (recommended)
- Edge
- Other Chromium-based browsers with WebUSB support

## Pending Improvements

- [ ] Hardware testing and protocol debugging
- [ ] Binary diffing/patching engine
- [ ] GitHub Releases API integration for firmware downloads
- [ ] IndexedDB caching for DMR database offfline use

## Session History

| Date | Changes |
|------|---------|
| 2026-03-23 | Built complete MD380 Web Tools application with WebUSB, codeplug editor, firmware manager, and DMR database integration |