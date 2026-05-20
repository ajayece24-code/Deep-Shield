"""
fusion.py
Combines visual + audio verdicts into one final decision.
"""

def fuse_results(visual_result, audio_result,
                 visual_weight=0.6, audio_weight=0.4):
    visual_fake = visual_result.get("fake_score", 0) / 100
    audio_fake  = audio_result.get("fake_score", 0) / 100

    if audio_result.get("verdict") == "NO_AUDIO":
        final_fake = visual_fake
        weights_note = "visual_only (no audio track)"
    else:
        final_fake = visual_fake * visual_weight + audio_fake * audio_weight
        weights_note = f"visual={visual_weight}, audio={audio_weight}"

    final_verdict = "FAKE" if final_fake > 0.5 else "REAL"
    final_confidence = final_fake if final_verdict == "FAKE" else 1 - final_fake

    return {
        "final_verdict": final_verdict,
        "final_confidence": round(final_confidence * 100, 2),
        "fake_score": round(final_fake * 100, 2),
        "visual": visual_result,
        "audio": audio_result,
        "fusion_weights": weights_note
    }