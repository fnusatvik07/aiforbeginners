# LangChain cheat sheet, everything used in this workshop

One page. Every import and method from the three hours.

---

## Setup

```python
from langchain.chat_models import init_chat_model

model = init_chat_model("openai:gpt-4.1-mini", temperature=0)
```

Provider string is `provider:model`. Swap it to swap vendors, nothing else changes.

```
openai:gpt-4.1-mini            anthropic:claude-sonnet-4-5
google_genai:gemini-2.0-flash  groq:llama-3.3-70b-versatile
ollama:llama3.2                mistralai:mistral-large-latest
```

---

## 1 · Calling a model

```python
reply = model.invoke("a plain string works")
reply = model.invoke([SystemMessage("..."), HumanMessage("...")])

reply.content                              # the text
reply.usage_metadata["input_tokens"]       # same shape for every provider
reply.usage_metadata["output_tokens"]
reply.response_metadata["finish_reason"]   # stop | length | tool_calls
```

`invoke` · `batch` · `stream` work on **everything:** models, tools, retrievers, chains, agents.

### Messages

```python
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage, ToolMessage
```

| class | role | written by |
|---|---|---|
| `SystemMessage` | system | you, the developer |
| `HumanMessage` | user | your end user |
| `AIMessage` | assistant | the model |
| `ToolMessage` | tool | your code, returning a tool result |

Dicts and tuples also work: `{"role": "user", "content": "hi"}` · `("user", "hi")`

---

## 2 · Tokens and cost

```python
model.get_num_tokens_from_messages(messages)   # count before you send

from langchain_core.messages import trim_messages
trim_messages(history, max_tokens=300, token_counter=model,
              strategy="last", include_system=True, start_on="human")
```

Cost = `(input_tokens / 1e6) * rate_in + (output_tokens / 1e6) * rate_out`

| model | in $/1M | out $/1M |
|---|---|---|
| `gpt-4.1-nano` | 0.10 | 0.40 |
| `gpt-4.1-mini` | 0.40 | 1.60 |
| `gpt-4.1` | 2.00 | 8.00 |
| `text-embedding-3-small` | 0.02 | |

*Rates checked on the workshop date. Always confirm on the provider's pricing page.*

---

## 3 · Structured output

```python
from pydantic import BaseModel, Field
from typing import Literal, Optional

class Ticket(BaseModel):
    """What this record represents - the model reads this too."""
    category:   Literal["refund", "shipping", "payment"]      # enums, not free strings
    amount_inr: Optional[int] = Field(None, description="rupees, null if none")
    priority:   Literal["low", "medium", "high"]

triage = model.with_structured_output(Ticket)
ticket = triage.invoke(text)        # a real Ticket object
tickets = triage.batch(many_texts)  # runs in parallel
```

Field names and descriptions are prompt engineering. Write them for the model.

---

## 4 · RAG

```python
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings
from langchain_core.vectorstores import InMemoryVectorStore

docs   = [Document(page_content=text, metadata={"source": name})]
chunks = RecursiveCharacterTextSplitter(
             chunk_size=700, chunk_overlap=120,
             separators=["\n## ", "\n\n", "\n", " ", ""],
         ).split_documents(docs)

store     = InMemoryVectorStore.from_documents(chunks, OpenAIEmbeddings(model="text-embedding-3-small"))
retriever = store.as_retriever(search_kwargs={"k": 4})

found = retriever.invoke("question")
store.similarity_search_with_score("question", k=4)     # with scores, for debugging
```

Going to production changes **one line**:

```python
from langchain_chroma import Chroma                  # pip install langchain-chroma
store = Chroma.from_documents(chunks, embeddings, persist_directory="./chroma_db")
```

### As a chain

```python
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough

def format_docs(docs):                                  # your own helper
    return "\n\n".join(f"[{d.metadata['source']}]\n{d.page_content}" for d in docs)

chain = ({"context": retriever | format_docs, "question": RunnablePassthrough()}
         | prompt | model | StrOutputParser())
chain.invoke("question")
```

