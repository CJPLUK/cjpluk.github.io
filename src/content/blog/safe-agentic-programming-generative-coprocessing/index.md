---
title: "Safe Agentic Programming: From the Agentic Loop to Generative Co-processing"
description: "Prof. Dan Ghica proposes generative co-processing: deterministic programs that delegate only non-algorithmic operations to LLMs, supported by Cangjie's language foundations."
date: "09/09/2026"
authors:
  - "Dan Ghica"
tags:
  - "AI"
  - "Agents"
  - "Research"
descriptionImage: "./figures/cover.jpg"
---

# Safe Agentic Programming: From the Agentic Loop to Generative Co-processing

This article was first published by Prof Dan Ghica on Chaspark, Huawei's open science and technology forum, on 3 September 2026. Reposted here in full: [https://www.chaspark.com/#/hotspots/1314122358851256320](https://www.chaspark.com/#/hotspots/1314122358851256320)

## Summary

This article addresses the limitations of current stochastic, loop-driven AI agent architectures, such as high latent cost, opacity, race conditions, and context-window bottlenecks, and proposes a shift toward something we call generative co-processing. Under this model, overall system control is driven procedurally and deterministically, delegating to large language models (LLMs) only non-algorithmic operations (e.g., natural language synthesis or image understanding). By shifting the emphasis of development to procedural, verified programs, even if themselves synthesized by agents initially, systems achieve higher predictability, speed, efficiency, and safety.

We highlight how programming language features, specifically within the Cangjie language (algebraic effect handlers, actor concurrency, modal type systems, and external dynamic types), provide foundational support for this paradigm. Finally, we outline future requirements for agent-centric language capabilities, notably provenance tracking and type-level trust guarantees to categorize data and code across a continuous spectrum of trustworthiness, making constly post-synthesis validation unnecessary whenever possible.

## Introduction: Concurrency and Context

Currently, much agentic code (e.g. Claude Code) operates within a continuous discrete loop. The operational sequence begins with an input, which is subsequently decomposed into discrete tasks. Certain tasks are processed directly by the model, while others are delegated to external tools. The process executes continuously until all tasks are resolved, which includes managing workflow progress as well as addressing potential failures, such as handling failed tests.

A more complex category of failures involves the agent itself, specifically issues related to the underlying model, such as losing communication with the hosting cloud system or exceeding the context window limit. The loop can also terminate with a failure if certain issues cannot be resolved or if the maximum number of iterations is exceeded, at which point human intervention becomes necessary.

Within the traditional agentic loop, two critical issues arise: context management (determining what information is shared between tasks) and cache management. Unplanned or thoughtless modifications to the context can trigger expensive cache misses, requiring reinterpretation of the entire context and consuming a vast quantity of tokens.

The context functions much like a global state within a traditional program. Because the context is shared among all tasks, parallelism and concurrency become particularly complex due to potential race conditions within the context. Consequently, significant agentic loop implementations like Claude Code remain fundamentally sequential in nature.

Agents also interact heavily with the local file system by generating source code, reports, and diagrams, introducing another form of global state that is vulnerable to race conditions. Furthermore, the authority an agent possesses to access tools is a significant concern; because some tool actions can be highly destructive, access must be managed and restricted carefully without compromising the overall functionality and expressiveness of the system.

## Programming Language Foundations

Error recovery, safe concurrency, and robust permission models are all foundational topics in modern programming language research. While these concepts may not yet be commonplace in all standard production languages, they are set to become increasingly useful as agentic systems become more widespread.

Our Cangjie programming language is well-positioned for this future, supporting certain language features that can advance agent capabilities and safety:

- Effect Handlers for efficient, expressive, and compositional error recovery.
- Modal Type Systems for state competency, safe distribution, and robust concurrency control.
- Actor Systems for isolated state management and safe concurrent message-passing across agent boundaries.
- External Type System using dynamic features for interoperability, facilitating seamless interaction with other programming languages, empowering agents to invoke external functionality cleanly.

