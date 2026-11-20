# 3D Worker Submission

Turns one PNG image into a deterministic Three.js module through a witness server.
`main.py` exports `async def generate(image: bytes, seed: int, witness) -> str | None`.

Pipeline (src/stage_pipeline, plan in versions.py):
- One small classification call sorts the object into a group: readable text or a logo first, otherwise its category.
  The group's recipe (`ROUTING` in pipeline.py) sets which switches of the same chain run; a group without a recipe,
  or a missing classification, runs the base chain.
- The chain: six drafts, a critique and one module merged from the best draft and every other draft, twelve judged
  rewrite steps (the budget plan is written for thirteen; some recipes run steps k5 and k6 as search/replace patches,
  and some add short guidance for the object's group; from the seventh step on, a rewrite stays only when the judge
  copy prefers it, so a tie keeps the module before it), then the outline fit, material and tone passes, smooth
  sampling (linear filtering with mipmaps) for data textures the model left at three.js defaults, and the recipe's
  finish settings: exact edits of the finish block, then whole-module finish steps (a reflection guide for plain
  polished near-neutral metal, a colour saturation pass), each kept only when the module still renders.
- Gate feedback: the next rewrite of a module hears what the step gate said about the last rewrite of it. After a
  rejection: that rewrite's own change list (prose lines only) and the judge copy's issues, for the last two rounds,
  so the model does not repeat the change; after a keep: the issues the judge copy still found in the kept module.
  No extra calls.
- Output: the model is built Y-up and faces the cameras on the +Z side. A flat object is built turned 90 degrees so
  its large face points toward +Z; any other object stands upright, front toward +Z; a lean or diagonal is kept only
  where the photo shows the object itself that way. The model follows the object's own pose, never the photo's camera
  angle: it never turns or tilts the whole object to copy a three-quarter view or a view from above. The wrapper only
  centres the object at the origin and scales it uniformly into the unit cube; nothing rotates, moves or stretches it
  after generation.
- Two judge-format choices follow the finish, each on the four front views the judge sees, asked in both orders, and
  each kept only with a clear lead: the metal pass (as finished, removed, or only on metalness of at least 0.5), then
  the tone pass (kept, or removed).
- Pixel-font helpers (`text_helpers.js`: `textLabelKit`, `textTextureKit`) and their text instructions are available
  to a recipe through `text_kit`; no current recipe turns them on.
- `powfix.py` parenthesizes `-x ** 2` (a SyntaxError in JavaScript) as `-(x ** 2)` before a module is rendered, so a
  model's habit from mathematics does not cost a repair call. A render that misses the renderer's deadline (HTTP 504,
  500 before) is retried, then treated as a render failure of that module.

`patch.py` keeps its MIT origin note.