**Always put this in your system prompt:**
> Answer using ONLY the context provided. If the answer is not in the context, say
> "I don't know". Cite the [source] of every claim.

---

## 5 · Tools

```python
from langchain_core.tools import tool

@tool
def get_order_status(order_id: str) -> dict:
    """Look up the live status and ETA of a customer order.

    Use whenever the user asks where their order is.
    Do NOT use for orders older than 90 days.

    Args:
        order_id: The numeric order id, e.g. 48213
    """
    return db.query(...)
```

The **docstring is the interface:** the model reads it to choose. Say when *not* to use it.

```python
model_with_tools = model.bind_tools([get_order_status])
reply = model_with_tools.invoke(messages)

reply.tool_calls        # [{"name": ..., "args": {...}, "id": ...}]  args is a dict
reply.content           # empty when it asked for a tool instead of answering

tool_msg = get_order_status.invoke(reply.tool_calls[0])   # returns a ToolMessage
messages += [reply, tool_msg]                             # then call again
```

> **The model never runs your code. It asks you to.** That gate is where safety lives.

---

## 6 · Agents

```python
from langchain.agents import create_agent

agent = create_agent(model=model, tools=TOOLS, system_prompt="...")

out = agent.invoke({"messages": [HumanMessage(task)]},
                   config={"recursion_limit": 12})    # ALWAYS set this
out["messages"][-1].content        # the answer
out["messages"]                    # the full trace - print it when debugging
```

### Streaming each step

```python
for chunk in agent.stream({"messages": [...]}, stream_mode="values"):
    print(chunk["messages"][-1])
```

### Memory

```python
from langgraph.checkpoint.memory import InMemorySaver

agent = create_agent(model=model, tools=TOOLS, checkpointer=InMemorySaver())
cfg = {"configurable": {"thread_id": "user-123"}}     # one thread per user
agent.invoke({"messages": [...]}, config=cfg)
```

### Human approval on destructive tools

```python
from langchain.agents.middleware import HumanInTheLoopMiddleware
from langgraph.types import Command

agent = create_agent(
    model=model, tools=TOOLS,
    middleware=[HumanInTheLoopMiddleware(interrupt_on={"cancel_order": True})],
    checkpointer=InMemorySaver(),          # required for interrupts
)

agent.invoke({"messages": [...]}, config=cfg)          # pauses before the tool runs
agent.get_state(cfg).interrupts[0].value["action_requests"]

agent.invoke(Command(resume={"decisions": [{"type": "approve"}]}), config=cfg)
# also: {"type": "reject"} · {"type": "edit"} · {"type": "respond"}
```

### Structured output from an agent

```python
agent = create_agent(model=model, tools=TOOLS, response_format=Ticket)
agent.invoke({...})["structured_response"]
```

---

## Production checklist

- [ ] `recursion_limit` on every agent
- [ ] Reads run freely; **writes, sends, payments and deletes** go behind approval
- [ ] Validate tool arguments, they are model output, treat them as untrusted input
- [ ] Return errors as data (`{"error": "..."}`), don't raise, the model can recover
- [ ] Never build a system prompt by concatenating user input
- [ ] `LANGSMITH_TRACING=true`: you cannot debug what you cannot replay
- [ ] An eval set before you tune anything

---

## Debugging, in order

1. **Print the messages.** `out["messages"]` or the list you built. Nearly every bug is visible there.
2. **RAG wrong?** Check whether the right chunk was retrieved *before* touching the prompt.
   Not retrieved → search problem. Retrieved → generation problem.
3. **Tool not called?** The docstring is too vague.
4. **Tool called too often?** Say when *not* to use it, in the docstring.
5. **Truncated answer?** `finish_reason == "length"`: raise `max_tokens`.
6. **Looping forever?** That is what `recursion_limit` is for.
