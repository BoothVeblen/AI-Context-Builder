# Context Builder

_Turn AI app development into clicks, no coding skills required_

## What is Context Builder and why do we want to build it?

Following the release of the Low-Level Machine (LLM), numerous tools primarily designed for engineers, such as Flowise and Langflow, have surfaced in the no-code/low-code sphere. Yet, we believe that the crux of AI applications lies in domain knowledge and problem context. Harnessing this belief, we envision a world where anyone, not just engineers, can create customized AI applications relevant to their unique context.

To turn this vision into reality, an improved tool is essential. That's where our project, 'Context Builder', comes into play. The aim is to democratize the creation of AI applications by offering a tool that is not only powerful but also accessible to all.

Our project is guided by the following principles:

- Absolute No-Code: No coding knowledge required.
- User-Friendly: Simplicity and ease of use are key.

We believe LLM will dramatically decrease the requirements to build AI apps and ultimately any individual could use tools to build the AI application, and that's what we want to build.

https://github.com/54microlong/builder/assets/530382/7f61c534-dbd3-4e8f-9cb3-65d3f2faaf38

## ✨ Feature

- Workflow
  - [x] LLM Conversation
  - [x] Conversational REtrieval QA
  - [x] Goal-Oriented Conversation
- Documents integration
  - [x] PDF documents.
  - [x] Word documents.
  - [ ] Google Doc
  - [ ] Notion
- Use it anywhere
  - [x] Website
  - [x] Slack
  - [ ] Discord
- Analysis and dashboard
  - [x] App monitor and analysis
  - [x] Conversation logs
  - [x] Annotation
- Rich Multimedia Support
  - [x] Video Conversation

## 🚀 Quick Start / Live Demo

Live demo: https://build.withcontext.ai

or

Run the app locally:

1. Copy `.env.example` to `.env.local` and modify the values accordingly.
2. [Install Docker](https://docs.docker.com/get-docker/) on your machine.
3. Run `docker compose up`
4. Visit `http://localhost:3000`

## 🧑‍💻 Contributing

### Opening issues

Before you submit an issue, please check all existing [open and closed issues](https://github.com/withcontext-ai/builder/issues) to see if your issue has previously been resolved or is already known. If there is already an issue logged, feel free to upvote it by adding a 👍 [reaction](https://github.com/blog/2119-add-reactions-to-pull-requests-issues-and-comments). If you would like to [submit a new issue](https://github.com/withcontext-ai/builder/issues/new/choose), please fill out our Issue Template to the best of your ability so we can accurately understand your report.

### Good first issues

We have a list of [good first issues](https://github.com/withcontext-ai/builder/labels/good%20first%20issue) that contain bugs that have a relatively limited scope. This is a great place to get started, gain experience, and get familiar with our contribution process.

### Building additional features

To contribute to this project, we follow a ["fork and pull request"](https://docs.github.com/en/get-started/quickstart/contributing-to-projects) workflow. Please do not try to push directly to this repo unless you are a maintainer.

First, please [fork this repository](https://github.com/withcontext-ai/builder/fork).

Then clone your GitHub forked repository to your local machine:

```bash
git clone https://github.com/<your_github_username>/builder.git
```

Run the following commands at root directory:

```bash
# install dependencies
pnpm install

# run dev server
pnpm dev
```

Now you can start making changes to the code. Once you are done, please submit a pull request to the `main` branch of this repository. We will review your pull request and merge it if everything looks good.

For all Pull Requests, you should be extremely descriptive about both the problem and the proposed solution. If there are any affected open or closed issues, please include the issue number in your PR message.

Did you have an issue, like a merge conflict, or don't know how to open a pull request? Check out [GitHub's pull request tutorial](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests) on how to resolve merge conflicts and other issues. Once your PR has been merged, you will be proudly listed as a contributor in the [contributor chart](https://github.com/withcontext-ai/builder/graphs/contributors).

### Troubleshooting

Make sure you have these dependencies installed:

- [Git](https://git-scm.com/downloads)
- [Node.js](https://nodejs.org/en/download/) (>=16.17.0)

[Enable Corepack](https://pnpm.io/installation#using-corepack) to use `pnpm` as the package manager:

```bash
corepack enable
```

If you use VS Code, we recommend installing the following extensions:

- [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)
- [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)

## 📚 Recommended Reading

Libraries and tools used in this project:

- [React](https://react.dev/learn)
- [Next.js](https://nextjs.org/docs)
- [shadcn/ui](https://ui.shadcn.com/)
  - [Tailwind CSS](https://tailwindcss.com/)
  - [Radix](https://www.radix-ui.com/)
  - [React Hook Form](https://react-hook-form.com/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright](https://playwright.dev/docs/writing-tests)
- [Monorepo Handbook](https://turbo.build/repo/docs/handbook)
