"""Test the callback notifier — happy path and error tolerance."""

from __future__ import annotations

import json
import threading
from http.server import BaseHTTPRequestHandler, HTTPServer

from callbacks import notify_callback


class _Recorder(BaseHTTPRequestHandler):
    received: list[dict] = []
    auth_headers: list[str] = []

    def do_POST(self) -> None:  # noqa: N802
        length = int(self.headers.get("Content-Length", "0"))
        body = self.rfile.read(length).decode("utf-8")
        _Recorder.received.append(json.loads(body))
        _Recorder.auth_headers.append(self.headers.get("Authorization", ""))
        self.send_response(200)
        self.end_headers()

    def log_message(self, *_args, **_kwargs) -> None:  # silence
        return


def _start_server() -> tuple[HTTPServer, str]:
    server = HTTPServer(("127.0.0.1", 0), _Recorder)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    host, port = server.server_address
    return server, f"http://{host}:{port}/cb"


def test_notify_callback_posts_payload_with_bearer():
    _Recorder.received = []
    _Recorder.auth_headers = []
    server, url = _start_server()
    try:
        notify_callback(url, "tok-1", {"job_id": "j1", "song_id": "s1", "status": "completed"})
    finally:
        server.shutdown()

    assert _Recorder.received == [{"job_id": "j1", "song_id": "s1", "status": "completed"}]
    assert _Recorder.auth_headers == ["Bearer tok-1"]


def test_notify_callback_noop_without_url():
    # Should not raise.
    notify_callback(None, "tok", {"status": "completed"})
    notify_callback("", "tok", {"status": "completed"})


def test_notify_callback_swallows_network_errors():
    # Unreachable port — should not raise.
    notify_callback("http://127.0.0.1:1/cb", "tok", {"status": "failed"})
