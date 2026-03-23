# Using Patches

MD380Tools patches add powerful features to your radio that aren't available in the stock firmware.

## ⚠️ Important Prerequisites

**Patches only work with PATCHED firmware!**

You must first flash patched firmware before enabling patches. See [Firmware Flashing Guide](./02-Firmware-Flashing.md).

## Available Patches

### Network Patches

#### Promiscuous Mode
**Purpose:** Receive DMR traffic from ANY talkgroup, not just your own.

**Use Case:** Monitoring multiple talkgroups, scanning, listening to emergency traffic.

**Note:** Only use on frequencies you have permission to monitor.

#### Call Log
**Purpose:** Automatically log received and transmitted calls with timestamps.

**Use Case:** Keep track of who you've contacted, review missed calls.

#### SMS Support
**Purpose:** Send and receive SMS messages over DMR.

**Use Case:** Text communication without internet.

#### Auto Patch
**Purpose:** Automatically connect to DMR repeater internet gateway (DMR+).

**Use Case:** Connect to reflectors for extended reach.

---

### Display Patches

#### Network Monitor (Netmon)
**Purpose:** Display network statistics on the radio screen.

**Show:**
- Current talkgroup
- Signal strength
- Network latency
- Color code

#### Boot Message
**Purpose:** Custom message displayed when radio starts.

**Customize:** Your callsign, club name, or any message.

#### Ham Logo
**Purpose:** Display a custom logo on the radio screen.

**Format:** BMP image, specific dimensions.

#### Extended Menu
**Purpose:** Access additional menu options for advanced configuration.

**Includes:** Hidden factory settings, calibration options.

---

### Experimental Patches

#### GPS Spoofing
**Purpose:** Override GPS coordinates (for testing).

**Warning:** Use responsibly. Never spoof for illegal purposes.

#### Disable Encryption
**Purpose:** Attempt to decode encrypted channels.

**Note:** May not work with all encryption types. Legal restrictions apply.

---

## Enabling Patches

1. Connect your radio
2. Go to the **Patches** tab
3. Find the patch you want
4. Click "Enable"
5. Write the codeplug to your radio

## Disabling Patches

1. Go to the **Patches** tab
2. Find the enabled patch
3. Click "Disable"
4. Write the codeplug to your radio

## Patch Compatibility

| Patch | MD-380 | MD-380G | MD-390 | MD-390G |
|-------|--------|---------|--------|----------|
| Promiscuous | ✅ | ✅ | ✅ | ✅ |
| Netmon | ✅ | ✅ | ✅ | ✅ |
| Call Log | ✅ | ✅ | ✅ | ✅ |
| SMS | ✅ | ✅ | ✅ | ✅ |
| Boot Message | ✅ | ✅ | ✅ | ✅ |
| GPS Spoofing | ❌ | ✅ | ❌ | ✅ |

## Troubleshooting

### Patches Not Working
- Verify patched firmware is installed
- Ensure patch is enabled in codeplug
- Write codeplug after enabling patch

### Radio Behavior Odd
- Try disabling patches one at a time
- Reflash firmware if problems persist