As an aside, to fully facilitate the development and deployment of next-generation agents, operating system infrastructure must also evolve. In particular, it would be highly beneficial to open up operating systems like HarmonyOS Next, which currently follows a relatively closed model similar to iOS. An open interoperability system on the OS level would offer high expressiveness and provide a platform that the cross-language interoperability capabilities being developed for Cangjie can greatly exploit in the development of powerful yet safe agents.

## Redefining Autonomy: Generative Co-processing

Standard agentic loops generally rely on a fixed mechanism for decomposing large tasks into subtasks, which are then executed in a straightforward queue with basic error retries. Furthermore, this decomposition process is often opaque, as external controls lack visibility into how tasks are divided; the harness treats all tools identically, so that semantic relationships become blurred. For instance generation and validation are totally different in nature, but right now we must hope the model can discover and exploit such relationships.

While autonomous, fully agentic loops are easy to develop, often from a few prompts, they remain expensive, slow, and unpredictable in execution, as compared to conventional software which is free to run (no tokens), fast (even compared to a local model) and deterministic (if correct, at least). Conversely, tasks such as visual perception, image synthesis, natural language recognition, and natural language synthesis cannot yet be solved algorithmically and fundamentally require model intelligence.

We propose a shift towards what we call generative co-processing. In this architecture, an agent system is fundamentally a deterministic program that only delegates specific non-algorithmic operations to one or more LLMs acting as specialized coprocessors. When the structural relationships between tools and tasks are known, execution is handled procedurally, while LLMs are invoked selectively for operations that inherently defy procedural implementation.

This approach offers major advantages in performance, predictability, and cost efficiency. Furthermore, explicitly coding the control flow allows developers to precisely route tasks to different model tiers based on power and cost requirements. Finally, using agentic programming techniques the development of such specialised programs can be remarkably fast.

