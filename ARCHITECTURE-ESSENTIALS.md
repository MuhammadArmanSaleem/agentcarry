# Architecture essentials

Status: proposed system, no runtime implementation.

- One TypeScript core is the current stack direction; exact runtime and dependencies need a technical spike.
- CLI, local MCP, optional hosted MCP, and agent adapters call shared operations.
- Local is the default; cloud is optional. Public hosted knowledge and local private memory can be combined.
- Markdown content and structured JSON records are inspectable sources of truth; indexes are disposable and rebuildable.
- Explicit project IDs, session IDs, authors, schema versions, and record revisions prevent implicit cross-project mixing.
- Checkpoints include branch/revision and relevant file fingerprints; receiving agents verify current files.
- Packages carry sources, license/provenance, supported versions, and verification dates.
- Curated knowledge, project memories, and learned skill drafts remain distinct retrieval scopes.
- Search starts with full-text and metadata filtering. Embeddings, reranking, and paid model calls require evidence of benefit.
- AgentCarry does not execute coding tasks. Agents or CI run checks; records distinguish reported, independently observed, and human-reviewed evidence.
- Extraction at milestones creates private drafts, never automatically trusted global instructions.
- No extra model is needed for storing/retrieving records. Optional model jobs use explicitly configured credentials or local endpoints.
- MCP connectivity alone does not provide session capture, local file access, or reliable automatic use.
- Protect writes with atomic replacement and optimistic revisions; test failures and concurrent writers.
- Never silently sync private memory, transcripts, secrets, or provider keys.
- Target clients are not supported clients until versioned evidence exists in [COMPATIBILITY.md](COMPATIBILITY.md).

Read [PRD.md](PRD.md), [ARCHITECTURE.md](ARCHITECTURE.md), and [DECISIONS.md](DECISIONS.md) before material changes.
