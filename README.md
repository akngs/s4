# S4: A Framework for AI‑Driven Software Development

S4 is a CLI tool that enables **stateless AI-human collaboration** through **semi-structured software specifications**. By maintaining all project context in a single `s4.yaml` file, it allows each development session to be completely self-contained - no chat history required, no context decay, just specification-driven iteration.

## What is S4?

S4 is a command-line tool designed specifically for AI-driven software development. It solves the "context rot" problem that plagues AI coding assistants by providing complete project context on demand.

### The Problem S4 Solves

When working with AI coding assistants, you've probably experienced:

- **Context decay**: AI forgets earlier decisions as conversations get longer
- **Lost continuity**: Starting a new chat means losing all project context
- **Token waste**: Copying entire codebases into context windows
- **Inconsistent results**: AI makes different decisions in different sessions

### How S4 Works

S4 maintains your project's complete context in a structured `s4.yaml` specification file. When you run `s4 status`, it analyzes both your specification and codebase to provide:

- **Complete project overview** (mission, vision, business objectives)
- **Feature completion status** (which acceptance tests pass/fail)
- **Actionable next steps** (exactly what needs to be done)
- **Validation issues** (spec inconsistencies that need fixing)
- **Tool execution results** (linting, testing, etc.)

## Quick Start

### Installation

```bash
npm install -g s4
```

### Basic Workflow

1. **Create a specification** (`s4.yaml`):
```yaml
title: My Awesome Project
mission: Build a user-friendly task management app
vision: Help teams collaborate more effectively

businessObjectives:
  - id: BO-0001
    description: Enable users to create and manage tasks

features:
  - id: FE-0001
    title: Task Creation
    description: Users can create new tasks with title and description
    covers: [BO-0001]

acceptanceTests:
  - id: AT-0001
    covers: FE-0001
    given: a user wants to create a task
    when: they click the "New Task" button
    then: a task creation form appears
```

2. **Check project status**:
```bash
s4 status
```

3. **Follow the guidance** - S4 will tell you exactly what to do next!

## Core Commands

### `s4 status` (or `s4 s`)
The main command that provides complete project context and next actions.

```bash
s4 status
```

### `s4 validate` (or `s4 v`)
Validates your specification for internal consistency.

```bash
s4 validate
```

### `s4 guide`
Provides guidance on writing specifications.

```bash
s4 guide  # Show brief guidance
s4 guide feature  # Show feature writing guide
s4 guide acceptanceTest  # Show acceptance test guide
```

### `s4 info`
Shows detailed information about features or acceptance tests.

```bash
s4 info FE-0001  # Show feature details
s4 info AT-0001  # Show acceptance test details
```


## Specification Format

Your `s4.yaml` file contains:

- **Project metadata**: title, mission, vision
- **Business objectives**: High-level goals (BO-0001, BO-0002, etc.)
- **Features**: Concrete functionality (FE-0001, FE-0002, etc.)
- **Acceptance tests**: Testable conditions (AT-0001, AT-0002, etc.)
- **Concepts**: Reusable definitions referenced with `[[concept]]`
- **Tools**: Custom commands to run (linting, testing, etc.)
- **Connectors**: How to find and run your tests

### Key Principles

1. **Traceability**: Every business objective must be covered by features, every feature by acceptance tests
2. **Self-contained**: Each acceptance test should be independently testable
3. **AI-friendly**: Specifications are written for both humans and AI agents
4. **Validation**: S4 ensures your specification is internally consistent

## The Context Problem in AI Development

Modern AI coding assistants treat conversation context like critical state that must be preserved across interactions. This creates cascading problems:

- **Context decay**: AI performance degrades as conversations get longer
- **Lost continuity**: New chat sessions lose all project context
- **Token waste**: Copying entire codebases into context windows
- **Inconsistent results**: AI makes different decisions in different sessions

## The Specification-First Approach

S4 recognizes that well-crafted specifications are the primary artifact in AI-assisted development. The code becomes a derived artifact—important for execution, but secondary for capturing intent.

The framework enables truly stateless AI interactions by maintaining all intent, context, and requirements in a persistent specification. The CLI analyzes this specification alongside your code to generate complete, self-contained context on demand.

## Design Philosophy

Every development session should be independent. Previous chat history becomes irrelevant when `s4 status` can provide complete context every time. This isn't just about convenience—it's about reliability and reproducibility.

S4 maintains a clear separation of concerns:
- **CLI**: Handles deterministic analysis of structure, traceability, and coverage
- **AI agents**: Interpret intent and execute recommendations  
- **Humans**: Make strategic decisions and set direction

## Typical Workflow

1. **Human updates** `s4.yaml` (possibly with AI assistance)
2. **Open fresh AI chat** and ask AI to run `s4 status`
3. **AI gets complete context** and completes the recommended task
4. **Human closes chat** without losing any context or progress
5. **Repeat** with any AI at any time

## Examples

See the [examples/](examples/) directory for real-world specification examples.

## License

[MIT](LICENSE)
