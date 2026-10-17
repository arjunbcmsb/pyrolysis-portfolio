# Pyrolysis of Plastics

An interactive 3D learning experience that makes a complex chemical engineering process visible.

**A product case study by Arjun Chandra: product strategy, MVP delivery and hands-on development.**

[Try the live product](https://pyrolysis3d.vercel.app/) · [Explore the simulation](https://pyrolysis3d.vercel.app/#simulation) · [Connect on LinkedIn](https://www.linkedin.com/in/arjunbcmsb/)

![The portfolio website with an illustrated reactor and navigation to the introduction, design, simulation and product role.](docs/images/portfolio.png)

## The problem

Textbooks explain the chemistry of plastic pyrolysis, but students cannot easily see what happens inside the reactor. The challenge was to turn that hidden sequence into an experience they could follow, replay and discuss.

**Primary users:** chemical engineering students. **Product goal:** help them visualise the process through an interactive 3D application.

## My role

I led a three-student team across chemical engineering and computer science. I owned the product vision, MVP backlog, roadmap and delivery, alongside the Unity application and its software development. The chemical engineering work and calculations were handled by my teammates.

| Responsibility | Contribution |
| --- | --- |
| Vision and scope | Defined the educational goal, wrote user stories and acceptance criteria, and shaped the MVP backlog. |
| Prioritisation and delivery | Prioritised the core learning sequence, managed milestones and delivered the application despite resource constraints. |
| Experience and implementation | Translated the process into 3D models, animation, C# interactions and explanations synchronised with the simulation. |
| Feedback and communication | Gathered qualitative feedback from professors and students, and presented the project to academic stakeholders. |
| Web delivery | Extended the Windows application into a browser experience with a public demo, project context and an AI-powered assistant. |

## Product decisions

| Need or constraint | Decision | Trade-off |
| --- | --- | --- |
| Students need to understand a process they cannot see. | Use a semi-transparent reactor, moving particles and a rotating screw. | Prioritise visibility of the sequence over a fully opaque industrial appearance. |
| Animation alone does not explain the chemistry. | Synchronise short explanations with each stage. | Keep detail brief enough to follow while watching. |
| Students need to revisit the sequence. | Include Start, Restart and Back controls. | Focus interaction on learning and replay rather than adding a complex control panel. |
| A hiring manager should be able to try the work without installing an app. | Publish the Unity Web build inside a lightweight portfolio. | The first visit still requires downloading the Unity build. |
| The web player takes time to initialise. | Show the introduction immediately, preload Unity and enable Launch only when it is ready. | Background loading improves the wait but cannot guarantee an instant launch. |
| An open AI endpoint has a limited allowance. | Keep credentials on the server, cap usage and provide prepared answers when live AI is unavailable. | Availability takes priority over unlimited chat. |

## What shipped

- **A complete learning sequence:** plastic feed, nitrogen purge, heating, polymer breakdown and product release.
- **A 3D reactor experience:** Blender models, a semi-transparent chamber, automatic screw rotation, particles and timed explanations in Unity.
- **A browser-accessible demo:** real loading progress, readiness-based launch, fullscreen, retry and image fallbacks.
- **A project assistant:** short answers about the project and pyrolysis, with topic boundaries and shared usage controls.

![The Unity teaching experience showing the reactor interior, rotating screw, particles and stage explanations.](docs/images/simulation.png)

To try it, open the [simulation](https://pyrolysis3d.vercel.app/#simulation), wait for **Launch simulation**, then select **Start** in the Unity Home scene.

## Outcome and evidence

The application was delivered and later made available through a public browser demo. Qualitative feedback from university professors and students supported its usefulness as an educational visualisation.

Validation so far is qualitative; no learning-gain or adoption metrics were collected. The working demo and source code provide direct evidence of what was delivered.

The next useful product evaluation would measure whether students can explain the process more accurately after using the application, and where they need additional guidance. This is a proposed next step, not a completed study.

## Explore the implementation

| Area | Source |
| --- | --- |
| Website and navigation | [Page](public/index.html), [styles](public/styles.css), [interactions](public/app.js) |
| Unity browser integration | [Player bridge](public/demo/player.js), [integration checks](tests/unity.test.mjs) |
| AI assistant | [API endpoint](api/chat.mjs), [curated knowledge](server/knowledge.mjs), [answer checks](tests/chat.test.mjs) |
| Usage protection | [Shared budget](server/budget.mjs), [budget checks](tests/budget.test.mjs) |
| Optional statistics | [Consent controls](public/analytics.js), [consent checks](tests/analytics.test.mjs) |

**Stack:** Unity, C#, Blender, HTML, CSS, JavaScript, Node.js, Vercel, LLM7 and Upstash Redis. The website has no npm runtime dependencies.

This repository contains the website source, server-side assistant, automated tests and compiled Unity Web export. Original Unity C# scripts, Blender source files and the private project report are not included.

## Run locally

Requires Node.js 22. No dependency installation is needed.

```sh
npm run dev
```

Open [localhost:4173](http://localhost:4173/). Without private provider configuration, the assistant uses prepared project answers. Credentials are never required to explore the website and Unity demo locally.

```sh
npm test
npm run check
```

The suite covers chat input and answer boundaries, budget reservations, analytics consent and Unity integration. [Technical setup and limitations](docs/TECHNICAL.md) describe deployment, configuration and verification scope.

## Contact

**Arjun Chandra**

[LinkedIn](https://www.linkedin.com/in/arjunbcmsb/) · [Email](mailto:arjun1300@gmail.com) · [Portfolio](https://pyrolysis3d.vercel.app/)
