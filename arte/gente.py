# -*- coding: utf-8 -*-
"""Personagens de 16x32, com cara, sombra e roupa com dobra.

O heroi sai em tres camadas (base, roupa, cabelo) porque o jogador escolhe as
cores. Roupa e cabelo sao desenhados em BRANCO e recebem tint no jogo, entao
qualquer combinacao funciona sem gerar sprite novo.
"""
import os
import sys
from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from paleta import *  # noqa

PW, PH = 16, 32
B = BRANCO
BS = (210, 210, 210)   # tom escuro da camada que recebe tint
BC = (255, 255, 255)


def nova():
    return Image.new("RGBA", (PW, PH), (0, 0, 0, 0))


def px(im, x, y, cor):
    x, y = int(x), int(y)
    if 0 <= x < PW and 0 <= y < PH:
        im.putpixel((x, y), cor if len(cor) == 4 else cor + (255,))


def ret(im, x, y, w, h, cor):
    for j in range(int(h)):
        for i in range(int(w)):
            px(im, x + i, y + j, cor)


def pontos(im, lista, cor):
    for (x, y) in lista:
        px(im, x, y, cor)


def contorno(im, cor=TINTA):
    base = im.copy()
    for j in range(PH):
        for i in range(PW):
            if base.getpixel((i, j))[3]:
                continue
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                a, b = i + dx, j + dy
                if 0 <= a < PW and 0 <= b < PH and base.getpixel((a, b))[3] > 200:
                    px(im, i, j, cor)
                    break
    return im


def sombra_pes(im):
    for (x, y) in [(4, 30), (5, 30), (6, 30), (7, 30), (8, 30), (9, 30), (10, 30), (11, 30),
                   (5, 31), (6, 31), (7, 31), (8, 31), (9, 31), (10, 31)]:
        if im.getpixel((x, y))[3] == 0:
            px(im, x, y, (36, 30, 52, 80))
    return im


# --------------------------------------------------------------- o heroi
def heroi(direcao, passo, camada, orelha_pontuda=True, cajado=True):
    """direcao 0 baixo, 1 esquerda, 2 direita, 3 cima
       passo 0 e 2 parado, 1 e 3 pernas trocadas
       camada 'base' | 'roupa' | 'cabelo'"""
    im = nova()
    bal = 0 if passo in (0, 2) else (1 if passo == 1 else -1)
    balanco_braco = 0 if passo in (0, 2) else (1 if passo == 1 else -1)

    # ---------------------------------------------------------- cabelo
    if camada == "cabelo":
        if direcao == 3:
            ret(im, 3, 4, 10, 12, B)
            ret(im, 2, 7, 12, 8, B)
            ret(im, 3, 15, 10, 2, BS)
        else:
            ret(im, 3, 4, 10, 4, B)          # franja
            ret(im, 4, 3, 8, 1, B)           # topo
            ret(im, 2, 6, 2, 9, B)           # mecha esquerda
            ret(im, 12, 6, 2, 9, B)          # mecha direita
            ret(im, 2, 14, 2, 2, BS)
            ret(im, 12, 14, 2, 2, BS)
            pontos(im, [(4, 8), (11, 8)], B)
            if direcao == 1:
                ret(im, 4, 6, 3, 3, B)
                ret(im, 3, 4, 6, 5, B)
            if direcao == 2:
                ret(im, 9, 6, 3, 3, B)
                ret(im, 7, 4, 6, 5, B)
            # brilho, da volume ao cabelo
            pontos(im, [(5, 4), (6, 4), (9, 4)], BC)
        return im

    # ----------------------------------------------------------- roupa
    if camada == "roupa":
        ret(im, 4, 16, 8, 9, B)              # tunica
        ret(im, 3, 17, 1, 6, B)              # ombro esquerdo
        ret(im, 12, 17, 1, 6, B)             # ombro direito
        ret(im, 4, 23, 8, 2, BS)             # sombra da barra
        for x in range(4, 12, 2):            # barra de folhas
            px(im, x, 25, BS)
        ret(im, 5, 17, 2, 4, BC)             # luz no peito
        if direcao != 3:
            ret(im, 4, 26 + max(0, -bal), 3, 1, BS)
        return im

    # ------------------------------------------------------------ base
    # cabeca
    ret(im, 3, 5, 10, 11, PELE)
    ret(im, 3, 13, 10, 3, PELE_E)
    ret(im, 4, 5, 8, 2, PELE_C)
    # orelhas
    if orelha_pontuda and direcao != 3:
        pontos(im, [(2, 9), (2, 10), (1, 8), (13, 9), (13, 10), (14, 8)], PELE)
        pontos(im, [(1, 7), (0, 8), (14, 7), (15, 8)], PELE_E)
    elif direcao != 3:
        pontos(im, [(2, 10), (13, 10)], PELE)
    # rosto
    if direcao == 0:
        ret(im, 5, 10, 2, 2, PAPEL); ret(im, 9, 10, 2, 2, PAPEL)
        px(im, 6, 11, TINTA); px(im, 10, 11, TINTA)
        pontos(im, [(5, 9), (6, 9), (9, 9), (10, 9)], TINTA_2)
        px(im, 8, 13, PELE_E); px(im, 7, 13, PELE_E)
        px(im, 7, 14, (216, 140, 130)); px(im, 8, 14, (216, 140, 130))
    elif direcao == 1:
        ret(im, 4, 10, 2, 2, PAPEL)
        px(im, 4, 11, TINTA)
        pontos(im, [(4, 9), (5, 9)], TINTA_2)
        px(im, 4, 14, (216, 140, 130))
    elif direcao == 2:
        ret(im, 10, 10, 2, 2, PAPEL)
        px(im, 11, 11, TINTA)
        pontos(im, [(10, 9), (11, 9)], TINTA_2)
        px(im, 11, 14, (216, 140, 130))
    # pescoco e tronco (a roupa cobre, aqui so a forma)
    ret(im, 6, 16, 4, 1, PELE_E)
    # bracos com balanco
    ret(im, 2, 18 + balanco_braco, 2, 6, PELE)
    ret(im, 12, 18 - balanco_braco, 2, 6, PELE)
    ret(im, 2, 23 + balanco_braco, 2, 2, PELE_E)
    ret(im, 12, 23 - balanco_braco, 2, 2, PELE_E)
    # pernas
    ret(im, 5, 25, 2, 3 + bal, PELE)
    ret(im, 9, 25, 2, 3 - bal, PELE)
    # botas
    ret(im, 4, 28 + bal, 3, 2, MADEIRA_E)
    ret(im, 9, 28 - bal, 3, 2, MADEIRA_E)
    ret(im, 4, 29 + bal, 3, 1, TINTA_2)
    ret(im, 9, 29 - bal, 3, 1, TINTA_2)
    # cajado
    if cajado and direcao != 3:
        cx = 14 if direcao != 1 else 1
        for y in range(8, 29):
            px(im, cx, y, MADEIRA if y % 3 else MADEIRA_E)
        px(im, cx, 7, ROXO_C); px(im, cx, 6, ROXO)
        px(im, cx + (1 if cx < 8 else -1), 7, ROXO)
    contorno(im)
    sombra_pes(im)
    return im


