#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Train Stable Diffusion LoRA com sprites do Pedra do Sol - Colab optimized."""

import os
import sys
from pathlib import Path
import torch
from torch.utils.data import Dataset, DataLoader
from torch.optim import AdamW
from PIL import Image
import json
import numpy as np
from tqdm import tqdm

PROJECT_DIR = Path("/content/Pedra-do-Sol-Jogo") if Path("/content").exists() else Path(__file__).parent.parent
DATASET_DIR = PROJECT_DIR / "colecao_sprites" / "dataset" / "processed"
OUTPUT_DIR = PROJECT_DIR / "models" / "lora_output"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

print("="*70)
print("🎨 STABLE DIFFUSION LoRA TRAINING - COLAB")
print("="*70)

if not DATASET_DIR.exists():
    print(f"\n❌ Dataset não encontrado em: {DATASET_DIR}")
    sys.exit(1)

sprites = list(DATASET_DIR.glob("*.png"))
print(f"\n📊 Dataset: {len(sprites)} sprites")

try:
    from diffusers import StableDiffusionPipeline, DDPMScheduler
    from transformers import CLIPTextModel, CLIPTokenizer
    from peft import LoraConfig, get_peft_model
except ImportError:
    print("❌ Dependências não instaladas!")
    sys.exit(1)

device = "cuda" if torch.cuda.is_available() else "cpu"
print(f"\n🖥️  Device: {device}")
if device == "cuda":
    print(f"   GPU: {torch.cuda.get_device_name(0)}")

class SpriteDataset(Dataset):
    def __init__(self, data_dir, resolution=512):
        self.data_dir = Path(data_dir)
        self.resolution = resolution
        self.images = sorted(self.data_dir.glob("*.png"))
        self.metadata = {}
        metadata_file = self.data_dir / "metadata.jsonl"
        if metadata_file.exists():
            with open(metadata_file) as f:
                for line in f:
                    try:
                        item = json.loads(line)
                        self.metadata[item["image"]] = item.get("text", "pixel art sprite")
                    except:
                        pass

    def __len__(self):
        return len(self.images)

    def __getitem__(self, idx):
        img_path = self.images[idx]
        img = Image.open(img_path).convert("RGB")
        img = img.resize((self.resolution, self.resolution), Image.LANCZOS)
        img_np = np.array(img).astype(np.float32) / 127.5 - 1.0
        prompt = self.metadata.get(img_path.name, "pixel art sprite, fantasy character")
        return {
            "image": torch.from_numpy(img_np).permute(2, 0, 1),
            "prompt": prompt,
        }

print(f"\n📥 Carregando modelo base...")
pipeline = StableDiffusionPipeline.from_pretrained(
    "runwayml/stable-diffusion-v1-5",
    torch_dtype=torch.float16 if device == "cuda" else torch.float32,
    safety_checker=None,
).to(device)
print("   ✅ Modelo carregado")

dataset = SpriteDataset(DATASET_DIR, resolution=512)
dataloader = DataLoader(dataset, batch_size=1, shuffle=True)
print(f"\n📊 Dataset e modelo prontos! Batches: {len(dataloader)}")

print(f"\n⚙️  Configurando LoRA training...")
unet = pipeline.unet
text_encoder = pipeline.text_encoder
tokenizer = pipeline.tokenizer
scheduler = DDPMScheduler.from_config(pipeline.scheduler.config)
vae = pipeline.vae

text_encoder.requires_grad_(False)
vae.requires_grad_(False)

lora_config = LoraConfig(
    r=8,
    lora_alpha=16,
    target_modules=["to_k", "to_v", "to_q"],
    lora_dropout=0.1,
    bias="none",
)

unet = get_peft_model(unet, lora_config)
unet.train()

optimizer = AdamW(unet.parameters(), lr=5e-4)
print("   ✅ LoRA configurado")

num_epochs = 50
print(f"\n🚀 INICIANDO TRAINING")
print(f"   Epochs: {num_epochs}, Steps: {len(dataloader) * num_epochs}")
print("")

for epoch in range(num_epochs):
    progress_bar = tqdm(dataloader, desc=f"Epoch {epoch+1}/{num_epochs}")
    epoch_loss = 0.0

    for batch in progress_bar:
        input_ids = tokenizer(
            batch["prompt"],
            padding="max_length",
            max_length=tokenizer.model_max_length,
            truncation=True,
            return_tensors="pt",
        ).input_ids.to(device)

        encoder_hidden_states = text_encoder(input_ids)[0]

        images = batch["image"].to(device, dtype=torch.float16 if device == "cuda" else torch.float32)

        with torch.no_grad():
            latents = vae.encode(images).latent_dist.sample()
            latents = latents * 0.18215

        noise = torch.randn_like(latents)
        timesteps = torch.randint(0, 1000, (latents.shape[0],)).to(device)

        noisy_latents = scheduler.add_noise(latents, noise, timesteps)

        model_pred = unet(
            noisy_latents,
            timesteps,
            encoder_hidden_states,
        ).sample

        loss = torch.nn.functional.mse_loss(model_pred, noise, reduction="mean")

        optimizer.zero_grad()
        loss.backward()
        optimizer.step()

        epoch_loss += loss.detach().item()
        progress_bar.set_postfix({"loss": loss.detach().item()})

    avg_loss = epoch_loss / len(dataloader)
    print(f"Epoch {epoch+1} - Average Loss: {avg_loss:.6f}")

print("\n✅ Training completo!")

print(f"\n💾 Salvando LoRA adapter...")
unet.save_pretrained(OUTPUT_DIR)
print(f"   ✅ LoRA salvo em: {OUTPUT_DIR}")

print(f"\n{'='*70}")
print(f"✨ TRAINING FINALIZADO!")
print(f"   Output: {OUTPUT_DIR}")
print(f"   Arquivo: adapter_model.bin (LoRA pequeno!)")
print(f"{'='*70}")
