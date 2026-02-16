# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-02-16

### Added
- Initial release of Deepself CLI
- Authentication commands (`login`, `logout`, `config`)
- Model management commands (`list`, `create`, `get`, `update`, `delete`)
- Document training with stdin and file support
- Interactive training room for human users
- Stateful training room commands for agent automation (`begin`, `respond`, `end`)
- Chat functionality (interactive and single-shot)
- JSON output support for all commands
- Secure API key storage with proper file permissions
- Environment variable support (`DEEPSELF_API_KEY`, `DEEPSELF_API_BASE_URL`)
- Comprehensive error handling with specific exit codes
- Global `--json` and `--quiet` flags

### Features
- TypeScript implementation with full type safety
- ES modules support
- Node.js 18+ compatibility
- Cross-platform support (macOS, Linux, Windows/WSL)
- Comprehensive documentation

[0.1.0]: https://github.com/deepself-ai/deepself-cli/releases/tag/v0.1.0
