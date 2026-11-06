import importlib.util
import unittest
from pathlib import Path

spec = importlib.util.spec_from_file_location("add_upload_location", Path(__file__).parent / "add-upload-location.py")
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)

SITE = """server {
    client_max_body_size 10m;
    location / {
        proxy_pass http://localhost:3000;
    }
}
"""


class AddUploadLocationTest(unittest.TestCase):
    def test_inserts_the_block_before_the_main_location(self):
        out = mod.patch(SITE)
        self.assertIn("location = /api/inquiries/files {", out)
        self.assertLess(out.index("location = /api/inquiries/files"), out.index("    location / {"))
        self.assertIn("client_max_body_size 17m;", out)
        self.assertIn("client_max_body_size 10m;", out)  # the site-wide limit is untouched

    def test_is_idempotent(self):
        once = mod.patch(SITE)
        self.assertEqual(mod.patch(once), once)

    def test_refuses_a_file_it_does_not_understand(self):
        with self.assertRaises(SystemExit):
            mod.patch("server { }")
        with self.assertRaises(SystemExit):
            mod.patch(SITE + SITE)

    def test_keeps_everything_else_byte_for_byte(self):
        out = mod.patch(SITE)
        self.assertTrue(out.startswith("server {\n    client_max_body_size 10m;\n"))
        self.assertTrue(out.endswith("        proxy_pass http://localhost:3000;\n    }\n}\n"))


if __name__ == "__main__":
    unittest.main()
