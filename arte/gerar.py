# -*- coding: utf-8 -*-
"""Gera toda a pixel art do jogo em PNG.

Rode com:  npm run arte
Saida:     public/assets/

Regras de arte deste projeto:
  . tile = 16x16 px, personagem = 16x24 px
  . tudo com contorno TINTA de 1 px, igual ao material impresso
  . nenhuma cor fora de arte/paleta.py
  . o heroi e desenhado em 3 camadas (base, cabelo, roupa) para o jogador
    escolher as cores na criacao do personagem. cabelo e roupa saem em
    BRANCO e recebem tint em runtime.
"""
import os
import sys
from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from paleta import *  # noqa
import ui as ui_arte

MAO = os.path.join(os.path.dirname(os.path.abspath(__file__)), "sprites")


def a_mao(nome):
    """Se existir arte/sprites/<nome>.png, ela ganha da versao gerada.
    E assim que um sprite desenhado a mao entra no jogo sem mexer no codigo."""
    caminho = os.path.join(MAO, nome + ".png")
    if os.path.exists(caminho):
        return Image.open(caminho).convert("RGBA")
    return None

SAIDA = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "public", "assets")
T = 16          # tamanho do tile
PW, PH = 16, 24  # tamanho do frame do personagem


def nova(w, h):
    return Image.new("RGBA", (w, h), (0, 0, 0, 0))


def px(im, x, y, cor):
    if 0 <= x < im.width and 0 <= y < im.height:
        im.putpixel((int(x), int(y)), cor if len(cor) == 4 else cor + (255,))


def ret(im, x, y, w, h, cor):
    for j in range(int(h)):
        for i in range(int(w)):
            px(im, x + i, y + j, cor)


def pontos(im, lista, cor):
    for (x, y) in lista:
        px(im, x, y, cor)


def contorno(im, x, y, w, h, cor=TINTA):
    for i in range(int(w)):
        px(im, x + i, y, cor); px(im, x + i, y + h - 1, cor)
    for j in range(int(h)):
        px(im, x, y + j, cor); px(im, x + w - 1, y + j, cor)


# ----------------------------------------------------------------- tiles
def t_grama(v=0):
    im = nova(T, T)
    ret(im, 0, 0, T, T, GRAMA)
    tufos = {
        0: [(3, 4), (4, 3), (11, 9), (12, 8), (7, 12)],
        1: [(2, 10), (3, 9), (9, 3), (10, 2), (13, 12), (6, 6)],
        2: [(5, 2), (6, 1), (1, 13), (12, 5), (8, 9), (14, 10)],
    }[v % 3]
    for (x, y) in tufos:
        px(im, x, y, GRAMA_C); px(im, x, y + 1, GRAMA_C); px(im, x + 1, y + 1, GRAMA_E)
    for (x, y) in [(1, 1), (14, 6), (7, 14), (10, 12)]:
        px(im, (x + v * 3) % T, y, GRAMA_E)
    return im


def t_terra():
    im = nova(T, T)
    ret(im, 0, 0, T, T, TERRA)
    for (x, y) in [(2, 3), (7, 2), (12, 6), (4, 9), (10, 12), (14, 9), (6, 13)]:
        px(im, x, y, TERRA_C)
    for (x, y) in [(3, 6), (9, 5), (13, 2), (5, 12), (11, 9)]:
        px(im, x, y, TERRA_E)
    return im


def t_agua(v=0):
    im = nova(T, T)
    ret(im, 0, 0, T, T, AGUA)
    for j in range(T):
        for i in range(T):
            if (i + j * 2 + v * 4) % 11 == 0:
                px(im, i, j, AGUA_E)
    for (x, y) in [(2, 4), (9, 7), (5, 11), (12, 2)]:
        px(im, (x + v * 2) % T, y, AGUA_C)
        px(im, (x + 1 + v * 2) % T, y, AGUA_C)
    return im


def t_pedra():
    im = nova(T, T)
    ret(im, 0, 0, T, T, PEDRA)
    ret(im, 0, 0, T, 2, PEDRA_C)
    ret(im, 0, T - 3, T, 3, PEDRA_E)
    for (x, y) in [(3, 5), (10, 4), (6, 9), (13, 10)]:
        px(im, x, y, PEDRA_E); px(im, x + 1, y, PEDRA_E)
    return im


def t_parede_madeira():
    im = nova(T, T)
    ret(im, 0, 0, T, T, MADEIRA)
    for x in range(0, T, 5):
        ret(im, x, 0, 1, T, MADEIRA_E)
    for x in range(2, T, 5):
        ret(im, x, 0, 1, T, MADEIRA_C)
    ret(im, 0, T - 2, T, 2, MADEIRA_E)
    return im