The balance between procedural and generative software development can be struck in various ways. For instance, our experimental system, [Cliver](https://gitcode.com/Cangjie-SIG/cliver4cj), takes a contrasting approach by transforming any Cangjie library into a web-based command-line interface accessible directly by AI models. This perspective also challenges the prevailing paradigm that seeks to maximize agent autonomy.

The core principle we advocate is quite radical:

> Whenever possible, the weight of development should shift toward procedural programming rather than relying on models.

Although these procedural programs may themselves be synthesized with the assistance of programming agents, once created, they can undergo thorough specification, testing, verification, and validation. The end result is software that is deterministic, verifiably safe, fast, and significantly more reliable, using agentic power to build structures that ultimately reduce our long-term reliance on runtime autonomous agents.

## A simple case study: TTR

We will show how even a relatively simple computation can be difficult to ascertain when executed agentically: token-type ratio, which is a statistical measure of vocabulary diversity for a piece of text.

The tasks is simple: given an URL, download the raw text and compute its TTR.

For the text of Jane Austen's Pride and Prejudice at the Project Gutenberg site, this is the output produced by Gemini, ChatGPT and Groq vs a Python script:

| Model  | TTR  | Seconds  | Tokens  |
| --- | --- | --- | --- |
| Gemini Flash  | 0.0519  | 0.84  | 134k  |
| ChatGPT Instant  | 0.0726  | 0.01  | 121k  |
| Groq Fast  | 0.0544  | 0.48  | 131k  |
| None (Python)  | 0.0570  | 0.02  | 0  |

The discrepancies are significant, with ChatGPT giving a result which is implausible both in terms of TTR and seconds expended. Why is that?

Examining the intermediate output of the models it is quite obvious that the overall task is broken down into elementary tasks (downloading, tokenisation, TTR itself) in the agentic loop. But how the instructions are interpreted can slightly differ: Are we downloading the HTML or the the ASCII representation of the rendering? What are the exact tokenization rules?

The choices made by agents are opaque and cannot be inspected, so cannot be trusted. On the other hand, the Python script, which was itself one-shotted by Cursor, can be easily inspected, tested, and adapted so its TTR score is by far the most plausibile. Not to mention the fact that it is 20-40x faster (excluding the implausible ChatGPT timing, itself problematic) than the models and uses no tokens during execution.

## Generative Co-processing vs. Agent Graphs

The proposal for generative co-processing represents a deliberate effort to ground agentic programming in established software engineering and programming language principles. By contrast, some novel paradigms such as'agent graphs', which have similar aims, often function as hastily constructed methodologies, introducing several problematic challenges:

- Excessive Complexity and Overhead: Critics of graph-based architectures frequently observe that graphs impose unnecessary structure. Forcing straightforward tasks into complex graph topologies via customisations creates unnecessary operational overhead. Every additional orchestration layer introduces potential failure points and latency, while also increasing both token consumption and debugging difficulty.
- Terminological Ambiguity: Newfangled terms such as'graph' are applied inconsistently within the AI community, often conflating data-centric knowledge graphs with flow-based orchestration. This ambiguity masks the fact that much of'graph engineering' simply repackages decades-old software design patterns such as state machines and directed acyclic graphs (DAGs), without carefully observing the foundational literature.
- Over-Engineering Bounded Tasks: All real-world engineering workflows can be effectively and efficiently programmed using general purpose languages, such as Cangjie. One of the main advantages of agentic programming is that we can move away from needless layers of abstraction. It seems against the spirit of agentic programming to configure and customize a'graph', a complex piece of orchestration software, when a custom program that only implements the desired functionality can be quickly programmed with the help of agents.
- Misplaced Expectations of Performance: While graph architectures theoretically enable parallel task execution, this advantage is frequently overstated. Parallelism is a specific optimization; when applied to tasks that do not inherently require simultaneous execution, the overhead of orchestrating a graph structure often results in higher costs and increased complexity, rather than improved efficiency. It is a general principle that parallelism is more easily programmed into a specialized system, rather than tacked onto as an optimization on a general purpose system.

## Future Directions: Provenance and Capability

What currently absent features should Cangjie adopt next to support agent development? One potentially useful area is provenance, i.e. knowing precisely how an output was produced.

In an agentic system, it is essential to trace the lineage of an output: is it derived directly from a trusted source, processed by trusted algorithmic code, or synthesized directly by a generative model? This includes differentiating between rigorously validated outputs, formally verified code, and code that has merely been "vibed. "This distinction will make the end user be able to discern between outputs that are potentially hallucinated versus those who have a higher level of assurance.

A complex agent typically incorporates a sophisticated mix of trusted and untrusted code, input, and output. While "trusted" and "untrusted" are used here for simplicity, in practice, trustworthiness spans a continuous spectrum. If the agent framework itself can provide type-level guarantees regarding output trustworthiness, expensive downstream verification and validation steps can be safely omitted. Uncoincidentally, capturing this spectrum of trust is a capability that could be naturally integrated into the general modal type system framework currently under development for Cangjie.

Capabilities represent another programming language feature that has been studied extensively, offering potential mechanisms to manage authority and access in agentic systems. Integrating such mechanisms into Cangjie' s modal type framework would provide a structured approach to enforcing security and resource control at the type level, complementing the system's existing type-level trust guarantees.

## Conclusion

The proposed shift to generative co-processing comes at a time when the AI architectural patterns are not set yet. We consider prioritizing deterministic control and software engineering rigor over full reliance on stochastic loops to be the desirable methodology. By leveraging languages like Cangjie to embed type-level trust, concurrency, and procedural structure, developers can build agents that are not only more predictable, efficient, and secure but also less reliant on the overhead of runtime autonomy. Ultimately, the future of agentic systems lies in our ability to design reliable, verifiable programs that seamlessly integrate the generative capabilities of LLMs as specialized components rather than the primary driver of execution.
