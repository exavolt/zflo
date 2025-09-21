# ZFlo Play CLI

A command-line interface for playing ZFlo flows in the terminal with interactive keyboard navigation.

## Features

- 🎮 Interactive terminal-based flow player
- ⌨️ Keyboard navigation with arrow keys and Enter
- 🎨 Colored output with chalk (can be disabled)
- 📊 Verbose mode for debugging and state tracking
- 🔄 Support for auto-advancing nodes
- 🎯 Choice selection with numbered options

## Installation

From the workspace root:

```bash
pnpm install
pnpm -C apps/play-cli build
```

## Usage

```bash
# Run a flow file
pnpm -C apps/play-cli dev examples/simple-adventure.json

# Or after building
node apps/play-cli/dist/index.js examples/simple-adventure.json

# With options
node apps/play-cli/dist/index.js examples/simple-adventure.json --verbose --no-color
```

### Options

- `-v, --verbose`: Enable verbose output (shows state changes)
- `--no-color`: Disable colored output
- `--help`: Show help information
- `--version`: Show version information

## Flow File Format

The CLI accepts ZFlo flow JSON files. See `examples/simple-adventure.json` for a complete example.

## Controls

- **Arrow Keys**: Navigate through choices
- **Enter**: Select a choice
- **Ctrl+C**: Exit the flow player

## Example

```bash
cd apps/play-cli
pnpm dev examples/simple-adventure.json
```

This will start an interactive adventure where you can:

- Explore a mysterious cave
- Make choices that affect the story
- See your decisions impact the game state
- Experience multiple different endings

## Development

```bash
# Install dependencies
pnpm install

# Build the CLI
pnpm build

# Run in development mode
pnpm dev examples/simple-adventure.json

# Type check
pnpm type-check
```
