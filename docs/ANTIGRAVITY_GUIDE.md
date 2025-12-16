# Getting the Most Out of Antigravity

Welcome! You are working with **Antigravity**, an advanced AI coding environment. This guide explains the core concepts—Agents, Artifacts, and MCP Servers—and how to use them to supercharge your workflow.

---

## 1. The Agent (Me)

I am an **Agentic AI** powered by Gemini. Unlike a simple chatbot, I can:

- **Edit Files**: I can read, write, and create files in your workspace.
- **Run Commands**: I can execute terminal commands (with your permission).
- **Plan Complex Tasks**: I can break down large objectives into smaller steps and execute them autonomously.

### Modes

I operate in different "modes" to match your needs:

- **Chat Mode** (Normal): Good for Q&A, simple explanations, or single-file edits.
- **Agentic Mode** (Task View): When you give me a complex task, I enter a focused mode. I create a plan, track my progress in a `task.md` file, and execute steps one by one. You'll see a special UI showing my current task status.

---

## 2. The Brain (Artifacts)

When I work on complex tasks, I create "Artifacts" to keep us organized. These are files stored in a special `.gemini` folder, but I present them to you clearly:

- **`task.md`**: My checklist. I update this in real-time as I complete steps.
- **`implementation_plan.md`**: My blueprint. Before writing complex code, I'll draft this for your approval.
- **`walkthrough.md`**: My proof-of-work. After finishing, I'll often create this to show you what I changed and how to test it.

**Tip**: You can always ask me to "update the plan" or "check the task list" if you're lost.

---

## 3. MCP Servers (Power Tools)

**MCP (Model Context Protocol)** servers are like "plugins" that give me super-powers. Without them, I'm just looking at text files. *With* them, I can interact with external services.

Here are the tools currently available in your environment and what I can do with them:

### A. GitKraken (Version Control)

Allows me to interact deeply with Git and external services like GitHub/GitLab.

- **What I can do**: Create branches, manage pull requests, comment on issues, and visualize repository history.
- **Status**: *Requires Authentication*. You currently need to sign in to enable these features.
- **Try it**: Ask me "List my GitKraken workspaces" or "Check my PRs".

### B. Firebase (Backend & Hosting)

Deep integration with your Firebase projects.

- **What I can do**: Manage database rules, deploy your application, check deployment status, and inspect project configuration.
- **Best Use**: "Deploy my security rules", "List my Firebase projects", or "Check my production environment config".

### C. Cloud Run (Deployment)

Google Cloud's serverless container platform.

- **What I can do**: Deploy your application as a container to Google Cloud.
- **Best Use**: "Deploy this app to Cloud Run" or "Check the logs of my service".

### D. Google Maps Platform (Geospatial)

Expert knowledge on maps and location data.

- **What I can do**: Provide accurate code snippets for maps, routing, and places API. I can help debug map rendering issues or optimize location queries.
- **Best Use**: "Help me add a map to this page" or "How do I calculate routes between these points?"

---

## 4. Pro Tips for Maximum Power

1. **Authorize Me**: If I try to use a tool (like GitKraken) and it fails with a login request, follow the link I provide. Once authorized, I can do much more.
2. **Be Specific**: Instead of "Fix the code", try "Use the Maps tool to fix the zoom issue on the Meeting Finder."
3. **Ask for Plans**: For big features, ask "Create an implementation plan for X". This forces me to think through the architecture before typing code, reducing bugs.
4. **Review My Work**: When I present an `implementation_plan.md`, read it! Your feedback there saves hours of time later.

## 5. Next Steps

To get started with your current setup:

1. **Sign in to GitKraken** (if you want me to manage PRs/Issues).
2. **Verify Firebase**: Ask me to "list my firebase projects" to confirm I can see your production environment.
3. **Explore**: Try asking "What can you tell me about the architecture of this project?" and I'll use my codebase search tools to analyze it.

---
*Created by Antigravity*
