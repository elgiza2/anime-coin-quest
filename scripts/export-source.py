"""Export clean source and materialize all CDN pointer assets for independent hosting."""
import argparse
import concurrent.futures
import hashlib
import json
from pathlib import Path
import shutil
import urllib.parse
import urllib.request

EXCLUDED = {'.git', '.lovable', '.workspace', 'node_modules', 'dist', 'build', '.output', '.tanstack', '.vite', '__pycache__', 'coverage'}

def allowed(relative):
    return not any(part in EXCLUDED or (part.startswith('.env') and part != '.env.example') or part.endswith('.tsbuildinfo') for part in relative.parts)

def export(root, target, origin):
    if target.exists():
        raise ValueError('Output must be a new directory')
    if target == root or root in target.parents:
        raise ValueError('Output must be outside the project')
    target.mkdir(parents=True)
    for source in root.rglob('*'):
        relative = source.relative_to(root)
        if source.is_file() and not source.is_symlink() and allowed(relative):
            destination = target / relative
            destination.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(source, destination)
    pointers = list(target.rglob('*.asset.json'))

    def materialize(pointer):
        data = json.loads(pointer.read_text())
        asset_id = data['asset_id']
        name = Path(data['original_filename']).name
        if not name or '/' in asset_id or '..' in asset_id:
            raise ValueError('Invalid asset name')
        relative = Path('public/media') / asset_id / name
        destination = target / relative
        destination.parent.mkdir(parents=True, exist_ok=True)
        url = urllib.parse.urljoin(origin.rstrip('/') + '/', data['url'])
        request = urllib.request.Request(url, headers={'User-Agent': 'Wall-Source-Export/1.0'})
        with urllib.request.urlopen(request, timeout=90) as response:
            content_type = response.headers.get('Content-Type', '')
            if 'text/html' in content_type:
                raise ValueError('Asset host returned a login or error page')
            with destination.open('wb') as file:
                shutil.copyfileobj(response, file)
        size = destination.stat().st_size
        if not size or (data.get('size') and size != data['size']):
            raise ValueError('Asset size mismatch: ' + name)
        sha = hashlib.sha256(destination.read_bytes()).hexdigest()
        pointer.write_text(json.dumps({**data, 'url': '/' + relative.relative_to('public').as_posix()}, indent=2) + '\n')
        return {'pointer': pointer.relative_to(target).as_posix(), 'file': relative.as_posix(), 'size': size, 'sha256': sha}

    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
        manifest = list(pool.map(materialize, pointers))
    (target / 'media-manifest.json').write_text(json.dumps(sorted(manifest, key=lambda item: item['file']), indent=2) + '\n')
    print(f'Exported {len(manifest)} CDN assets, {sum(item["size"] for item in manifest):,} bytes. Original local images are also included.')

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--origin', required=True)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    export(Path(__file__).resolve().parents[1], args.output.resolve(), args.origin)