"""Tests for notes_converter — startTime/endTime in transcribed notes."""

from notes_converter import basic_pitch_events_to_score_notes


def test_basic_pitch_events_include_timing_fields():
    events = [
        (1.0, 1.5, 64, 0.82),
        (2.0, 2.75, 67, 0.65),
    ]
    notes = basic_pitch_events_to_score_notes(events, bpm=120.0, instrument="piano")

    assert len(notes) == 2
    assert notes[0]["startTime"] == 1.0
    assert notes[0]["endTime"] == 1.5
    assert notes[0]["midi"] == 64
    assert notes[0]["confidence"] == 0.82
    assert notes[0]["source"] == "ai_basic_pitch"
    assert notes[0]["beat"] == 2.0
    assert notes[0]["dur"] == 1.0

    assert notes[1]["startTime"] == 2.0
    assert notes[1]["endTime"] == 2.75


def test_guitar_tab_still_present():
    events = [(0.5, 1.0, 64, 0.9)]
    notes = basic_pitch_events_to_score_notes(events, bpm=120.0, instrument="guitar")
    assert "tab" in notes[0]
    assert "startTime" in notes[0]
