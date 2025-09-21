# Using ZFlo for Game Narrative Systems

## Vision

ZFlo is uniquely positioned to evolve beyond a general-purpose flowchart engine into a specialized tool for **game narrative design**. Its core principles of state management, rule-based progression, and format-agnostic input make it an ideal foundation for creating, prototyping, and exporting complex, branching narratives for video games.

This document outlines a three-phase vision for leveraging ZFlo as an end-to-end solution for game writers, narrative designers, and programmers.

---

## Core Concepts: Mapping ZFlo to Game Narrative

The features of ZFlo translate directly to common game narrative concepts:

- **ZFlo Flow**: Represents a complete quest, dialogue tree, or narrative scene.
- **Nodes**: Serve as dialogue lines, story beats, cutscene triggers, or gameplay events.
- **Outlets**: Represent player choices, dialogue options, or conditional branches in a quest.
- **State (`StateManager`)**: Acts as the global **World State** or **Player State**. It can track everything from player inventory (`state.has_key`), character relationships (`state.npc_affinity > 50`), completed objectives (`state.quest_stage == 'complete'`), or world conditions (`state.is_night_time`).
- **Inference Engine (`FlowEngine`)**: Functions as the **Quest/Dialogue Manager**, interpreting the narrative logic and advancing the story based on player actions and the current world state.

---

## Phase 1: Prototyping & Visualization (The Editor)

The current ZFlo web demo already serves as a powerful prototyping tool for narrative designers and writers.

### Key Features:

1.  **Rapid Prototyping**: Writers can draft complex, branching dialogues and quest lines using simple text-based formats like Mermaid, PlantUML, or DOT. This lowers the technical barrier and allows for rapid iteration without needing a game engine.

2.  **Instant Playtesting**: The web UI allows designers to instantly play through their narrative flows, test different branches, and check the logic of their stories in real-time.

3.  **Collaboration**: The text-based format is version-control friendly (e.g., Git), allowing writers and designers to collaborate effectively.

4.  **Automated Analysis**: The built-in analyzer can be used to find narrative dead ends, unreachable story branches, or logical inconsistencies before the story is ever implemented in-game.

---

## Phase 2: In-Engine Integration (The Runtime)

The UI-agnostic nature of `@zflo/core` is its greatest strength for game integration. The core logic can be run directly within a game engine.

### Integration Strategy:

- **Porting/Wrapping**: The `FlowEngine` and `StateManager` logic can be ported to the engine's native language (e.g., a full C# rewrite for Unity) for maximum performance. Alternatively, a JavaScript engine (like Jint for Unity or V8 for Unreal) can run the core package directly, with a wrapper providing communication to the game world.

- **Event-Driven Architecture**: The game engine subscribes to events from the ZFlo runtime. For example:
  - `onNodeChanged`: The game displays the new dialogue text from the current node.
  - `onStateChanged`: The game reacts to state changes. If `state.has_key` becomes `true`, the game code unlocks a physical door.

- **Input Handling**: The game presents the player with choices from the current node's `outlets`. When the player chooses, the selection is fed back into the `FlowEngine` to advance the state.

---

## Phase 3: Asset Generation (The Exporter)

This is the most powerful and transformative phase, turning ZFlo from a prototyping tool into a full-fledged narrative asset pipeline.

The goal is to create **custom exporters** that convert the standardized `ZFFlow` JSON representation into native, engine-ready code and assets.

### Example: Unity C# Exporter

An exporter could be built to parse an `ZFFlow` and generate the following C# files:

1.  **Dialogue & Node Data (`ScriptableObject`s)**:
    - Each node becomes a `DialogueNode.asset`.
    - Each outlet becomes a `Choice.asset` linked to the next node.
    - This allows designers to edit text, add voice-over files, and link character portraits directly in the Unity Editor.

2.  **Quest Logic Controller (C# Class) via State Abstraction**:
    - The exporter generates a C# class, e.g., `Generated_Quest_OrgrimmarAttack.cs`, that operates on an abstract state interface (e.g., `INarrativeStateProvider`).
    - This decouples the narrative logic from the game's concrete state implementation. Programmers simply provide a class that implements the interface.
    - Outlet conditions (`state.player_level > 10`) are converted into calls to the state provider:
      ```csharp
      // The generated code doesn't know about 'GameState', only the interface.
      if (_stateProvider.GetNumber("player_level") > 10)
      {
          // Go to the 'HighLevelBranch' node
      }
      ```
    - State modifications (`state.gold += 10`) also use the abstraction:
      ```csharp
      _stateProvider.IncrementNumber("gold", 10);
      ```

### Workflow Example:

1.  A writer drafts a quest in `quest.puml`.
2.  They use the ZFlo web editor to validate and playtest it.
3.  Once approved, they run the `zflo-export-unity` command-line tool.
4.  The tool generates a set of `ScriptableObject`s and a `Quest_Manager.cs` file in the Unity project's `Assets` folder.
5.  A programmer simply attaches the generated script to a GameObject, and the entire quest is runnable in-game, driven by native C# code.

This workflow bridges the gap between writers and programmers, reduces manual implementation errors, and dramatically speeds up the narrative development lifecycle.
