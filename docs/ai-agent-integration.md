# Integrating ZFlo with AI Agents (Model Context Protocol)

## Overview

ZFlo is not just a tool for building human-facing interactive experiences; its architecture is uniquely suited to serve as a powerful bridge between human intent and AI agent execution. When combined with a framework like the Model Context Protocol (MCP), ZFlo can act as a structured, machine-readable "playbook" that guides an AI agent through complex, multi-step tasks.

This document explores two primary workflows for this synergy:

1.  **The AI Agent as an Executor**: The agent follows a predefined `FlowDefinition` to perform a task, ensuring consistency, repeatability, and transparency.
2.  **The AI Agent as an Author**: The agent generates a new `FlowDefinition` from a user's natural language description, creating a reusable, automated workflow.

---

## Workflow 1: The AI Agent as Executor

In this model, a `FlowDefinition` acts as a Standard Operating Procedure (SOP) that an AI agent can execute. Instead of relying on a series of manual prompts, a user can simply ask the agent to run a specific flow.

### How It Works

1.  **Flow Definition**: A developer or power user defines a workflow as a `FlowDefinition`, where each node represents a step and its content is an instruction for the agent.
2.  **Invocation**: The user asks the agent to execute the flow (e.g., "_Cascade, run the 'new-component' workflow._").
3.  **Execution**: The agent parses the `FlowDefinition` and traverses it node by node:
    - It reads the instruction in the current node's `content`.
    - It uses its available tools (e.g., `write_to_file`, `run_command`, `grep_search`) to perform the action.
    - The `globalState` of the flow serves as the agent's short-term memory for the task, storing variables like file paths or user inputs.
    - At **decision nodes**, the agent can either ask the user for input or use its own reasoning to select a path.

### Example: `create-react-component.zflo.json`

This flow guides an agent in creating a new React component using concrete tool calls.

```json
{
  "id": "create-react-component",
  "title": "Create React Component Workflow",
  "startNodeId": "ask-component-name",
  "globalState": {
    "componentName": "MyNewComponent",
    "filePath": null,
    "boilerplate": "import React from 'react';\n\nexport const ${componentName} = () => {\n  return <div>${componentName}</div>;\n};\n"
  },
  "nodes": [
    {
      "id": "ask-component-name",
      "content": "This step would typically involve asking the user for input. For this example, we'll use the default 'MyNewComponent' from the global state.",
      "outlets": [{ "to": "set-file-path" }]
    },
    {
      "id": "set-file-path",
      "actions": [
        {
          "type": "set",
          "target": "filePath",
          "expression": "`/Users/fahrezalexa/Personal/Projects/zflo/apps/play/src/components/${componentName}.tsx`"
        }
      ],
      "outlets": [{ "to": "create-file" }]
    },
    {
      "id": "create-file",
      "content": "Create the component file using the 'write_to_file' tool.",
      "actions": [
        {
          "type": "tool",
          "toolName": "write_to_file",
          "parameters": {
            "TargetFile": "${filePath}",
            "CodeContent": "${boilerplate}"
          }
        }
      ],
      "outlets": [{ "to": "finish" }]
    },
    {
      "id": "finish",
      "content": "Report to the user that the component '${componentName}' has been created successfully at '${filePath}'."
    }
  ]
}
```

### Benefits

- **Automation & Consistency**: Complex tasks are executed the same way every time, reducing human error.
- **Transparency**: The `FlowDefinition` file provides a clear, auditable record of the agent's intended actions.
- **Composability**: Flows can be designed to call other flows, creating complex, nested automations.

---

## Workflow 2: The AI Agent as Author

The reverse workflow is equally powerful: an AI agent can create a `FlowDefinition` file from a simple, natural language request.

### How It Works

1.  **User Request**: The user describes a process in plain English (e.g., "_I need a workflow to run tests and then deploy the app if they pass._").
2.  **Translation**: The AI agent parses the request and identifies the steps, conditions, and dependencies.
3.  **Flow Generation**: The agent translates this logical structure into a valid `FlowDefinition` JSON object.
4.  **File Creation**: The agent uses its `write_to_file` tool to save the generated flow, making it available for future execution.

### Example: Generating a Deployment Flow

**User Prompt**: "_Create a flow to deploy the 'play' app. It should first run `pnpm test`. If the tests succeed, it should run `pnpm deploy`. If they fail, it should report an error._"

**Agent's Output (`deploy-play-app.zflo.json`)**:

