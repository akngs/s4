# S4: A Framework for AI‑Driven Software Development

S4 is a CLI framework that enables stateless AI-human collaboration through semi-structured specifications. By maintaining all project context in `s4.yaml`, it allows each development session to be completely self-contained—no chat history required, no context decay, just specification-driven iteration.

## The Context Problem in AI Development

Modern AI coding assistants treat conversation context like critical state that must be preserved across interactions. This creates cascading problems that anyone who's worked with AI assistants knows well.

When you open a new chat session, all continuity disappears. The AI doesn't know what you were working on, what decisions were made, or what comes next. So you keep conversations running as long as possible, watching performance degrade as the context grows. Even compression tools like Claude Code's `compact` command often reduce output quality. Meanwhile, you're burning tokens stuffing entire codebases into context windows, hoping the AI will find the relevant parts.

This degradation, often called "context rot," manifests in predictable ways. The AI starts ignoring information you provided earlier. It implements features you didn't request. It forgets constraints you carefully explained. The needle-in-a-haystack benchmarks that LLM providers tout become meaningless when faced with real-world development complexity.

## The Specification-First Approach

Consider the hierarchy of software artifacts. Prompts generate code. Code compiles to binaries. We version-control code rather than binaries because code contains more intent and information. Following this logic, [why do we discard prompts while carefully preserving code?](https://www.youtube.com/watch?v=8rABwKRsec4)

S4 recognizes that well-crafted specifications are the primary artifact in AI-assisted development. The code becomes a derived artifact—important for execution, but secondary for capturing intent. This isn't about replacing programmers or claiming code doesn't matter. It's about acknowledging that when AI can reliably transform specifications into code, the specification becomes the artifact worth managing carefully.

The framework enables truly stateless AI interactions by maintaining all intent, context, and requirements in a persistent specification. The CLI analyzes this specification alongside your code to generate complete, self-contained context on demand. One command provides everything needed for the next action, allowing each AI interaction to start fresh with all necessary information upfront.

## How S4 Works

The development loop becomes simple: edit your specification, run `s4 status`, act on the guidance, and repeat. No chat history to maintain. No context windows to manage. Just specification-driven iteration.

The specification file (`s4.yaml`) serves as your single source of truth, containing business objectives, features, and acceptance criteria. When you run `s4 status`, S4 analyzes both the specification and your codebase to generate a complete picture of your project's current state. It validates internal consistency, ensuring your specification makes sense before any code gets written. The test runner measures actual progress through acceptance tests tied to each feature. Most importantly, it provides discoverable next steps, telling both humans and AI agents exactly what needs attention.

This approach mirrors how stateless protocols handle communication. Instead of "increase the temperature by one degree" (which requires knowing the current temperature), you say "set the temperature to 24 degrees" (which is self-contained). Similarly, instead of "add that function we discussed earlier" (which requires chat history), you specify exactly what's needed in the specification; S4 provides the complete context.

## Design Philosophy

Every development session should be independent. Previous chat history becomes irrelevant when `s4 status` can provide complete context every time. This isn't just about convenience—it's about reliability and reproducibility.

S4 maintains a clear separation of concerns. The CLI handles deterministic analysis of structure, traceability, and coverage. AI agents interpret intent and execute recommendations. Humans make strategic decisions and set direction. Each component does what it does best.

## Getting Started

Just run `s4 status` in your project root, and it will recommend the next actions.

A typical workflow looks like this:

1. A human updates `s4.yaml`, possibly with AI assistance.
2. Open a fresh AI chat session and ask the AI to run `s4 status` and complete the next recommended action.
3. `s4` provides the AI with full context, and the AI completes the task.
4. The human can then close the chat without losing any context or progress.

This process repeats with any AI at any time.

## Releases and Changelog

This project uses release-please to automate versioning and `CHANGELOG.md` maintenance:

- Conventional Commit messages are required (e.g., `feat: ...`, `fix: ...`).
- On merges to `main`, a release PR is managed automatically with notes and `CHANGELOG.md`.
- To trigger manually, use the "Run workflow" on the `release-please` GitHub Action.

If you are contributing, please follow Conventional Commits so your changes appear correctly in the changelog.

## Spec Authoring

The project’s spec is in [s4.yaml](s4.yaml).

For best practices, run `s4 guide`.

## License

[MIT](LICENSE)
