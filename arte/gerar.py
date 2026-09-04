# -*- coding: utf-8 -*-
"""Gera toda a arte do jogo em PNG.

Rode com:  npm run arte
Saida:     public/assets/

Como esta organizado:
  arte/paleta.py   as cores, unica fonte de cor do projeto
  arte/tiles.py    chao: grama, terra, caminho, agua, caverna
  arte/mundo.py    objetos inteiros: casa, arvore, poco, barraca, cerca
  arte/gente.py    heroi em tres camadas, npcs e goblins, 16x32
  arte/ui.py       painel de 9 fatias e icones de interface
  arte/titulo.py   o cenario da tela inicial
  arte/fonte.py    a fonte de bitmap, gerada a partir da Silkscreen
  arte/sprites/    PNG desenhado a mao, ganha do gerado se o nome bater

Regras de arte:
  . tile 16x16, personagem 16x32, objeto do tamanho que precisar
  . contorno de 1 px na cor TINTA em volta de tudo que fica em cima do chao
  . sombra de chao embaixo de todo objeto e personagem, e o que gruda no cenario
  . nenhuma cor fora de arte/paleta.py
"""
import json
import os
import sys
from PIL import Image

RAIZ = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, RAIZ)

import fonte as fonte_arte
import gente
import mundo
import tiles
import titulo as titulo_arte
import ui as ui_arte

SAIDA = os.path.join(RAIZ, "..", "public", "assets")
MAO = os.path.join(RAIZ, "sprites")


def a_mao(nome):
    """Se existir arte/sprites/<nome>.png, ela ganha da versao gerada.
    E assim que um sprite desenhado a mao entra no jogo sem mexer no codigo."""
    caminho = os.path.join(MAO, nome + ".png")
    if os.path.exists(caminho):
        return Image.open(caminho).convert("RGBA")
    return None


def main():
    os.makedirs(SAIDA, exist_ok=True)
    indice_tiles = tiles.gerar(SAIDA, a_mao)
    ficha_objetos = mundo.gerar(SAIDA, a_mao)
    indice_npcs = gente.gerar(SAIDA, a_mao)
    indice_ui = ui_arte.gerar(SAIDA)
    titulo_arte.gerar(SAIDA, a_mao)
    ficha_fonte = fonte_arte.gerar(SAIDA, a_mao)

    # o jogo le este arquivo para saber o tamanho e a colisao de cada objeto,
    # entao adicionar um objeto novo nao exige mexer em nenhum .ts
    with open(os.path.join(SAIDA, "objetos.json"), "w", encoding="utf-8") as f:
        json.dump(ficha_objetos, f, indent=2, ensure_ascii=False)

    print("tiles: ", indice_tiles)
    print("npcs:  ", indice_npcs)
    print("ui:    ", indice_ui)
    print("objetos:", ", ".join(ficha_objetos))
    print("fonte: ", ficha_fonte)
    print("arte gerada em", os.path.normpath(SAIDA))


if __name__ == "__main__":
    main()
