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

A logo (public/assets/logo.png) e a UNICA arte que nao sai daqui: foi desenhada
com IA, teve o fundo removido e foi reduzida a mao. Nao apague no npm run arte.
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
import time
from PIL import Image

RAIZ = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, RAIZ)

import cursor as cursor_arte
import fonte as fonte_arte
import gente
import icones as icones_arte
import manifesto as manifesto_arte
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


#: arte que NAO sai daqui e nao pode ser apagada na limpeza
INTOCAVEIS = {"logo.png"}


def limpar_orfaos(comeco):
    """Apaga PNG antigo que esta gerao nao reescreveu.

    Sem isto o jogo carrega arte fantasma: quando os sprites do heroi passaram a
    ter raca no nome, os arquivos do formato velho continuaram em public/assets
    e foram parar no build, ocupando espaco e confundindo quem abre a pasta. O
    criterio e a hora do arquivo: quem nao foi tocado nesta rodada, saiu de cena."""
    apagados = []
    for pasta, _, arquivos in os.walk(SAIDA):
        for nome in arquivos:
            if not nome.endswith(".png") or nome in INTOCAVEIS:
                continue
            caminho = os.path.join(pasta, nome)
            if os.path.getmtime(caminho) < comeco:
                os.remove(caminho)
                apagados.append(os.path.relpath(caminho, SAIDA))
    return apagados


def main():
    os.makedirs(SAIDA, exist_ok=True)
    comeco = time.time()
    indice_tiles = tiles.gerar(SAIDA, a_mao)
    ficha_objetos = mundo.gerar(SAIDA, a_mao)
    indice_npcs, encaixes = gente.gerar(SAIDA, a_mao)
    indice_ui = ui_arte.gerar(SAIDA)
    indice_cursor = cursor_arte.gerar(SAIDA)
    # folha propria do combate, para nao disputar ui.py com o ambiente `sprites`
    indice_icones = icones_arte.gerar(SAIDA)
    titulo_arte.gerar(SAIDA, a_mao)
    ficha_fonte = fonte_arte.gerar(SAIDA, a_mao)
    ui_arte.favicon(os.path.join(RAIZ, "..", "public", "favicon.png"))

    # o jogo le este arquivo para saber o tamanho e a colisao de cada objeto,
    # entao adicionar um objeto novo nao exige mexer em nenhum .ts
    with open(os.path.join(SAIDA, "objetos.json"), "w", encoding="utf-8") as f:
        json.dump(ficha_objetos, f, indent=2, ensure_ascii=False)

    # onde fica a mao e o tronco em cada quadro, e como cada arma se pendura.
    # e por este arquivo que a arma para de ser copiada dentro do desenho do
    # corpo: o jogo le o ponto e encosta a peca nele
    with open(os.path.join(SAIDA, "encaixes.json"), "w", encoding="utf-8") as f:
        json.dump(encaixes, f, indent=1, ensure_ascii=False)

    print("tiles: ", indice_tiles)
    print("npcs:  ", indice_npcs)
    print("ui:    ", indice_ui)
    print("cursor:", indice_cursor)
    print("icones:", indice_icones)
    print("objetos:", ", ".join(ficha_objetos))
    print("fonte: ", ficha_fonte)
    orfaos = limpar_orfaos(comeco)
    if orfaos:
        print("apagados:", ", ".join(sorted(orfaos)))

    # o manifesto e o unico jeito de ver O QUE mudou numa geracao: sem ele o
    # git status mostra cem PNGs modificados e nao da para saber se voce mexeu
    # num desenho ou em todos. Tambem e por ele que o verificar.mjs descobre
    # PNG colado na mao em public/assets
    antigo = None
    caminho_manifesto = os.path.join(RAIZ, "manifesto.json")
    if os.path.exists(caminho_manifesto):
        with open(caminho_manifesto, encoding="utf-8") as f:
            antigo = json.load(f)
    destino, quantos = manifesto_arte.escrever(SAIDA, RAIZ)
    with open(destino, encoding="utf-8") as f:
        novos, mudados, sumidos = manifesto_arte.comparar(antigo, json.load(f))
    print(f"manifesto: {quantos} arquivos")
    for rotulo, lista in (("novos", novos), ("mudados", mudados), ("sumidos", sumidos)):
        if lista:
            print(f"  {rotulo} ({len(lista)}): " + ", ".join(lista[:8]) +
                  (" ..." if len(lista) > 8 else ""))
    print("arte gerada em", os.path.normpath(SAIDA))


if __name__ == "__main__":
    main()