def folha_heroi(camada):
    folha = Image.new("RGBA", (PW * 4, PH * 4), (0, 0, 0, 0))
    for d in range(4):
        for p in range(4):
            folha.paste(heroi(d, p, camada), (p * PW, d * PH))
    return folha


# ------------------------------------------------------------------ npcs
def npc(cor_roupa, cor_cabelo, cor_pele=PELE, chapeu=None, barba=False, cabelo_longo=False):
    im = nova()
    pele_e = tuple(max(0, c - 40) for c in cor_pele)
    ret(im, 3, 5, 10, 11, cor_pele)
    ret(im, 3, 13, 10, 3, pele_e)
    ret(im, 4, 5, 8, 2, tuple(min(255, c + 20) for c in cor_pele))
    pontos(im, [(2, 10), (13, 10)], cor_pele)
    # cabelo
    ret(im, 3, 4, 10, 4, cor_cabelo)
    ret(im, 4, 3, 8, 1, cor_cabelo)
    ret(im, 2, 6, 2, 7 if not cabelo_longo else 12, cor_cabelo)
    ret(im, 12, 6, 2, 7 if not cabelo_longo else 12, cor_cabelo)
    # olhos
    ret(im, 5, 10, 2, 2, PAPEL); ret(im, 9, 10, 2, 2, PAPEL)
    px(im, 6, 11, TINTA); px(im, 10, 11, TINTA)
    px(im, 7, 14, (216, 140, 130)); px(im, 8, 14, (216, 140, 130))
    if barba:
        ret(im, 4, 13, 8, 3, cor_cabelo)
        ret(im, 5, 16, 6, 2, cor_cabelo)
    if chapeu:
        ret(im, 2, 2, 12, 3, chapeu)
        ret(im, 4, 0, 8, 3, chapeu)
        ret(im, 2, 4, 12, 1, tuple(max(0, c - 40) for c in chapeu))
    # corpo
    ret(im, 6, 16, 4, 1, pele_e)
    ret(im, 4, 17, 8, 9, cor_roupa)
    ret(im, 3, 18, 1, 6, cor_roupa)
    ret(im, 12, 18, 1, 6, cor_roupa)
    ret(im, 4, 24, 8, 2, tuple(max(0, c - 35) for c in cor_roupa))
    ret(im, 5, 18, 2, 4, tuple(min(255, c + 30) for c in cor_roupa))
    ret(im, 2, 18, 2, 6, cor_pele)
    ret(im, 12, 18, 2, 6, cor_pele)
    # pernas e sapatos
    ret(im, 5, 26, 2, 2, pele_e)
    ret(im, 9, 26, 2, 2, pele_e)
    ret(im, 4, 28, 3, 2, MADEIRA_E)
    ret(im, 9, 28, 3, 2, MADEIRA_E)
    contorno(im)
    sombra_pes(im)
    return im