def t_telhado():
    im = nova(T, T)
    ret(im, 0, 0, T, T, TELHA)
    for j in range(0, T, 4):
        for i in range(T):
            px(im, i, j, TELHA_E)
        for i in range((j // 4) % 2, T, 2):
            px(im, i, j + 1, TELHA_C)
    return im


def t_arvore_copa():
    im = t_grama(1)
    for j in range(T):
        for i in range(T):
            d = (i - 7.5) ** 2 * 1.0 + (j - 8.5) ** 2 * 1.2
            if d < 58:
                px(im, i, j, FOLHA)
            elif d < 74:
                px(im, i, j, FOLHA_E)
    for (x, y) in [(4, 4), (5, 3), (9, 5), (6, 7), (10, 9), (3, 8)]:
        px(im, x, y, FOLHA_C)
    return im


def t_arvore_tronco():
    im = t_grama(2)
    ret(im, 6, 0, 4, 13, MADEIRA)
    ret(im, 6, 0, 1, 13, MADEIRA_E)
    ret(im, 9, 0, 1, 13, MADEIRA_E)
    ret(im, 4, 12, 8, 2, MADEIRA_E)
    ret(im, 3, 13, 10, 2, GRAMA_E)
    return im


def t_arbusto():
    im = t_grama(0)
    for j in range(4, T - 1):
        for i in range(2, T - 2):
            d = (i - 7.5) ** 2 + (j - 10) ** 2 * 1.6
            if d < 42:
                px(im, i, j, FOLHA)
            elif d < 58:
                px(im, i, j, FOLHA_E)
    pontos(im, [(5, 7), (9, 8), (7, 6)], FOLHA_C)
    return im


def t_flores():
    im = t_grama(0)
    for (x, y, c) in [(3, 5, VERMELHO), (10, 4, OURO), (6, 11, ROSA), (12, 10, ROXO_C)]:
        px(im, x, y, c); px(im, x + 1, y, c); px(im, x, y + 1, c); px(im, x + 1, y + 1, c)
        px(im, x, y + 2, GRAMA_E)
    return im


def t_chao_caverna():
    im = nova(T, T)
    ret(im, 0, 0, T, T, PEDRA)
    for (x, y) in [(3, 3), (11, 6), (6, 11), (14, 13), (1, 8)]:
        px(im, x, y, PEDRA_E)
    for (x, y) in [(8, 2), (2, 12), (13, 4)]:
        px(im, x, y, PEDRA_C)
    return im


def t_parede_caverna():
    im = nova(T, T)
    ret(im, 0, 0, T, T, PEDRA_E)
    ret(im, 0, 0, T, 3, PEDRA)
    for (x, y) in [(2, 6), (9, 8), (5, 12), (12, 10)]:
        px(im, x, y, TINTA_2); px(im, x + 1, y, TINTA_2)
    return im


def t_caminho_pedra():
    im = nova(T, T)
    ret(im, 0, 0, T, T, TERRA)
    for (x, y, w, h) in [(1, 1, 6, 5), (8, 2, 6, 4), (2, 8, 5, 5), (9, 9, 5, 5)]:
        ret(im, x, y, w, h, PEDRA)
        ret(im, x, y + h - 1, w, 1, PEDRA_E)
    return im


TILES = [
    ("grama", t_grama(0)),
    ("grama2", t_grama(1)),
    ("grama3", t_grama(2)),
    ("flores", t_flores()),
    ("terra", t_terra()),
    ("caminho", t_caminho_pedra()),
    ("agua", t_agua(0)),
    ("agua2", t_agua(1)),
    ("pedra", t_pedra()),
    ("madeira", t_parede_madeira()),
    ("telhado", t_telhado()),
    ("copa", t_arvore_copa()),
    ("tronco", t_arvore_tronco()),
    ("arbusto", t_arbusto()),
    ("chao_caverna", t_chao_caverna()),
    ("parede_caverna", t_parede_caverna()),
]


def gerar_tileset():
    cols = 8
    linhas = (len(TILES) + cols - 1) // cols
    folha = nova(cols * T, linhas * T)
    for i, (nome, im) in enumerate(TILES):
        folha.paste(a_mao("tile-" + nome) or im, ((i % cols) * T, (i // cols) * T))
    folha.save(os.path.join(SAIDA, "tileset.png"))
    return {nome: i for i, (nome, _) in enumerate(TILES)}


# ------------------------------------------------------- heroi em 3 camadas
def heroi_frame(direcao, passo, camada):
    """direcao: 0 baixo, 1 esquerda, 2 direita, 3 cima
       passo: 0 parado, 1 perna direita, 2 parado, 3 perna esquerda
       camada: 'base' | 'roupa' | 'cabelo'
       ordem de desenho no jogo: base, roupa, cabelo."""
    im = nova(PW, PH)
    B = BRANCO
    bal = 0 if passo in (0, 2) else (1 if passo == 1 else -1)

    if camada == "cabelo":
        if direcao == 3:
            ret(im, 4, 3, 8, 9, B)
        else:
            ret(im, 4, 3, 8, 2, B)
            ret(im, 4, 5, 1, 7, B)
            ret(im, 11, 5, 1, 7, B)
            if direcao == 1:
                ret(im, 5, 5, 2, 2, B)
            if direcao == 2:
                ret(im, 9, 5, 2, 2, B)
        return im

    if camada == "roupa":
        ret(im, 4, 12, 8, 6, B)
        ret(im, 4, 11, 8, 1, B)
        for x in range(4, 12):
            if x % 2 == 0:
                px(im, x, 18, B)
        return im

    # ---- base: cabeca, orelhas, olhos, bracos, pernas, botas, cajado
    ret(im, 4, 3, 8, 8, PELE)
    ret(im, 4, 10, 8, 1, PELE_E)
    contorno(im, 3, 2, 10, 10)
    if direcao != 3:
        pontos(im, [(2, 6), (1, 5), (2, 7), (13, 6), (14, 5), (13, 7)], PELE)
        pontos(im, [(1, 4), (0, 5), (2, 8), (14, 4), (15, 5), (13, 8)], TINTA)
    if direcao == 0:
        pontos(im, [(6, 7), (9, 7)], TINTA)
        px(im, 7, 9, PELE_E); px(im, 8, 9, PELE_E)
    elif direcao == 1:
        pontos(im, [(5, 7), (7, 7)], TINTA)
    elif direcao == 2:
        pontos(im, [(8, 7), (10, 7)], TINTA)
    # tronco fica vazio de proposito, quem preenche e a camada roupa
    contorno(im, 3, 11, 10, 8)
    # bracos
    ret(im, 3, 13, 1, 3, PELE)
    ret(im, 12, 13, 1, 3, PELE)
    pontos(im, [(2, 13), (2, 14), (2, 15), (13, 13), (13, 14), (13, 15)], TINTA)
    # pernas e botas
    ret(im, 5, 19, 2, 2 + bal, PELE)
    ret(im, 9, 19, 2, 2 - bal, PELE)
    ret(im, 5, 21 + bal, 2, 2, TINTA_2)
    ret(im, 9, 21 - bal, 2, 2, TINTA_2)
    # cajado
    if direcao != 3:
        cx = 14 if direcao != 1 else 1
        for y in range(6, 22):
            px(im, cx, y, MADEIRA if y % 4 else MADEIRA_E)
        px(im, cx, 5, ROXO)
        px(im, cx, 4, ROXO_C)
    return im


def gerar_heroi():
    for camada in ("base", "cabelo", "roupa"):
        folha = nova(PW * 4, PH * 4)
        for d in range(4):
            for p in range(4):
                folha.paste(heroi_frame(d, p, camada), (p * PW, d * PH))
        folha.save(os.path.join(SAIDA, f"heroi-{camada}.png"))


# ----------------------------------------------------------------- goblin
def goblin_frame(passo):
    im = nova(PW, PH)
    bal = 0 if passo in (0, 2) else (1 if passo == 1 else -1)
    ret(im, 4, 5, 8, 7, GOBLIN)
    ret(im, 4, 10, 8, 2, GOBLIN_E)
    contorno(im, 3, 4, 10, 9)
    pontos(im, [(2, 6), (1, 5), (2, 7), (13, 6), (14, 5), (13, 7)], GOBLIN_C)
    pontos(im, [(1, 4), (0, 5), (14, 4), (15, 5)], TINTA)
    pontos(im, [(6, 8), (9, 8)], TINTA)
    px(im, 7, 10, TINTA); px(im, 8, 10, TINTA)
    # capuz cinza pontudo
    ret(im, 4, 2, 8, 3, PEDRA)
    pontos(im, [(7, 0), (8, 0), (6, 1), (7, 1), (8, 1), (9, 1)], PEDRA)
    contorno(im, 3, 1, 10, 5, TINTA)
    # corpo
    ret(im, 4, 12, 8, 6, GOBLIN_E)
    contorno(im, 3, 12, 10, 7)
    ret(im, 5, 19, 2, 3 + bal, GOBLIN)
    ret(im, 9, 19, 2, 3 - bal, GOBLIN)
    return im


def gerar_goblin():
    folha = nova(PW * 4, PH)
    for p in range(4):
        folha.paste(goblin_frame(p), (p * PW, 0))
    folha.save(os.path.join(SAIDA, "goblin.png"))


# ------------------------------------------------------------------ npc
def npc_frame(cor_roupa, cor_cabelo):
    im = nova(PW, PH)
    ret(im, 4, 3, 8, 8, PELE)
    contorno(im, 3, 2, 10, 10)
    ret(im, 4, 3, 8, 3, cor_cabelo)
    ret(im, 3, 4, 2, 5, cor_cabelo)
    ret(im, 11, 4, 2, 5, cor_cabelo)
    pontos(im, [(6, 7), (9, 7)], TINTA)
    ret(im, 4, 11, 8, 8, cor_roupa)
    contorno(im, 3, 11, 10, 9)
    ret(im, 5, 19, 2, 3, PELE_E)
    ret(im, 9, 19, 2, 3, PELE_E)
    return im


NPCS = [
    ("npc-vovo", ROXO, PAPEL_2),
    ("npc-ferreiro", MADEIRA, TERRA_E),
    ("npc-menina", ROSA, OURO),
    ("npc-pescador", AZUL, PEDRA),
]


def gerar_npcs():
    folha = nova(PW * len(NPCS), PH)
    for i, (_, roupa, cabelo) in enumerate(NPCS):
        folha.paste(npc_frame(roupa, cabelo), (i * PW, 0))
    folha.save(os.path.join(SAIDA, "npcs.png"))


# --------------------------------------------------------------- objetos
def gerar_objetos():
    """Objetos de 16x16 numa folha unica: sino, fogueira, bau, placa, cristal."""
    itens = []

    sino = nova(T, T)
    ret(sino, 5, 3, 6, 8, OURO)
    ret(sino, 4, 9, 8, 2, OURO_E)
    ret(sino, 3, 11, 10, 2, OURO)
    contorno(sino, 3, 2, 10, 12)
    px(sino, 7, 13, OURO_E); px(sino, 8, 13, OURO_E)
    px(sino, 7, 1, TINTA); px(sino, 8, 1, TINTA)
    itens.append(sino)

    fogueira = nova(T, T)
    ret(fogueira, 3, 11, 10, 3, MADEIRA_E)
    for j in range(4, 12):
        largura = max(1, 8 - abs(j - 9))
        ret(fogueira, 8 - largura // 2, j, largura, 1, BRASA)
    for j in range(7, 12):
        ret(fogueira, 7, j, 2, 1, OURO)
    itens.append(fogueira)

    bau = nova(T, T)
    ret(bau, 3, 6, 10, 7, MADEIRA)
    ret(bau, 3, 4, 10, 3, MADEIRA_C)
    ret(bau, 3, 8, 10, 1, OURO)
    ret(bau, 7, 8, 2, 3, OURO)
    contorno(bau, 3, 4, 10, 9)
    itens.append(bau)

    placa = nova(T, T)
    ret(placa, 7, 8, 2, 7, MADEIRA_E)
    ret(placa, 2, 2, 12, 7, MADEIRA_C)
    contorno(placa, 2, 2, 12, 7)
    ret(placa, 4, 4, 8, 1, MADEIRA_E)
    ret(placa, 4, 6, 6, 1, MADEIRA_E)
    itens.append(placa)

    cristal = nova(T, T)
    for j in range(3, 13):
        largura = 6 - abs(j - 8) // 2 * 2
        ret(cristal, 8 - largura // 2, j, largura, 1, OURO)
    ret(cristal, 7, 6, 2, 4, PAPEL)
    itens.append(cristal)

    folha = nova(T * len(itens), T)
    for i, im in enumerate(itens):
        folha.paste(im, (i * T, 0))
    folha.save(os.path.join(SAIDA, "objetos.png"))


def main():
    os.makedirs(SAIDA, exist_ok=True)
    indice = gerar_tileset()
    indice_ui = ui_arte.gerar(SAIDA)
    gerar_heroi()
    gerar_goblin()
    gerar_npcs()
    gerar_objetos()
    print("tileset:", indice)
    print("ui:", indice_ui)
    print("arte gerada em", os.path.normpath(SAIDA))


if __name__ == "__main__":
    main()
