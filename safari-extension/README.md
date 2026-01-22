# Freedmind AI Caddy - Safari Extension (iOS & Mac)

The Caddy floats on ANY website in Safari as a transparent overlay.

## Installation (Requires Xcode)

Safari extensions require wrapping in an Xcode project. Here's how:

### Option 1: Convert from Chrome Extension

1. Open Xcode on your Mac
2. Go to **File > New > Project**
3. Choose **Safari Extension App**
4. Name it "Freedmind Caddy"
5. Replace the generated extension files with:
   - `manifest.json`
   - `content.js`
   - `overlay.css`
6. Build and run on your device

### Option 2: Use Safari Web Extension Converter

1. Install Xcode Command Line Tools
2. Run in terminal:
   ```
   xcrun safari-web-extension-converter /path/to/safari-extension
   ```
3. Open the generated Xcode project
4. Build for iOS or macOS
5. Install on your device

## Enabling on iPhone

1. Go to **Settings > Safari > Extensions**
2. Enable **Freedmind AI Caddy**
3. Allow on **All Websites**

## How to Use

1. Open Safari and go to any offer wall
2. Copy a game name
3. Tap the faded Caddy icon (bottom-right)
4. Get instant intel and custom EV calculations

## Note

iOS clipboard access may require additional permissions. The extension will prompt you when needed.
