"""Best-effort HTTP callback used to notify Next.js when a processing job finishes."""

from __future__ import annotations

import json
import urllib.error
import urllib.request


def notify_callback(
    callback_url: str | None,
    callback_token: str | None,
    payload: dict,
) -> None:
    if not callback_url:
        return
    body = json.dumps(payload).encode("utf-8")
    headers = {"Content-Type": "application/json"}
    if callback_token:
        headers["Authorization"] = f"Bearer {callback_token}"
    req = urllib.request.Request(callback_url, data=body, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            resp.read()
    except (urllib.error.URLError, TimeoutError) as exc:
        # Best-effort: log and continue. Next.js can also poll job status as fallback.
        print(f"[callback] failed: {exc}", flush=True)
