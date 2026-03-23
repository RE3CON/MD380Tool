# DMR User Database

The DMR User Database lets your radio display caller ID information - showing the callsign and name of the person transmitting, instead of just their DMR ID number.

## How It Works

When you receive a DMR transmission, your radio shows only the 7-digit DMR ID (e.g., `1234567`). With the database loaded, it will display:

- **Callsign** (e.g., `W1AW`)
- **Name** (e.g., "JOHN SMITH")
- **Location** (City, State)

This is called "Caller ID" or "Talker Alias".

## Updating the Database

### Method 1: Automatic Download (Recommended)

1. Go to **Firmware** tab
2. Scroll to "DMR User Database"
3. Optionally filter by Country/State
4. Click "Download & Flash Database"

The app will:
- Download user data from RadioID.net
- Build the binary database
- Flash it to your radio's SPI Flash

### Method 2: Regional Filter

To save memory space, filter by your region:

- **Country**: e.g., "United States"
- **State/Province**: e.g., "Texas"

This downloads only users in that region.

## How Data is Stored

The database is stored in the **SPI Flash** memory of your radio (not the main firmware).

- **Location**: Address `0x100000` (1MB mark)
- **Size**: Varies by number of users (~2-16MB)
- **Format**: Binary search tree for fast lookup

## Data Source

Data comes from [RadioID.net](https://radioid.net), the official registry for DMR IDs.

Users can update their own information at: https://radioid.net/cgi-bin/database.cgi

## Troubleshooting

### Database Not Showing Names
- Ensure database was flashed successfully
- Try reflash the database
- Check that your radio has patched firmware

### Partial Data
- Some users aren't in the database
- International users may have limited data
- Database may be outdated - refresh regularly

### Memory Full
- Your radio may have only 1MB SPI Flash
- Filter to smaller region
- Delete old database before loading new one

## How Often to Update

- **Casual users**: Every few months
- **Active users**: Monthly
- **Emergency responders**: Weekly

New users register daily, so updating keeps your database current.

## Technical Details

The binary format is a sorted linear array with index pointers:

```
Header (8 bytes):
  - Magic: "DB10" (0x44 0x42 0x31 0x30)
  - User count (4 bytes, little-endian)

Entry (20 bytes each):
  - DMR ID (4 bytes, little-endian)
  - Callsign + Name (16 bytes, ASCII)
```

The patched firmware performs binary search for O(log n) lookup.
