#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Prepara dataset de sprites para LoRA training."""

import os
import shutil
from pathlib import Path
import json

PROJECT_DIR = Path(__file__).parent.parent
SPRITES_DIRS = [
    PROJECT_DIR / "dist" / "assets",
    PROJECT_DIR / "public" / "assets",
    PROJECT_DIR / "arte" / "sprites",
]
OUTPUT_DIR = PROJECT_DIR / "colecao_sprites" / "dataset" / "processed"

OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

print("="*70)
print("🎨 PREPARAR DATASET - Coletando Sprites")
print("="*70)

# Encontrar todos os sprites
sprites = []
for sprite_dir in SPRITES_DIRS:
    if sprite_dir.exists():
        found = list(sprite_dir.glob("*.png"))
        sprites.extend(found)
        print(f"\n📁 {sprite_dir.relative_to(PROJECT_DIR)}")
        print(f"   → {len(found)} sprites")

sprites = list(set(sprites))  # Remove duplicatas
print(f"\n📊 Total único: {len(sprites)} sprites")

# Copiar para output
print(f"\n📥 Copiando para {OUTPUT_DIR}...")
copied = 0
for i, sprite_path in enumerate(sorted(sprites)):
    try:
        output_path = OUTPUT_DIR / sprite_path.name
        shutil.copy2(sprite_path, output_path)
        copied += 1
        if (i + 1) % 50 == 0:
            print(f"   {i+1}/{len(sprites)}...")
    except Exception as e:
        print(f"   ⚠️  {sprite_path.name}: {e}")

print(f"\n✅ {copied} sprites copiados")

# Criar metadata.jsonl
print(f"\n📝 Criando metadata.jsonl...")
metadata_file = OUTPUT_DIR / "metadata.jsonl"
with open(metadata_file, "w") as f:
    for sprite_path in sorted(OUTPUT_DIR.glob("*.png")):
        # Extrair tipo de sprite do nome
        name = sprite_path.stem

        if "goblin" in name:
            text = "pixel art goblin, green creature, fantasy sprite"
        elif "npc" in name or "ferreiro" in name:
            text = "pixel art npc character, fantasy character, portrait"
        elif "heroi" in name or "personagem" in name:
            text = "pixel art hero character, fantasy protagonist, adventure"
        elif "roupa" in name:
            text = "pixel art clothing, character outfit, fantasy dress"
        else:
            text = f"pixel art sprite, {name.replace('-', ' ')}"

        data = {
            "image": sprite_path.name,
            "text": text
        }
        f.write(json.dumps(data) + "\n")

print(f"   ✅ {len(list(OUTPUT_DIR.glob('*.png')))} entradas")

print(f"\n{'='*70}")
print(f"✨ DATASET PRONTO!")
print(f"   Diretório: {OUTPUT_DIR}")
print(f"   Sprites: {len(list(OUTPUT_DIR.glob('*.png')))}")
print(f"   Próximo: Rodar train_lora_colab.py")
print(f"{'='*70}")
