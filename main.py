"""Worker entry point: the runtime supplies one prompt image, the round seed and the witness client.

`generate()` runs the staged pipeline in src/stage_pipeline in a worker thread behind a small bridge that turns the
async witness into the blocking create() / render() calls the pipeline expects.
"""

from __future__ import annotations

import os

# One BLAS/OpenMP thread: numpy otherwise starts a thread and about 40 MB of address space per CPU core at import, which
# can pass a sandbox's thread and address-space limits on a many-core host. Set before anything imports numpy.
for _name in ("OPENBLAS_NUM_THREADS", "OMP_NUM_THREADS", "MKL_NUM_THREADS", "NUMEXPR_NUM_THREADS"):
    os.environ.setdefault(_name, "1")

import asyncio
from collections.abc import Coroutine
from typing import Any

from src.stage_pipeline.pipeline import run
from src.stage_pipeline.versions import ACTIVE_PLAN

__all__ = ["generate"]


class _Bridge:
    """Blocking create() and render() over the async witness, for the pipeline's worker threads."""

    def __init__(self, witness: Any, loop: asyncio.AbstractEventLoop) -> None:
        self._witness = witness
        self._loop = loop

    def _wait(self, call: Coroutine[Any, Any, Any]) -> Any:
        return asyncio.run_coroutine_threadsafe(call, self._loop).result()

    def create(self, *, request_id: int = 0, **params: Any) -> Any:
        return self._wait(self._witness.responses.create(request_id=request_id, **params))

    def render(self, source: str, options: Any) -> bytes:
        return self._wait(self._witness.render(source, options))


async def generate(image: bytes, seed: int, witness: Any) -> str | None:
    bridge = _Bridge(witness, asyncio.get_running_loop())
    return await asyncio.to_thread(run, image, seed, bridge, bridge, ACTIVE_PLAN)
