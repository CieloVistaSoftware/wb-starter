const vscode = require('vscode');
const path = require('path');
const net = require('net');
const { spawn } = require('child_process');

let serverProcess = null;
let statusBarItem;
let outputChannel;

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    outputChannel = vscode.window.createOutputChannel("WB Server");
    
    // Create status bar item
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.command = 'wb-server.restart';
    statusBarItem.text = "$(sync~spin) WB Server: Init...";
    statusBarItem.show();
    context.subscriptions.push(statusBarItem);

    // Initial check
    checkAndStartServer();

    // Register command to open file
    let openDisposable = vscode.commands.registerCommand('wb-server.open', async function (uri) {
        // The uri argument depends on where the command was invoked from (context menu vs command palette)
        if (!uri && vscode.window.activeTextEditor) {
            uri = vscode.window.activeTextEditor.document.uri;
        }

        if (!uri) {
            vscode.window.showErrorMessage('No file selected');
            return;
        }

        const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri);
        if (!workspaceFolder) {
            vscode.window.showErrorMessage('File is not in a workspace');
            return;
        }

        // Ensure server is running before opening
        await checkAndStartServer();

        // Get relative path
        let relativePath = path.relative(workspaceFolder.uri.fsPath, uri.fsPath);
        
        // Normalize slashes for URL (Windows uses backslashes)
        relativePath = relativePath.split(path.sep).join('/');

        // Construct URL (assuming port 3000)
        const url = `http://localhost:3000/${relativePath}`;

        // Open in browser
        vscode.env.openExternal(vscode.Uri.parse(url));
        vscode.window.setStatusBarMessage(`Opening ${relativePath} on WB Server...`, 3000);
    });

    // Register command to restart server
    let restartDisposable = vscode.commands.registerCommand('wb-server.restart', async function () {
        if (serverProcess) {
            outputChannel.appendLine('Stopping server...');
            serverProcess.kill();
            serverProcess = null;
        }
        await checkAndStartServer();
        vscode.window.showInformationMessage('WB Server restarted');
    });

    // Register command to show logs
    let logsDisposable = vscode.commands.registerCommand('wb-server.showLogs', function () {
        outputChannel.show();
    });

    context.subscriptions.push(openDisposable);
    context.subscriptions.push(restartDisposable);
    context.subscriptions.push(logsDisposable);
    
    // Periodically check server status (every 5 seconds)
    const interval = setInterval(checkServerStatus, 5000);
    context.subscriptions.push({ dispose: () => clearInterval(interval) });
}

async function checkAndStartServer() {
    const isRunning = await isPortInUse(3000);
    if (isRunning) {
        updateStatusBar(true);
        return;
    }

    startServer();
}

async function checkServerStatus() {
    const isRunning = await isPortInUse(3000);
    updateStatusBar(isRunning, isRunning ? undefined : "Stopped");
    
    // Auto-restart if it's not running
    if (!isRunning && !serverProcess) {
         startServer();
    }
}

function startServer() {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
        outputChannel.appendLine('No workspace folder found.');
        return;
    }

    // Look for server.js in the first workspace folder
    const rootPath = workspaceFolders[0].uri.fsPath;
    const serverPath = path.join(rootPath, 'server.js');

    updateStatusBar(false, "Starting...");
    outputChannel.appendLine(`Starting server from ${serverPath}...`);

    try {
        // Use shell: true to ensure node is found in PATH on Windows
        serverProcess = spawn('node', [serverPath], {
            cwd: rootPath,
            env: { ...process.env, PORT: '3000' },
            shell: true
        });

        serverProcess.stdout.on('data', (data) => {
            outputChannel.append(`Server: ${data}`);
            if (data.toString().includes('running at')) {
                updateStatusBar(true);
            }
        });

        serverProcess.stderr.on('data', (data) => {
            outputChannel.append(`Server Error: ${data}`);
        });

        serverProcess.on('close', (code) => {
            outputChannel.appendLine(`Server exited with code ${code}`);
            serverProcess = null;
            updateStatusBar(false);
        });
        
        serverProcess.on('error', (err) => {
            outputChannel.appendLine(`Failed to start server: ${err.message}`);
            serverProcess = null;
            updateStatusBar(false);
        });

    } catch (e) {
        outputChannel.appendLine(`Error spawning server: ${e.message}`);
    }
}

function isPortInUse(port) {
    return new Promise((resolve) => {
        // Try to connect to the port to see if it's open
        const socket = new net.Socket();
        socket.setTimeout(200); // Short timeout
        
        socket.on('connect', () => {
            socket.destroy();
            resolve(true); // Connected, so port is in use
        });
        
        socket.on('timeout', () => {
            socket.destroy();
            resolve(false);
        });
        
        socket.on('error', (err) => {
            socket.destroy();
            resolve(false); // Connection failed, so port is likely free
        });
        
        // Try localhost which handles both IPv4 and IPv6 usually
        socket.connect(port, 'localhost');
    });
}

function updateStatusBar(online, text) {
    if (online) {
        statusBarItem.text = "$(radio-tower) WB Server: On";
        statusBarItem.tooltip = "Server is running on port 3000";
        statusBarItem.backgroundColor = undefined;
    } else {
        statusBarItem.text = `$(error) WB Server: ${text || "Off"}`;
        statusBarItem.tooltip = "Server is not running";
        statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
    }
    statusBarItem.show();
}

function deactivate() {
    if (serverProcess) {
        serverProcess.kill();
    }
}

module.exports = {
    activate,
    deactivate
};
