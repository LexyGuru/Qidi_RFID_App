# RFID Tag Guide for QIDI BOX

A modern desktop application providing comprehensive documentation and reference for RFID tags used in QIDI BOX 3D printers. Built with Rust and Tauri for optimal performance and cross-platform compatibility.

## Features

- **RFID Chip Read/Write**: Direct communication with MIFARE Classic chips via PC/SC compatible RFID readers
  - Read chip data (material code, color code, manufacturer code, UID)
  - Write chip data with validation
  - Real-time reader status monitoring
- **Technical Specifications**: Complete documentation of the FM11RF08S chip RF interface
- **Material Codes**: Reference guide for all 50 material codes (PLA, ABS, PETG, TPU, etc.)
- **Color Codes**: Visual color reference with RGB hex codes for all 24 supported colors
- **Memory Structure**: Visual representation of the EEPROM memory layout
- **Search Functionality**: Quick search through materials and colors
- **Multi-language Support**: Dynamic language detection and switching
  - Hungarian (hu), English (en), German (de)
  - Easily extensible - just add new language JSON files
  - Language preference saved in localStorage
- **Modern UI**: Clean, responsive interface with smooth animations
  - Custom dropdown components with fixed-height scrollable lists
  - Color preview for selected colors
  - Real-time status updates

## Technical Details

### FM11RF08S Chip Specifications

- **Communication Protocol**: ISO/IEC 14443-A
- **Operating Frequency**: 13.56 MHz
- **Communication Baud Rate**: 106 Kbit/s
- **Operating Distance**: Not less than 100 mm (dependent on antenna size)
- **Encryption Algorithm**: Compliant with M1 standard

### Memory Structure

- **16 sectors**, each with **4 data blocks**
- Each block contains **16 bytes**
- RFID data stored in **Sector 1, Block 0** (4th data block)

### Data Format

- **bit[0]**: Material Code (1~50)
- **bit[1]**: Color Code (1~24)
- **bit[2]**: Manufacturer Code (Default: 1)
- **Encoding**: Hexadecimal

## Installation

### Prerequisites

- [Rust](https://www.rust-lang.org/tools/install) (latest stable version)
- [Node.js](https://nodejs.org/) (v16 or later)
- System dependencies for Tauri (see [Tauri documentation](https://tauri.app/v1/guides/getting-started/prerequisites))
- PC/SC library (for RFID reader support):
  - **macOS**: Built-in (no installation needed)
  - **Linux**: `libpcsclite-dev` (Ubuntu/Debian) or `pcsc-lite-devel` (Fedora)
  - **Windows**: Built-in (no installation needed)

### Build from Source

1. Clone the repository:
```bash
git clone https://github.com/LexyGuru/Qidi_RFID_App.git
cd Qidi_RFID_App
```

2. Install dependencies:
```bash
npm install
```

3. Run in development mode:
```bash
npm run dev
```

4. Build for production:
```bash
npm run build
```

The built application will be in `src-tauri/target/release/` (or `src-tauri/target/release/bundle/` for installers).

## Usage

1. Launch the application
2. **Select Language**: Use the language selector (🌐) in the top-right corner to switch between available languages
3. Navigate between tabs:
   - **Chip Read/Write**: Read and write RFID chip data
     - Check reader status
     - Read chip data (material, color, manufacturer codes, UID)
     - Write chip data by selecting material and color codes
   - **Technical Specs**: View chip specifications and memory structure
   - **Material Codes**: Browse all 50 material types with codes
   - **Color Codes**: View color swatches with hex codes
   - **Memory Structure**: Visual representation of EEPROM layout
4. Use the search boxes to quickly find specific materials or colors

### RFID Reader Requirements

- PC/SC compatible RFID reader (e.g., ACR122U, PN532, etc.)
- MIFARE Classic compatible RFID cards/chips
- Reader drivers installed on your system

## Project Structure

```
Qidi_RFID_App/
├── src/                    # Frontend (HTML/CSS/JS)
│   ├── index.html
│   ├── styles.css
│   ├── main.js
│   ├── i18n.js            # Internationalization system
│   └── language/           # Language files
│       ├── hu.json         # Hungarian translations
│       ├── en.json         # English translations
│       └── de.json         # German translations
├── src-tauri/              # Rust backend
│   ├── src/
│   │   └── main.rs         # Main Rust code with PC/SC integration
│   ├── Cargo.toml
│   ├── build.rs
│   ├── tauri.conf.json
│   └── icons/              # Application icons
├── .github/
│   └── workflows/          # GitHub Actions workflows
│       ├── build.yml
│       └── release.yml
├── package.json
├── .gitignore
└── README.md
```

### Adding New Languages

To add a new language:

1. Create a new JSON file in `src/language/` (e.g., `fr.json` for French)
2. Copy the structure from an existing language file (e.g., `en.json`)
3. Translate all the text values
4. **Update `src/language/languages.json`** to include the new language code in the `availableLanguages` array:
   ```json
   {
     "availableLanguages": ["hu", "en", "de", "fr"],
     "defaultLanguage": "hu"
   }
   ```
5. The application will verify that the language file exists and display it in the language selector

**Important**: The language system verifies that each configured language file actually exists. Only languages listed in `languages.json` AND having a corresponding `.json` file will be displayed.

## License

MIT License - see LICENSE file for details

## Author

Lekszikov Miklós

## GitHub Actions / CI/CD

A projekt automatikusan buildeli az alkalmazást különböző platformokra GitHub Actions segítségével:

- **Automatikus build**: Minden push és pull request esetén lefut
- **Több platform támogatás**:
  - macOS (Intel és Apple Silicon)
  - Windows
  - Linux (Ubuntu)
- **Release**: Tag létrehozásakor automatikusan készül release különböző platformokra

### Workflow fájlok

- `.github/workflows/build.yml` - Build minden push/PR esetén
- `.github/workflows/release.yml` - Release készítés tag esetén

### Hogyan töltsd le a buildelt fájlokat?

#### 1. **GitHub Actions Artifacts (Build workflow)**
Minden build után a fájlok elérhetők GitHub Actions artifacts-ként:

1. Menj a GitHub repository-ra
2. Kattints a **"Actions"** fülre
3. Válaszd ki a legutóbbi workflow futtatást
4. Görgess le az oldal aljára, ahol az **"Artifacts"** szekcióban megtalálod:
   - `qidi-rfid-guide-macos-latest-aarch64` (macOS Apple Silicon)
   - `qidi-rfid-guide-macos-latest-x64` (macOS Intel)
   - `qidi-rfid-guide-ubuntu-22.04-x64` (Linux)
   - `qidi-rfid-guide-windows-latest-x64` (Windows)
5. Kattints a letöltés gombra a megfelelő platform mellett

**Fontos**: Az artifacts csak **90 napig** elérhetők, ezután törlődnek.

#### 2. **GitHub Releases (Release workflow)**
Hosszabb távú elérhetőséghez hozz létre egy release-t:

1. Hozz létre egy tag-et:
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

2. A release workflow automatikusan lefut és létrehoz egy release-t
3. A fájlok a **Releases** oldalon lesznek elérhetők:
   - Menj a repository-ra → **"Releases"** fül
   - Válaszd ki a legutóbbi release-t
   - Töltsd le a megfelelő platform fájljait

A release-ben lévő fájlok **véglegesen** elérhetők maradnak.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

