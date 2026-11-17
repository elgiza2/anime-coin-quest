import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location('export_source', Path(__file__).with_name('export-source.py'))
if spec is None or spec.loader is None:
    raise RuntimeError('Exporter not found')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

class ExportSafety(unittest.TestCase):
    def test_no_credentials(self):
        for path in ['.env', '.env.local', 'nested/.env.production']:
            self.assertFalse(module.allowed(Path(path)))
        self.assertTrue(module.allowed(Path('.env.example')))

    def test_no_repository_metadata(self):
        self.assertFalse(module.allowed(Path('nested/.git/config')))
        self.assertFalse(module.allowed(Path('.lovable/project.json')))

    def test_assets_and_sources_included(self):
        self.assertTrue(module.allowed(Path('src/assets/arena.mp4')))
        self.assertTrue(module.allowed(Path('public/media/hero.jpg')))
        self.assertTrue(module.allowed(Path('src/routes/wallet.tsx')))

    def test_no_dependencies_or_builds(self):
        for path in ['node_modules/package/index.js', 'dist/app.js', '.output/server.js', 'tsconfig.tsbuildinfo']:
            self.assertFalse(module.allowed(Path(path)))

if __name__ == '__main__':
    unittest.main()