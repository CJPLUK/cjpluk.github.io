# Cangjie AI for Cursor

A Cursor editor extension that automatically adds a fixed prompt prefix for the Cangjie language (`.cj` files).

## Features

- 🎯 **Automatic `.cj` File Detection**: Automatically activates when opening or switching to `.cj` files  
- 📝 **Automatic `.cursorrules` Management**: Creates or updates the `.cursorrules` file in the workspace root directory  
- 🤖 **Intelligent Prompt Prefixing**: Automatically injects Cangjie-language–specific context and instructions into AI conversations  
- ⚙️ **Fully Configurable**: Customize the prompt prefix via the settings UI or commands  
- 🔄 **Real-Time Updates**: Configuration changes take effect immediately without restarting  
- 🔌 **Context7 MCP Integration**: Automatically installs and configures the Context7 MCP server to provide up-to-date documentation and code examples  
- 🛠️ **Cangjie Toolchain Support**: Built-in guidance for `cjpm` commands (`init`, `build`, `run`, `test`)  

## Installation

### Install from the Marketplace

1. Open the Cursor editor  
2. Press `Cmd+Shift+X` (macOS) or `Ctrl+Shift+X` (Windows/Linux) to open the Extensions Marketplace  
3. Search for **"Cangjie AI for Cursor"**  
4. Click **Install**

### Install from a VSIX File

1. Download the `.vsix` file  
2. In Cursor, press `Cmd+Shift+P` (macOS) or `Ctrl+Shift+P` (Windows/Linux)  
3. Type **"Extensions: Install from VSIX..."**  
4. Select the downloaded `.vsix` file  

## Usage

### Basic Usage

1. After installing the extension, open any `.cj` file  
2. The extension automatically detects the file and updates the `.cursorrules` file in the workspace root, adding the configured prompt prefix  
3. When interacting with AI in Cursor, the prefix is automatically applied to all prompts  

**How It Works**:  
The extension creates or updates a `.cursorrules` file in the workspace root directory. This is an officially supported rule file format in Cursor. Cursor automatically reads this file and applies its contents to AI conversations, enabling the AI to better understand the Cangjie language syntax and best practices.

### Configuring the Prompt Prefix

There are two ways to configure the prompt prefix:

#### Option 1: Via the Settings UI

1. Open Cursor Settings (`Cmd+,` or `Ctrl+,`)  
2. Search for **"Cangjie AI for Cursor"**  
3. Locate the **"Prompt Prefix"** setting  
4. Enter your desired prefix text  
5. Save the settings  

#### Option 2: Via Command Palette

1. Press `Cmd+Shift+P` (macOS) or `Ctrl+Shift+P` (Windows/Linux)  
2. Type **"Set Prompt Prefix"**  
3. Enter the prefix text in the input box  
4. Confirm to save  

### Default Prompt Prefix

The default prompt prefix includes the following content:

1. When handling Cangjie language–related questions, use the context7 MCP to retrieve Cangjie documentation and examples. Base responses and code generation on the retrieved documentation.
2. Use the yolomao/cangjiecorpus-mirror repository to obtain Cangjie language documentation and examples.
3. Use `cjpm init` to create a project.
4. Use `cjpm build` to compile the project.
5. Use `cjpm run` to run the project.
6. Use `cjpm test` to test the project.

You can modify this content as needed.

### Manually Updating `.cursorrules`

If you need to manually update the `.cursorrules` file:

1. Press `Cmd+Shift+P` (macOS) or `Ctrl+Shift+P` (Windows/Linux)  
2. Type **"Update .cursorrules File"**  
3. Execute the command to update the `.cursorrules` file  

**Note**:  
The `.cursorrules` file is located in the workspace root directory. You can open and edit it directly to view or modify its contents.

### Enable / Disable

In the settings, search for **"Cangjie AI for Cursor"** to find the **"Enabled"** option, which allows you to enable or disable this functionality.

## Context7 MCP Integration

This extension automatically installs and configures the Context7 MCP server. Context7 MCP provides the Cursor AI assistant with the latest library documentation and code examples.

### Automatic Configuration

When the extension is activated, it automatically:

1. Installs the `@upstash/context7-mcp` dependency  
2. Configures the Context7 MCP server in `~/.cursor/mcp.json`  
3. Displays a notification indicating successful configuration  

### Manual Configuration

If you need to reconfigure Context7 MCP manually:

1. Press `Cmd+Shift+P` (macOS) or `Ctrl+Shift+P` (Windows/Linux)  
2. Type **"Configure Context7 MCP"**  
3. Execute the command and restart Cursor for the changes to take effect  

### Using Context7

After configuration, the extension automatically adds instructions to the `.cursorrules` file, guiding the AI on how to use Context7 MCP to locate Cangjie language documentation.

**How It Works**:

1. The AI first uses the `resolve-library-id` tool to locate the Cangjie language library (searching for "cangjie" or "仓颉")  
2. Then it uses the `get-library-docs` tool to retrieve relevant documentation and code examples  
3. Responses and code are generated based on the retrieved documentation  

**Note**:  
If you encounter a **"Library does not exist"** error, it means you must first use `resolve-library-id` to identify the correct library ID, rather than directly using `/cangjie/cangjie`.

### Verifying Context7 MCP Usage

1. **Check Configuration Status**:  
   - Press `Cmd+Shift+P` (macOS) or `Ctrl+Shift+P` (Windows/Linux)  
   - Type **"Check Context7 MCP Status"**  
   - Verify that the configuration has been correctly written  

2. **Inspect Console Logs**:  
   - Open Developer Tools (**Help > Toggle Developer Tools**)  
   - Search for `[Context7 MCP]` in the console to view detailed logs  
   - You should see information such as configuration paths and content  

3. **Check the Configuration File**:  
   - Configuration file location: `~/.cursor/mcp.json`  
   - Ensure that the file contains the `context7` configuration  

4. **Important Notes**:  
   - MCP servers must be started by the Cursor main process  
   - **Cursor must be restarted after writing the configuration for it to take effect**  
   - In debug mode, MCP configurations may not be loaded (as the debug window runs in a separate process)  
   - To actually use MCP, the extension must be packaged and installed, rather than run in debug mode  

### Configuration File Location

The Context7 MCP configuration file is located at:

`~/.cursor/mcp.json`

Example configuration:

```json
{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp"]
    }
  }
}


