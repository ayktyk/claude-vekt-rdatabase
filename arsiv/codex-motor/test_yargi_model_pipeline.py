import json
import sys
import tempfile
import unittest
from pathlib import Path
from unittest import mock


ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

import yargi_model_pipeline as pipeline  # noqa: E402


class YargiModelPipelineTests(unittest.TestCase):
    def test_routing_order_matches_contract(self):
        routing = pipeline.load_routing()
        stages = routing["stages"]
        self.assertEqual(
            [stage["model"] for stage in stages],
            ["gpt-5.6-sol", "gpt-5.6-terra", "gpt-5.6-sol", "gpt-5.6-terra"],
        )
        self.assertEqual(
            [stage["engine"] for stage in stages],
            ["codex", "codex", "codex", "codex"],
        )
        self.assertEqual(routing["final_report_stage"], 3)
        self.assertEqual(routing["quality_gate_stage"], 4)

    def test_no_claude_or_luna_in_pipeline(self):
        routing = pipeline.load_routing()
        blob = json.dumps(routing).lower()
        self.assertNotIn("luna", blob)
        self.assertNotIn('"claude"', blob)

    def test_sentez_requires_verified_full_text(self):
        payload = {
            "report_markdown": "x" * 500,
            "atif_maddeleri": [
                {
                    "document_id": "123",
                    "kunye": "9. HD, E. 1, K. 2",
                    "verified_full_text": False,
                    "citations": [],
                }
            ],
            "query_count": 15,
            "full_text_count": 5,
        }
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "sentez.json"
            path.write_text(json.dumps(payload), encoding="utf-8")
            with self.assertRaisesRegex(RuntimeError, "tam metni dogrulanmis"):
                pipeline.parse_sentez(path, {"min_queries": 15, "min_full_text": 5})

    def test_gate_requires_exact_first_line_and_word_limit(self):
        self.assertEqual(pipeline.parse_gate("KARAR: GECTI\nTemiz.", 10), "GECTI")
        self.assertEqual(
            pipeline.parse_gate("KARAR: REVIZE GEREKIR\nKunye hatali.", 10),
            "REVIZE GEREKIR",
        )
        self.assertEqual(pipeline.parse_gate("Sonuc: uygun", 10), "PARSE_EDILEMEDI")
        self.assertEqual(
            pipeline.parse_gate("KARAR: GECTI\n" + "x " * 10, 10),
            "LIMIT_ASILDI",
        )

    def test_codex_command_uses_configured_sandbox_and_schema(self):
        command = pipeline.codex_command(
            "gpt-5.6-sol", "xhigh", Path("out.json"), "danger-full-access", schema=True
        )
        joined = " ".join(command)
        self.assertIn("--sandbox danger-full-access", joined)
        self.assertIn("yargi-sentez-output.schema.json", joined)
        self.assertNotIn("claude", joined)

    def test_main_writes_sentez_report_and_passed_manifest(self):
        sentez_payload = {
            "report_markdown": "Nihai sentez raporu. " + "x" * 500,
            "atif_maddeleri": [
                {
                    "document_id": "123",
                    "kunye": "9. HD, E. 1, K. 2",
                    "verified_full_text": True,
                    "citations": [],
                }
            ],
            "query_count": 15,
            "full_text_count": 5,
        }

        def fake_stage(name, model, command, prompt, output_path, timeout):
            if name == "03-sentez":
                output_path.write_text(json.dumps(sentez_payload), encoding="utf-8")
            elif name == "04-terra-kalite":
                output_path.write_text("KARAR: GECTI\nKritik hata yok.\n", encoding="utf-8")
            else:
                output_path.write_text(name + " raporu\n", encoding="utf-8")
            return {"stage": name, "model": model, "status": "completed"}

        with tempfile.TemporaryDirectory() as directory:
            argv = [
                "yargi_model_pipeline.py",
                "--on-kontrol-yok",
                "--cikti",
                directory,
                "is hukuku sorusu",
            ]
            with mock.patch.object(sys, "argv", argv), mock.patch.object(
                pipeline, "run_stage", side_effect=fake_stage
            ), mock.patch.object(pipeline, "mcp_available", return_value=False):
                self.assertEqual(pipeline.main(), 0)

            output_dir = Path(directory)
            self.assertTrue((output_dir / "yargi-bulgulari.md").is_file())
            self.assertTrue((output_dir / "atif-maddeleri.json").is_file())
            manifest = json.loads(
                (output_dir / "yargi-model-pipeline.json").read_text(encoding="utf-8")
            )
            self.assertEqual(manifest["status"], "completed")
            self.assertEqual(manifest["quality_gate"], "GECTI")
            self.assertFalse(manifest["mcp_used"])


if __name__ == "__main__":
    unittest.main()
