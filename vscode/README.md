# WB Server Opener

This is a simple VS Code extension for the WB Starter project.

## Features

- Adds a context menu item **"Open with WB Server"** to HTML files in the Explorer and Editor.
- Opens the file at `http://localhost:3000/<relative-path>` to ensure it is served by the WB Middleware (which wraps fragments in the site shell).

## Installation

1. Open this folder in VS Code.
2. Press `F5` to launch a new Extension Development Host window with the extension loaded.
3. In the new window, right-click any `.html` file in `pages/` and select **"Open with WB Server"**.

## Manual Installation

To install it permanently:
1. Install `vsce`: `npm install -g @vscode/vsce`
2. Package the extension: `vsce package`
3. Install the `.vsix` file in your main VS Code instance.
