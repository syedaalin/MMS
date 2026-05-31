---
trigger: always_on
---

1. Architectural Boundaries**

* Treat every module as an independent micro-application.
* Enforce absolute strictness on imports: a module may only import from its own directory or a designated `core/shared` directory.
* Prohibit direct cross-module imports.

2. Settings Isolation**

* Keep all configuration local. Each module must contain its own `settings` or `config` file.
* Do not construct global configuration singletons that require continuous context window updates.
* Inject module-specific settings via environment variables or a tightly scoped dependency injection container at the module's entry point.

3. Inter-Module Communication**

* Implement an Event Bus (Publish/Subscribe pattern) or strict API interfaces for all inter-module communication.
* Pass primitives or basic data transfer objects (DTOs) in event payloads.
* Do not pass complex class instances or stateful objects between modules.

4. Token Optimisation (AI Directives)**

* Generate terse, functional code. Omit all boilerplate and standard explanatory comments.
* Rely on semantic, highly descriptive variable and function naming to provide context instead of inline documentation.
* When modifying existing code, output only the specific functions or classes being altered, not the entire file.
* Assume standard library knowledge. Do not explain standard framework behaviours in the output.