# GEMINI.md

## Project Overview

This is a browser extension that functions as an "Area Calculator". It allows users to draw a shape on a canvas, and then calculates the area of that shape. Based on the calculated area and user-inputted tile dimensions, it determines the number of tiles and packs of tiles needed to cover the area.

The main technologies used are HTML, CSS, and JavaScript. The core logic is implemented in `extension/popup-main.js`.

## Building and Running

This project is a browser extension and doesn't have a typical build process. To run the extension, you need to load it into your browser in developer mode.

**Chrome / Edge / Brave:**

1.  Open `chrome://extensions/`.
2.  Enable "Developer mode".
3.  Click "Load unpacked".
4.  Select the `extension` directory.

**Firefox:**

1.  Open `about:debugging#/runtime/this-firefox`.
2.  Click "Load Temporary Add-on".
3.  Select the `extension/manifest.json` file.

## Development Conventions

- The core logic for the extension is contained within `extension/popup-main.js`.
- The UI is defined in `extension/popup.html`.
- The manifest file (`extension/manifest.json`) is the entry point for the extension.
- The project does not currently have any automated tests.

## Project Overview

Area Calculator is a browser extension that helps users calculate how many tile packs they need by drawing shapes on a canvas. Users click points to create polygons, close the shape, and the extension calculates the area using the shoelace formula, then determines tile requirements based on tile dimensions and pack sizes.

## Architecture

### Browser Extension Structure

This is a Manifest V3 Chrome/Edge extension with a simple architecture:

- **manifest.json**: Extension configuration (permissions: storage, activeTab, scripting, windows)
- **popup.html**: Extension popup interface with canvas and input controls
- **popup-main.js**: Main application logic (canvas drawing, area calculation, tile calculations)
- **background.js**: Service worker (currently minimal/empty)
- **styles.css**: Extension styling

### Key Technical Components

**Canvas Drawing System** (popup-main.js:16-48):

- Click-based polygon drawing
- Points stored as `{x, y}` coordinates
- Real-time canvas redrawing on each point addition
- Visual feedback with blue lines (#007bff) and red points (#dc3545)

**Area Calculation** (popup-main.js:73-80):

- Uses shoelace formula for polygon area calculation
- Formula: `sum(p1.x * p2.y - p2.x * p1.y) / 2` for all adjacent point pairs
- Assumes 1 pixel = 1 cm (simplification for demo purposes)

**Tile Calculation Logic** (popup-main.js:89-111):

- Takes tile dimensions (width × height in cm) and tiles per pack
- Calculates: `tilesNeeded = ceil(areaInCm² / tileArea)`
- Calculates: `packsNeeded = ceil(tilesNeeded / tilesPerPack)`

## Development Commands

Since this is a browser extension without a build process, there are no build commands. Development workflow:

### Loading the Extension

**Chrome/Edge/Brave:**

```
1. Navigate to chrome://extensions/
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the extension/ folder
```

**Firefox:**

```
1. Navigate to about:debugging#/runtime/this-firefox
2. Click "Load Temporary Add-on"
3. Select extension/manifest.json
```

### Testing Changes

After modifying code:

1. Save your changes
2. Click the reload icon on chrome://extensions/ for the Area Calculator extension
3. Close and reopen the extension popup to see changes

## Important Notes

### Coordinate System

The extension currently uses a simplified 1:1 pixel-to-centimeter mapping (popup-main.js:82-84, 104-105). This is a placeholder implementation. In a real-world scenario, you would need to establish a proper scale or allow users to define it.

## AI Assistant Guidelines

### Code Quality

- **No hallucinations**: If uncertain, explicitly state "I don't know" rather than guessing
- **Simplicity first**: This is a small project - prefer simple solutions over complex architectures
- **Avoid over-engineering**: No enterprise patterns, unnecessary abstractions, or premature optimization

### Documentation

- Update GEMINI.md only when making significant architectural changes
- Keep documentation changes minimal and focused

### Token Management

- Provide warning when approaching token limits
- Prefer concise solutions to minimize token usage

### Communication Style

- Be concise - avoid verbose explanations unless explicitly requested
- Show code first, explain only when necessary
- Skip confirmations like "Sure, I'll help you..." - just do the task
- Avoid repeating what the user already said

### File Operations

- Read files only when necessary for the current task
- Avoid re-reading files you've already seen in the conversation
- Use targeted line ranges (offset/limit) for large files
- Trust existing code - don't read files just to verify they exist

### Tool Usage

- Combine related changes in single Edit call when possible
- Use parallel tool calls for independent operations
- Avoid redundant tool calls (e.g., reading same file twice)

### Response Format

- Use Ukrainian language as requested
- Minimal commentary during task execution
- Report results briefly - user can see the changes in git diff
- Skip phrases like "Ось що я зробив:", "Як бачите:" - just state facts

### Communication Style

- Be concise - avoid verbose explanations unless explicitly requested
- Show code first, explain only when necessary
- Skip confirmations and pleasantries - execute tasks directly
- Avoid repeating information the user already provided
- Use Ukrainian language
