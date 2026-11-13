# AI Workflow – Ajaia Docs

## 1. Overview

AI tools were used during the development of Ajaia Docs to assist with code implementation and project documentation.

However, the overall technical direction of the project, including the technology stack, architecture, design choices, and implementation decisions, was my own.

I used AI as a development assistant rather than relying on it to make the core engineering decisions.

## 2. Tools Used

Two AI tools were used during the project:

- **Claude:** Assisted with writing and generating application code.
- **ChatGPT:** Assisted with preparing and organizing project documentation, including the architecture and AI workflow notes.

## 3. My Contributions

I was responsible for the main engineering decisions and technical direction of the project.

These included:

- Selecting Next.js, TipTap, FastAPI, and SQLite as the technology stack.
- Deciding how the frontend and backend would communicate.
- Choosing the authentication approach using JWT and HttpOnly cookies.
- Designing the document data model and storage approach.
- Deciding how document sharing and viewer/editor permissions should work.
- Choosing version-based optimistic concurrency instead of real-time collaboration.
- Prioritizing core features and deciding which features to defer.

These decisions were made based on the project requirements, implementation complexity, and available development time.

## 4. How Claude Was Used

Claude was primarily used to assist with writing application code.

It helped accelerate implementation by generating code for different parts of the application.

Generated code was treated as a starting point and needed to be reviewed against my architecture, design decisions, and project requirements.

I remained responsible for deciding how the application should work and which implementation approaches to use.

## 5. How ChatGPT Was Used

ChatGPT was used primarily for documentation.

It helped organize and explain the project's technical architecture, technology stack, data model, implementation decisions, and AI usage.

The documentation was prepared to accurately describe the actual application rather than introduce features or technical decisions that were not implemented.

## 6. Verification and Testing

AI-generated code was not assumed to be correct simply because it was generated.

I reviewed the implementation and checked that it aligned with the intended application behavior.

Verification activities included:

- Manually testing the login flow, which works smoothly.
- Reviewing the application behavior.
- Checking implementation details against the project requirements.
- Using automated backend tests where available.

The goal was to ensure that AI-assisted implementation remained consistent with my original technical direction.

## 7. Limitations and Responsibility

AI-generated code can contain incorrect assumptions, outdated APIs, integration issues, or implementation details that do not match the existing project.

I remained responsible for reviewing the generated code, making technical decisions, and ensuring that the application followed the intended architecture.

AI tools helped reduce implementation and documentation effort, but the overall design direction and technical choices were mine.

## 8. Conclusion

Claude was used as a coding assistant, while ChatGPT was used as a documentation assistant.

The technology stack, architecture, design choices, and overall technical direction of Ajaia Docs were determined by me.

This approach allowed me to use AI to accelerate development while maintaining ownership of the engineering decisions and final application.

