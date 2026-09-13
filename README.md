<div align="center">

# AI Fundamentals in 3 Hours

**From your first LLM API call to a working agent loop.**
A hands on workshop for people who have never written code that talks to a language model.

<br>

![LangChain](https://img.shields.io/badge/LangChain-1.4-CC785C?style=for-the-badge&labelColor=141413)
![Python](https://img.shields.io/badge/Python-3.10%20to%203.13-D4A27F?style=for-the-badge&labelColor=141413)
![Notebooks](https://img.shields.io/badge/Notebooks-6-86A98C?style=for-the-badge&labelColor=141413)
![Slides](https://img.shields.io/badge/Slides-39-7E9FB4?style=for-the-badge&labelColor=141413)
![Runtime](https://img.shields.io/badge/Full%20run-90%20seconds-EBDBBC?style=for-the-badge&labelColor=141413)

<br>

`LLM calls` &nbsp;·&nbsp; `Messages` &nbsp;·&nbsp; `Tokens & cost` &nbsp;·&nbsp; `Structured output` &nbsp;·&nbsp; `RAG` &nbsp;·&nbsp; `Tool calling` &nbsp;·&nbsp; `Agents`

</div>

<br>

## Quick start

```bash
git clone <this-repo> && cd aiforbeginners
./setup.sh                 # creates .venv, installs everything, registers the Jupyter kernel
# put your OpenAI key in .env
./start.sh                 # launches Jupyter from this project's environment
```

Run the first two cells of `01_first_llm_call.ipynb`. You should see:

```
ready | openai:gpt-4.1-mini
```

> Prefer to verify first? `./setup.sh --check` sets up **and** runs all six notebooks end to
> end. Takes about 90 seconds and costs a few US cents on `gpt-4.1-mini`.

<br>

## What is inside

| | |
|:--|:--|
| **`AI-Fundamentals-Workshop.html`** | The slide deck. One self contained file, opens in any browser, works offline. |
| **`notebooks/`** | Six runnable notebooks. This is where the workshop actually happens. |
| **`deck/`** | Deck source: slides, styles, GSAP timelines, and the measured data behind the animated slides. |
| **`data/`** | Three sample policy documents for the RAG section. |
| **`assets/drawio/`** | Editable diagram sources for the four main diagrams. |
| **`CHEATSHEET.md`** | One page. Every LangChain import and method used in the workshop. |
| **`setup.sh` `start.sh`** | Create the environment, and launch Jupyter with the right kernel. |
| **`check_env.py`** | Run it when a cell fails. Says which Python is running and what is missing. |

<br>

## The notebooks

Each one stands alone, builds on the last, and ends with exercises.

<table>
<tr><td width="34"><b>1</b></td><td width="240"><b><code>01_first_llm_call</code></b></td>
<td>Your first call. Message objects, system prompts, statelessness, memory by hand and then with a checkpointer, and switching providers by changing one string.</td></tr>

<tr><td><b>2</b></td><td><b><code>02_tokens_and_cost</code></b></td>
<td>What a token is, why Indian language text costs more, reading <code>usage_metadata</code>, a cost calculator you can take to work, and trimming a growing conversation.</td></tr>

<tr><td><b>3</b></td><td><b><code>03_structured_output</code></b></td>
<td>Why "please reply in JSON" fails at scale, <code>with_structured_output</code>, designing a schema the model reads well, and batch extraction.</td></tr>

<tr><td><b>4</b></td><td><b><code>04_rag</code></b></td>
<td>Split, embed, store, retrieve. Building the augmented prompt by hand, then as a chain. Grounding, citations, and where retrieval actually fails.</td></tr>

<tr><td><b>5</b></td><td><b><code>05_tool_calling</code></b></td>
<td>The <code>@tool</code> decorator, <code>bind_tools</code>, reading <code>tool_calls</code>, completing the round trip by hand, and the limit that makes a loop necessary.</td></tr>

<tr><td><b>6</b></td><td><b><code>06_agent_loop</code></b></td>
<td>The loop written out, then <code>create_agent</code>. Recursion limits, memory, a human approval gate, and every piece of the workshop assembled into one agent.</td></tr>
</table>

<br>

## The deck

Open `AI-Fundamentals-Workshop.html` in any browser. No server, no install, no network.

<table>
<tr><td><kbd>→</kbd> <kbd>Space</kbd></td><td>Next step, then next slide</td>
    <td><kbd>N</kbd></td><td>Speaker notes</td></tr>
<tr><td><kbd>←</kbd></td><td>Back</td>
    <td><kbd>O</kbd></td><td>Overview of all slides</td></tr>
<tr><td><kbd>↑</kbd> <kbd>↓</kbd></td><td>Skip a whole slide</td>
    <td><kbd>T</kbd></td><td>Presenter timer</td></tr>
<tr><td><kbd>F</kbd></td><td>Fullscreen</td>
    <td><kbd>?</kbd></td><td>All controls</td></tr>
</table>

Several slides reveal in steps. Press <kbd>→</kbd> rather than jumping ahead.

### Animated with real data

Four slides run GSAP timelines over numbers that were **measured, not invented**.

| Slide | Shows | Where the numbers come from |
|:--|:--|:--|
| **24** | Text turning into numbers | Real vectors, first 8 of 1,536 dimensions |
| **25** | Words landing near their meaning | Real embeddings, PCA to 2D, 31% of variance kept |
| **26** | Retrieval scoring live | Measured cosine similarity, top score 0.385 |
| **33** | A ReAct loop, step by step | A real 3 round agent run, captured from notebook 06 |

Slide 33 advances one loop step per keypress. Slides 24 to 26 use a light background so the
worked examples read brighter than the explanation slides.

To edit the deck, change `deck/slides.html` then run `node deck/build.mjs`.

<br>

## Run of show

| Time | Slides | Notebook |
|:--|:--|:--|
| 8:00 | **1 to 9** &nbsp; What AI engineering is, the roles, the roadmap | |
| 8:20 | **10 to 14** &nbsp; LLM as an API, why LangChain, messages, statelessness | `01_first_llm_call` |
| 8:50 | **15 to 18** &nbsp; Tokens, context windows, cost, temperature | `02_tokens_and_cost` |
| 9:15 | **19 to 21** &nbsp; Structured output, and what still breaks | `03_structured_output` |
| 9:30 | *break, 10 minutes* | |
| 9:40 | **22 to 28** &nbsp; RAG: split, embed, retrieve, ground | `04_rag` |
| 10:10 | **29 to 31** &nbsp; Tools and the round trip | `05_tool_calling` |
| 10:35 | **32 to 35** &nbsp; The agent loop, workflow vs agent, guardrails | `06_agent_loop` |
| 10:55 | **36 to 39** &nbsp; Recap, what to learn next, questions | |

<br>

## Why LangChain

Every provider has its own SDK, its own response shape, its own name for the token count.
Learn one and you have learned one.

```python
# same code, any provider. Only the string changes.
model = init_chat_model("openai:gpt-4.1-mini")
model = init_chat_model("anthropic:claude-sonnet-4-5")
model = init_chat_model("google_genai:gemini-2.0-flash")
model = init_chat_model("ollama:llama3.2")          # runs on your laptop
```

The same objects carry from that first `invoke` up through retrievers, tools and agents, and
on into LangGraph and LangSmith. The notebooks demonstrate that rather than asserting it, and
one cell prints the exact JSON LangChain builds, so nothing about it stays magic.

<br>

## Troubleshooting

<details>
<summary><b>A cell says it cannot find langchain</b></summary>
<br>

Almost always the wrong kernel is selected. The `jupyter` on your PATH is probably Anaconda's,
and Anaconda's Python does not have this project's packages.

Run this in a notebook cell:

```python
%run ../check_env.py
```

If it reports `using project venv: NO`, switch kernel:

- **Jupyter Lab:** click the kernel name top right, choose **Python (AI Fundamentals)**
- **VS Code or Cursor:** click **Select Kernel** top right, then *Python Environments*, then `.venv`
- **Simplest:** close it and launch with `./start.sh`, which cannot pick the wrong one

</details>

<details>
<summary><b>A call fails with <code>Connection error</code></b></summary>
<br>

This only happens in **Anaconda or conda** environments, which ship an old Brotli the HTTP
client cannot use. The traceback mentions `process() takes no keyword arguments`.

```bash
pip install --upgrade "Brotli>=1.1.0"
```

A clean venv built by `setup.sh` never hits this.

</details>

<details>
<summary><b>Setting it up by hand</b></summary>
<br>

```bash
python3.12 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python -m ipykernel install --user --name aiforbeginners --display-name "Python (AI Fundamentals)"
cp .env.example .env        # then add your key
```

Python **3.10 to 3.13**. LangChain 1.0 does not support 3.9, and some wheels are not yet
built for 3.14.

</details>

<details>
<summary><b>Optional: tracing with LangSmith</b></summary>
<br>

Add a free `LANGSMITH_API_KEY` to `.env` and set `LANGSMITH_TRACING=true`. Every step of every
notebook then appears at [smith.langchain.com](https://smith.langchain.com) with its tokens
and its cost. You do not change a line of code.

</details>

<br>

## Where this goes next

| Track | Focus |
|:--|:--|
| **LangSmith and evals** | Tracing, and a test set you score every change against. Start here. |
| **LangGraph** | Custom control flow, branching, durable state. |
| **Deep Agents** | Planning, subagents, long horizon memory. |
| **Production** | Prompt injection review, rate limits, fallbacks, model upgrades. |

Docs for all of it: [docs.langchain.com](https://docs.langchain.com)

<br>

---

<div align="center">

**Data Sense** &nbsp;·&nbsp; Workshop materials

*You do not need to build LLMs. You need to build with them.*

</div>