```json
{
  "id": "deploy-play-app",
  "title": "Deploy Play App Workflow",
  "startNodeId": "run-tests",
  "nodes": [
    {
      "id": "run-tests",
      "content": "Run the command `pnpm test` in the root directory. Capture the exit code.",
      "outlets": [
        {
          "to": "run-deploy",
          "condition": "exitCode == 0"
        },
        {
          "to": "report-failure"
        }
      ]
    },
    {
      "id": "run-deploy",
      "content": "Run the command `pnpm deploy`.",
      "outlets": [{ "to": "finish" }]
    },
    {
      "id": "report-failure",
      "content": "Report to the user that the tests failed and deployment was aborted."
    },
    {
      "id": "finish",
      "content": "Report to the user that the deployment was successful."
    }
  ]
}
```

### Benefits

- **Rapid Automation**: Users can create complex automations without writing any code.
- **Democratization**: Anyone can create structured workflows, not just developers.
- **Reusable Asset Library**: Over time, a team can build a library of `FlowDefinition` playbooks for all its common operations.

---

## Exposing Application Tools to the Agent

For an AI agent to perform application-specific tasks (e.g., sending a Slack message, updating a user profile in a database), the host application must declare and expose its capabilities as a set of "tools." The agent can then discover and execute these tools as part of a ZFlo workflow.

### 1. The Tool Declaration

An application should provide a machine-readable manifest of its available tools. Each tool declaration should ideally follow a standard schema, such as JSON Schema, and contain:

- **`toolName`**: A unique identifier for the tool (e.g., `sendSlackMessage`).
- **`description`**: A clear, natural language description of what the tool does and when to use it. This is critical for the agent's reasoning.
- **`parameters`**: A schema defining the inputs the tool accepts, including their types, descriptions, and whether they are required.

**Example Tool Declaration:**

```json
{
  "toolName": "sendSlackMessage",
  "description": "Sends a message to a specified Slack channel.",
  "parameters": {
    "type": "object",
    "properties": {
      "channel": {
        "type": "string",
        "description": "The Slack channel to send the message to, e.g., '#general'."
      },
      "message": {
        "type": "string",
        "description": "The content of the message to send."
      }
    },
    "required": ["channel", "message"]
  }
}
```

### 2. The Tool Registry

The host application would manage these tools in a `ToolRegistry`. On startup, the application registers its tool declarations along with the corresponding functions to execute them. The agent is given access to this registry, allowing it to query the available tools.

### 3. Invoking Tools within a ZFlo Flow

To make these tools executable within a flow, we can introduce a new action type: `tool`. This allows a `NodeDefinition` to explicitly call an application-specific tool.

**Example `NodeDefinition` with a `tool` action:**

This node, as part of a deployment flow, uses the `sendSlackMessage` tool to post a success notification.

```json
{
  "id": "notify-slack-on-success",
  "content": "Notify the '#deployments' channel of the successful deployment.",
  "actions": [
    {
      "type": "tool",
      "toolName": "sendSlackMessage",
      "parameters": {
        "channel": "#deployments",
        "message": "The application was deployed successfully!"
      }
    }
  ],
  "outlets": [{ "to": "finish" }]
}
```

### 4. The End-to-End Execution Loop

When the agent encounters a `tool` action in a ZFlo node, the following occurs:

1.  **Discovery**: The agent has already been made aware of the available tools from the application's `ToolRegistry` at the start of the session.
2.  **Reasoning**: The `content` of the node provides context, but the `tool` action is a direct, unambiguous instruction. The agent knows it must execute the `sendSlackMessage` tool.
3.  **Parameter Interpolation**: The agent resolves any dynamic variables in the `parameters` block using the current `globalState` of the flow (e.g., `"message": "Deployment of '${appName}' was successful!"`).
4.  **Execution**: The agent calls the corresponding function provided by the host application, passing the validated parameters.
5.  **State Update**: The output or result from the tool can be captured and stored in the flow's `globalState` for use in subsequent nodes.

This architecture creates a powerful and safe integration pattern. The application retains full control over its capabilities, while the agent is empowered to use them intelligently within the structured, predictable context of a ZFlo workflow.

---

## Conclusion: The Perfect Structured Data Layer

ZFlo provides the ideal **structured data layer** to sit between high-level human intent and the low-level tool execution of an AI agent. It translates ambiguous natural language into a deterministic, machine-readable format that enhances the reliability and capability of agents operating under the Model Context Protocol.
