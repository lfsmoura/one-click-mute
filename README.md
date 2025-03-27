# Twitter Quick Mute Chrome Extension

A Chrome extension that adds a one-click mute button to tweets on Twitter/X, making it easier to mute users without navigating through menus.

## Features

- Adds a "Quick Mute" button next to the share button on each tweet
- One-click muting with confirmation dialog
- Visual feedback when muting is successful
- Works on both twitter.com and x.com
- Automatically adds buttons to new tweets as you scroll

## Installation

1. Download or clone this repository
2. Open Google Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" in the top-right corner
4. Click "Load unpacked" and select the folder containing these files
5. The extension should now appear in your Chrome toolbar

## Usage

1. Visit Twitter/X and scroll through your timeline
2. Find a tweet from an account you want to mute
3. Click the "Quick Mute" button next to the share button
4. Confirm the mute action in the dialog box
5. The tweet will briefly highlight orange to confirm the mute was successful

## Notes

- The extension requires the following permissions:

  - `scripting`: To inject the content script
  - `activeTab`: To interact with the current tab
  - Host permissions for twitter.com and x.com

- If Twitter/X changes their UI structure, the extension may need updates to continue working properly

## Development

The extension consists of three main files:

- `manifest.json`: Extension configuration
- `content.js`: Core functionality
- `styles.css`: Button styling

## License

MIT License - feel free to use and modify as needed.
