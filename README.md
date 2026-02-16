# Deepself CLI

Official command-line interface for interacting with the [Deepself API](https://api.deepself.me). Create, train, and chat directly from your terminal.

## Features

- **Model Management**: Create, list, update, and delete AI models
- **Document Training**: Train models with text documents
- **Interactive Training**: Engage in conversational training sessions
- **Agent-Friendly**: Stateful commands with JSON output for automation
- **Chat Interface**: Interactive and single-shot chat with your models
- **Secure**: API keys stored with proper file permissions

## Installation

### Global Installation (Recommended)

```bash
npm install -g deepself-cli
```

After installation, the `deepself` command will be available globally.

### Local Development

```bash
git clone https://github.com/deepself-ai/deepself-cli.git
cd deepself-cli
npm install
npm run dev -- <command>
```

## Quick Start

### 1. Authentication

Authenticate with your Deepself API key:

```bash
deepself login
```

You'll be prompted to enter your API key. Alternatively, provide it as an argument:

```bash
deepself login YOUR_API_KEY
```

Or set it as an environment variable:

```bash
export DEEPSELF_API_KEY="your-api-key"
```

### 2. Create a Model

```bash
deepself models create deep-alice --name "Alice"
```

### 3. Train Your Model

Train with a document:

```bash
deepself train document deep-alice \
  --label "Biography" \
  --perspective first-person \
  --file bio.txt
```

Or use stdin:

```bash
echo "I am a software engineer from Seattle. I love coding and coffee." | \
  deepself train document deep-alice \
  --label "Bio" \
  --perspective first-person
```

### 4. Chat with Your Model

```bash
deepself chat deep-alice --message "Tell me about yourself"
```

Or start an interactive chat:

```bash
deepself chat deep-alice
```

## Commands

### Authentication

#### `deepself login [api-key]`

Authenticate with your Deepself API key.

**Options:**
- `--json` - Output in JSON format
- `--quiet` - Suppress output

**Examples:**
```bash
deepself login
deepself login YOUR_API_KEY
```

#### `deepself logout`

Remove stored authentication.

#### `deepself config`

Display current configuration.

**Example output:**
```
API Key: sk_1234...5678
Base URL: <using default>
Authenticated: Yes
```

### Model Management

#### `deepself models list`

List all your models.

**Options:**
- `--json` - Output in JSON format

**Example:**
```bash
deepself models list
deepself models list --json
```

#### `deepself models create <username>`

Create a new model.

**Arguments:**
- `<username>` - Username for the model (must start with "deep-")

**Options:**
- `--name <name>` - Display name for the model
- `--tools <tools...>` - Tools to enable (space-separated)

**Examples:**
```bash
deepself models create deep-assistant
deepself models create deep-bot --name "My Bot" --tools search calculator
```

#### `deepself models get <model-id>`

Get details of a specific model.

**Example:**
```bash
deepself models get deep-alice
```

#### `deepself models update <model-id>`

Update a model's configuration.

**Options:**
- `--name <name>` - Update display name
- `--add-fact <fact...>` - Add facts in format "key:value"
- `--tools <tools...>` - Update tools list

**Examples:**
```bash
deepself models update deep-alice --name "New Name"
deepself models update deep-alice --add-fact "version:2.0" "status:active"
deepself models update deep-alice --tools search calculator translator
```

#### `deepself models delete <model-id>`

Delete a model.

**Options:**
- `--force` - Skip confirmation prompt

**Examples:**
```bash
deepself models delete deep-alice
deepself models delete deep-alice --force
```

### Training

#### `deepself train document <model-id>`

Train model with a text document.

**Required Options:**
- `--label <label>` - Label for the training document
- `--perspective <perspective>` - Either "first-person" or "third-person"

**Optional:**
- `--file <path>` - Path to file (otherwise reads from stdin)

**Examples:**
```bash
# From file
deepself train document deep-alice \
  --label "About Me" \
  --perspective first-person \
  --file bio.txt

# From stdin
echo "I am a developer" | deepself train document deep-alice \
  --label "Bio" \
  --perspective first-person

# Multiline from stdin (press Ctrl+D when done)
deepself train document deep-alice \
  --label "Story" \
  --perspective first-person
```

#### `deepself train interactive <model-id>`

Interactive training room for humans.

**Required Options:**
- `--label <label>` - Label for the training session

**Example:**
```bash
deepself train interactive deep-alice --label "Training Session"
```

The model will ask questions, you provide answers. Type "done" to finish.

### Agent Training (Stateful Commands)

For automation and scripting, use the stateful training room commands:

#### `deepself train room begin <model-id>`

Begin a training room and get the first question.

**Required Options:**
- `--label <label>` - Label for the training session

**Example:**
```bash
deepself train room begin deep-alice --label "Session" --json
```

**Output:**
```json
{
  "status": "ok",
  "command": "train.room.begin",
  "data": {
    "room_id": "room_abc123",
    "first_question": "What is your name?"
  }
}
```

#### `deepself train room respond <room-id>`

Respond to a question in the training room.

**Required Options:**
- `--answer <text>` - Your answer
- `--model <model-id>` - Model ID

**Example:**
```bash
deepself train room respond room_abc123 \
  --model deep-alice \
  --answer "I am Alice" \
  --json
```

#### `deepself train room end <room-id>`

End the training room and finalize.

**Example:**
```bash
deepself train room end room_abc123 --json
```

### Chat

#### `deepself chat <model-id>`

Chat with an AI model.

**Options:**
- `--message <text>` - Single message to send (non-interactive)

**Examples:**
```bash
# Single message
deepself chat deep-alice --message "Hello!"

# Interactive chat
deepself chat deep-alice
```

In interactive mode, type `exit` or `quit` to end the chat.

## JSON Output

All commands support the `--json` flag for machine-readable output:

```bash
deepself models list --json
deepself chat deep-alice --message "Hello" --json
```

**JSON output format:**
```json
{
  "status": "ok",
  "command": "models.list",
  "data": [...],
  "timestamp": "2026-02-16T12:00:00.000Z"
}
```

Error responses:
```json
{
  "status": "error",
  "command": "models.get",
  "error": {
    "code": "NOT_FOUND",
    "message": "Model not found"
  },
  "timestamp": "2026-02-16T12:00:00.000Z"
}
```

## Configuration

### Config File

Configuration is stored at `~/.deepself/config.json` with secure permissions (0600).

### Environment Variables

- `DEEPSELF_API_KEY` - Your API key (overrides config file)
- `DEEPSELF_API_BASE_URL` - Custom API base URL (default: https://api.deepself.me)

**Precedence:** Environment variables > Config file > Defaults

## Agent Automation Example

Here's a complete example of using the CLI in an automated workflow:

```bash
#!/bin/bash

# Create a model
MODEL_ID="deep-agent"
deepself models create $MODEL_ID --name "Agent Bot" --json

# Begin training room
RESPONSE=$(deepself train room begin $MODEL_ID --label "Setup" --json)
ROOM_ID=$(echo $RESPONSE | jq -r '.data.room_id')
QUESTION=$(echo $RESPONSE | jq -r '.data.first_question')

# Answer questions
deepself train room respond $ROOM_ID \
  --model $MODEL_ID \
  --answer "I am an AI assistant" \
  --json

# More responses...
# ...

# End training
deepself train room end $ROOM_ID --json

# Chat with the model
deepself chat $MODEL_ID --message "What do you know about yourself?" --json
```

## Error Handling

The CLI uses specific exit codes for different error types:

- `0` - Success
- `1` - General error
- `2` - Usage error (invalid arguments)
- `3` - Authentication error
- `4` - Resource not found

This makes it easy to handle errors in scripts:

```bash
if ! deepself models get deep-alice; then
  echo "Model not found"
  exit 1
fi
```

## Troubleshooting

### "Not authenticated" error

Run `deepself login` to authenticate with your API key.

### "Invalid API key" error

Verify your API key is correct:
```bash
deepself config
```

Re-authenticate if needed:
```bash
deepself logout
deepself login
```

### Permission denied on config file

Ensure proper permissions on the config directory:
```bash
chmod 700 ~/.deepself
chmod 600 ~/.deepself/config.json
```

### Module import errors

Make sure you're using Node.js 18 or higher:
```bash
node --version
```

## Development

### Building

```bash
npm run build
```

### Running Tests

```bash
npm test
npm run test:watch
```

### Local Testing

```bash
npm link
deepself --help
```

## License

MIT

## Support

- Documentation: https://docs.deepself.me
- Issues: https://github.com/Headwaters-AI/deepself-cli/issues
- API Reference: https://api.deepself.me/docs
