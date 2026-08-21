import os
from PIL import Image

SRC_DIR = r"C:\Users\Damia\Pictures\idlerpg"
OUT_DIR = r"c:\Users\Damia\Desktop\Narzędzia\Projekty\Projekty aplikacji\Aplikacja fit solo leveling\solo-leveler\public\assets\idlerpg\sprites"

os.makedirs(OUT_DIR, exist_ok=True)

def remove_white_bg(img, threshold=235):
    img = img.convert("RGBA")
    datas = img.getdata()
    new_data = []
    for item in datas:
        r, g, b, a = item
        # If near white
        if r > threshold and g > threshold and b > threshold:
            min_val = min(r, g, b)
            if min_val > 248:
                new_data.append((255, 255, 255, 0))
            else:
                alpha = int(255 * (255 - min_val) / (255 - threshold))
                new_data.append((r, g, b, alpha))
        else:
            new_data.append(item)
    img.putdata(new_data)
    
    # Auto-crop empty bounding box
    bbox = img.getbbox()
    if bbox:
        img = img.crop(bbox)
    return img

def crop_and_save(img, box, filename, threshold=235):
    cropped = img.crop(box)
    processed = remove_white_bg(cropped, threshold)
    out_path = os.path.join(OUT_DIR, filename)
    processed.save(out_path, "PNG")
    print(f"Saved: {filename} size={processed.size}")

# 1. Hunter Hero (Image 1)
im1 = Image.open(os.path.join(SRC_DIR, "ChatGPT Image 21 sie 2026, 00_34_45 (1).png"))
crop_and_save(im1, (0, 0, 390, 440), "hunter_idle.png")
crop_and_save(im1, (390, 0, 800, 440), "hunter_walk.png")
crop_and_save(im1, (800, 0, 1254, 440), "hunter_attack.png")
crop_and_save(im1, (0, 440, 460, 870), "hunter_dual.png")
crop_and_save(im1, (460, 440, 860, 870), "hunter_extract.png")
crop_and_save(im1, (860, 440, 1254, 870), "hunter_awakened.png")
crop_and_save(im1, (270, 870, 680, 1254), "hunter_portrait.png")
crop_and_save(im1, (680, 870, 1050, 1254), "hunter_chibi.png")

# 2. Shadow Army (Image 2)
im2 = Image.open(os.path.join(SRC_DIR, "ChatGPT Image 21 sie 2026, 00_34_45 (2).png"))
crop_and_save(im2, (0, 0, 420, 580), "shadow_igris.png")
crop_and_save(im2, (420, 0, 820, 580), "shadow_assassin.png")
crop_and_save(im2, (820, 0, 1254, 580), "shadow_spearman.png")
crop_and_save(im2, (0, 580, 440, 1254), "shadow_wolf.png")
crop_and_save(im2, (440, 580, 820, 1254), "shadow_mage.png")
crop_and_save(im2, (820, 580, 1254, 1254), "shadow_dragon.png")

# 3. Enemies / Monsters (Image 3)
im3 = Image.open(os.path.join(SRC_DIR, "ChatGPT Image 21 sie 2026, 00_34_45 3.png"))
crop_and_save(im3, (0, 0, 430, 600), "enemy_spider.png")
crop_and_save(im3, (430, 0, 820, 600), "enemy_wraith.png")
crop_and_save(im3, (820, 0, 1254, 600), "enemy_frost_golem.png")
crop_and_save(im3, (0, 600, 440, 1254), "enemy_wolf.png")
crop_and_save(im3, (440, 600, 850, 1254), "enemy_fiend.png")
crop_and_save(im3, (850, 600, 1254, 1254), "enemy_warlord.png")

# 4. Bosses & Monarchs (Image 4)
im4 = Image.open(os.path.join(SRC_DIR, "ChatGPT Image 21 sie 2026, 00_34_45 (4).png"))
crop_and_save(im4, (0, 0, 627, 627), "boss_dragon.png")
crop_and_save(im4, (627, 0, 1254, 627), "boss_gate_sovereign.png")
crop_and_save(im4, (0, 627, 627, 1254), "boss_baran.png")
crop_and_save(im4, (627, 627, 1254, 1254), "boss_titan.png")

# 5. Skills Icons (Image 6)
im6 = Image.open(os.path.join(SRC_DIR, "ChatGPT Image 21 sie 2026, 00_34_46 (6).png"))
cell_w = 1254 / 4
cell_h = 1254 / 3
skill_names = [
    ["skill_moon_slash.png", "skill_shadow_dash.png", "skill_stealth.png", "skill_arise.png"],
    ["skill_black_hole.png", "skill_wolf_rush.png", "skill_dagger_tempest.png", "skill_monarch_aura.png"],
    ["skill_gate_warp.png", "skill_lightning_blade.png", "skill_rulers_authority.png", "skill_monarch_awakening.png"]
]
for r in range(3):
    for c in range(4):
        box = (int(c * cell_w + 15), int(r * cell_h + 15), int((c + 1) * cell_w - 15), int((r + 1) * cell_h - 15))
        cropped = im6.crop(box)
        cropped = remove_white_bg(cropped, threshold=245)
        fname = skill_names[r][c]
        out_path = os.path.join(OUT_DIR, fname)
        cropped.save(out_path, "PNG")
        print(f"Saved skill: {fname}")

# 6. Chests & Currencies (Image 9)
im9 = Image.open(os.path.join(SRC_DIR, "ChatGPT Image 21 sie 2026, 00_34_47 (9).png"))
crop_and_save(im9, (0, 0, 250, 310), "chest_wood.png")
crop_and_save(im9, (250, 0, 500, 310), "chest_blue.png")
crop_and_save(im9, (500, 0, 750, 310), "chest_purple.png")
crop_and_save(im9, (750, 0, 1000, 310), "chest_gold.png")
crop_and_save(im9, (1000, 0, 1254, 310), "chest_monarch.png")

crop_and_save(im9, (0, 310, 270, 580), "item_gold.png")
crop_and_save(im9, (270, 310, 500, 580), "item_diamond.png")
crop_and_save(im9, (500, 310, 740, 580), "item_crystal_purple.png")
crop_and_save(im9, (740, 310, 990, 580), "item_crystal_red.png")
crop_and_save(im9, (990, 310, 1254, 580), "item_rune_stone.png")
crop_and_save(im9, (350, 880, 650, 1254), "item_hp_potion.png")
crop_and_save(im9, (950, 880, 1254, 1254), "item_dungeon_key.png")

print("SUCCESS: All individual transparent sprites generated!")
