# Nodestro – Visual AI Agent Studio

> This is the original project brief that Nodestro was built from (translated from German). It describes the goals at
> the start of the project; what Nodestro does today is described in the [README](../README.md) and in
> [ARCHITECTURE.md](ARCHITECTURE.md).

**Nodestro** (from *Node* + *Maestro*) is a planned visual application for creating, configuring and connecting AI
agents. The goal is a modern, easy-to-use development environment in which users build and run multi-agent workflows
without extensive programming.

## Foundation

Nodestro is to be built **on the existing Python library `orkexa`**, which runs agents independently of the provider
(Anthropic, OpenAI, Gemini as well as OpenAI-compatible endpoints, Ollama and vLLM). The library is provided to the
implementing AI separately. Its actual classes, arguments, interfaces and functions are to be examined first. Nodestro
is meant to make these capabilities accessible through an understandable user interface instead of writing its own
agent framework.

## Core idea: agents as nodes

The central workspace is a **graphical workflow editor**, inspired by the interaction principle of n8n. **A node
represents an agent.** Agents can be added, positioned, connected and assembled into a workflow. Tasks, information and
results are passed between agents through the connections.

It should be possible to create, save, reopen, start and trace workflows. A clear execution status shows results, tool
calls, errors and, where possible, token usage and costs of individual agents and of the whole workflow.

## Configuring agents – manually or with AI

When creating or editing an agent node, **all arguments of the Orkexa library's `Agent` that are available and
reasonably configurable** should be accessible, for example provider and model, system prompt, messages, tools,
memory, output format, thinking/effort, caching, limits and tool choice. The interface should present common settings
simply and reveal advanced options when needed.

Alternatively, the user can **describe in natural language which agent they need**. A background agent creates a
suitable configuration from it, such as role, system prompt, model choice and tool assignments. The configuration
stays visible and editable and does not have to be accepted unchecked. Existing capabilities of the library for
creating agents dynamically should be used.

## Tools and memory

Tools should be displayed and managed centrally, assigned to existing agents and reused. The user should either pick a
tool from existing functions **or describe it in natural language**. A coding agent can then develop a suitable Python
function with types, a docstring and tests. Generated code must be checked and executed safely before it is approved.
Existing library functions for tool definitions and dynamic creation are to be reused.

**Memory** should also be configurable in an understandable way directly at the agent: supported memory types should
be selectable, and a background agent can support the setup if needed. It should be traceable which information an
agent stores or receives.

## Background knowledge and files

Users should be able to store **PDFs, images, text files and other supported documents** as background knowledge and
assign them to one or several agents. The existing functions for files, retrieval/RAG and possibly memory should be
used. Uploaded content should be easy to find, manage and reuse. The concrete scope depends on the library interfaces
that are actually available.

## Design and interaction

The interface should be **clear, calm, professional and easy to understand**. The workflow editor is at the center;
agent settings appear in clearly structured panels. Complexity should be reduced through progressive disclosure
without hiding important library functions.

The enclosed design system **"Midnight Citron"** is the visual foundation. It contains light and dark mode color
tokens, CSS, a design guide and HTML and image previews. The goal is a distinctive, restrained design that remains
readable even with many connected agents.

## Implementation and scope

The application should **initially be usable locally, via `localhost`**. Frontend, backend and technical architecture
are not yet fixed and should be chosen and justified to fit the existing `orkexa` library. The initial focus is a
working, easy-to-use graphical agent workflow editor; later extensions should remain possible.

**Not part of this project description:** SaaS, user subscriptions, payment processing or founding a company.

### Brief for the implementing AI

1. First analyze the provided `orkexa` library and determine its actual capabilities.
2. Derive a deliberately lean interaction and architecture concept for Nodestro from it.
3. Use the existing library as the technical basis for agents, tools, memory, files and execution.
4. Base the design on the enclosed Midnight Citron design system.
5. Prioritize **ease of use, clarity, comprehensibility, testability and reusability** over unnecessary complexity.

The goal is **an intuitive visual interface for the existing `orkexa` library**, not a reimplementation of the
underlying agent logic.