NPCS = [
    ("vovo", dict(cor_roupa=ROXO, cor_cabelo=(232, 228, 220), cabelo_longo=True)),
    ("ferreiro", dict(cor_roupa=(150, 96, 60), cor_cabelo=(96, 62, 40), barba=True, cor_pele=(206, 158, 120))),
    ("menina", dict(cor_roupa=ROSA, cor_cabelo=OURO, cabelo_longo=True)),
    ("pescador", dict(cor_roupa=AZUL, cor_cabelo=(140, 140, 152), chapeu=(206, 168, 116), barba=True)),
    ("mercador", dict(cor_roupa=VERDE, cor_cabelo=(60, 48, 40), chapeu=VERMELHO, cor_pele=(214, 168, 130))),
    ("menino", dict(cor_roupa=OURO, cor_cabelo=(150, 92, 52))),
    ("guarda", dict(cor_roupa=PEDRA, cor_cabelo=(60, 50, 46), chapeu=PEDRA_E, barba=True)),
    ("padeira", dict(cor_roupa=PAPEL_2, cor_cabelo=(196, 120, 60), cabelo_longo=True, cor_pele=(226, 180, 142))),
]


def folha_npcs():
    folha = Image.new("RGBA", (PW * len(NPCS), PH), (0, 0, 0, 0))
    for i, (_, args) in enumerate(NPCS):
        folha.paste(npc(**args), (i * PW, 0))
    return folha


# --------------------------------------------------------------- goblin
def goblin(passo):
    im = nova()
    bal = 0 if passo in (0, 2) else (1 if passo == 1 else -1)
    ret(im, 3, 7, 10, 10, GOBLIN)
    ret(im, 3, 14, 10, 3, GOBLIN_E)
    ret(im, 4, 7, 8, 2, GOBLIN_C)
    pontos(im, [(2, 10), (1, 9), (2, 11), (13, 10), (14, 9), (13, 11)], GOBLIN_C)
    pontos(im, [(1, 8), (0, 9), (14, 8), (15, 9)], GOBLIN_E)
    ret(im, 5, 11, 2, 2, PAPEL); ret(im, 9, 11, 2, 2, PAPEL)
    px(im, 6, 12, TINTA); px(im, 10, 12, TINTA)
    ret(im, 6, 15, 4, 1, TINTA_2)
    px(im, 6, 14, PAPEL); px(im, 9, 14, PAPEL)
    # capuz pontudo
    ret(im, 3, 4, 10, 4, PEDRA)
    ret(im, 5, 2, 6, 2, PEDRA)
    ret(im, 7, 0, 3, 2, PEDRA)
    ret(im, 3, 7, 10, 1, PEDRA_E)
    ret(im, 4, 5, 3, 2, PEDRA_C)
    # corpo
    ret(im, 4, 17, 8, 8, GOBLIN_E)
    ret(im, 3, 18, 1, 5, GOBLIN_E)
    ret(im, 12, 18, 1, 5, GOBLIN_E)
    ret(im, 5, 18, 2, 3, GOBLIN)
    ret(im, 2, 18, 2, 6, GOBLIN)
    ret(im, 12, 18, 2, 6, GOBLIN)
    ret(im, 5, 25, 2, 3 + bal, GOBLIN)
    ret(im, 9, 25, 2, 3 - bal, GOBLIN)
    ret(im, 4, 28 + bal, 3, 2, GOBLIN_E)
    ret(im, 9, 28 - bal, 3, 2, GOBLIN_E)
    contorno(im)
    sombra_pes(im)
    return im


def folha_goblin():
    folha = Image.new("RGBA", (PW * 4, PH), (0, 0, 0, 0))
    for p in range(4):
        folha.paste(goblin(p), (p * PW, 0))
    return folha


def gerar(saida, a_mao=None):
    for camada in ("base", "roupa", "cabelo"):
        im = (a_mao("heroi-" + camada) if a_mao else None) or folha_heroi(camada)
        im.save(os.path.join(saida, f"heroi-{camada}.png"))
    ((a_mao("npcs") if a_mao else None) or folha_npcs()).save(os.path.join(saida, "npcs.png"))
    ((a_mao("goblin") if a_mao else None) or folha_goblin()).save(os.path.join(saida, "goblin.png"))
    return {nome: i for i, (nome, _) in enumerate(NPCS)}
