import json, os
from PIL import Image, ImageDraw

manifest = json.load(open('src/assets/idle-rpg/animation-manifest.json', 'r', encoding='utf-8'))
fw, fh = manifest['atlasGeometry']['frameWidth'], manifest['atlasGeometry']['frameHeight']
cols = manifest['atlasGeometry']['columns']

actors = []
for cat, data in manifest['categories'].items():
    for src in data['sources']:
        actors.append(src)

rows = len(actors)
overview = Image.new('RGBA', (cols * fw, rows * fh), (20, 24, 34, 255))

atlases = {}
for aid, info in manifest['atlases'].items():
    atlases[aid] = Image.open('src/assets/idle-rpg/' + info['assetPath']).convert('RGBA')

draw = ImageDraw.Draw(overview)

for r_idx, src in enumerate(actors):
    aid = src['actorId']
    atlas = atlases[src['atlasId']]
    row_offset = src['rowOffset']
    facing = src['facing']
    
    for c in range(cols):
        frame_num = row_offset + c
        ar = frame_num // cols
        ac = frame_num % cols
        cell = atlas.crop((ac * fw, ar * fh, (ac+1)*fw, (ar+1)*fh))
        overview.alpha_composite(cell, (c * fw, r_idx * fh))
    
    draw.text((10, r_idx * fh + 10), f"{aid} | declared={facing}", fill=(255, 230, 100, 255))

os.makedirs('scratch', exist_ok=True)
overview.save('scratch/all_actors_overview.png')
print('Saved scratch/all_actors_overview.png with size', overview.size)
