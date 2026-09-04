# -*- coding: utf-8 -*-
"""Tiles de chao, 16x16. So chao: grama, terra, caminho, agua, pedra, caverna.
Casa, arvore, cerca e o resto sao objetos inteiros, em arte/mundo.py."""
import os
import random
import sys
from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from paleta import *  # noqa

T = 16


def nova():
    return Image.new("RGBA", (T, T), (0, 0, 0, 0))


def px(im, x, y, cor):
    x, y = int(x) % T, int(y) % T
    im.putpixel((x, y), cor if len(cor) == 4 else cor + (255,))


def ret(im, x, y, w, h, cor):
    for j in range(int(h)):
        for i in range(int(w)):
            px(im, x + i, y + j, cor)


def ruido(im, cor, quantidade, semente):
    r = random.Random(semente)
    for _ in range(quantidade):
        px(im, r.randrange(T), r.randrange(T), cor)


def grama(v=0):
    im = nova()
    ret(im, 0, 0, T, T, GRAMA)
    ruido(im, GRAMA_C, 26, 100 + v)
    ruido(im, GRAMA_E, 20, 200 + v)
    r = random.Random(300 + v)
    for _ in range(3):
        x, y = r.randrange(1, T - 1), r.randrange(1, T - 2)
        px(im, x, y, GRAMA_C); px(im, x, y + 1, GRAMA_C)
        px(im, x + 1, y + 1, GRAMA_E)
    return im


def grama_alta():
    im = grama(0)
    r = random.Random(77)
    for _ in range(9):
        x, y = r.randrange(1, T - 1), r.randrange(3, T - 3)
        for k in range(3):
            px(im, x, y + k, FOLHA if k else FOLHA_C)
        px(im, x + 1, y + 2, FOLHA_E)
    return im


def flores():
    im = grama(1)
    r = random.Random(9)
    for cor in (VERMELHO, OURO, ROSA, ROXO_C):
        x, y = r.randrange(2, T - 3), r.randrange(2, T - 3)
        px(im, x, y, cor); px(im, x + 1, y, cor)
        px(im, x, y + 1, cor); px(im, x + 1, y + 1, cor)
        px(im, x, y + 2, GRAMA_E)
        px(im, x, y, tuple(min(255, c + 40) for c in cor))
    return im


def terra():
    im = nova()
    ret(im, 0, 0, T, T, TERRA)
    ruido(im, TERRA_C, 22, 11)
    ruido(im, TERRA_E, 18, 12)
    return im


def caminho():
    """Terra batida clara com pedrinha solta. Nada de tijolo em grade."""
    im = nova()
    ret(im, 0, 0, T, T, (206, 176, 128))
    ruido(im, (222, 196, 154), 30, 21)
    ruido(im, (176, 144, 100), 22, 22)
    r = random.Random(23)
    for _ in range(4):
        x, y = r.randrange(1, T - 2), r.randrange(1, T - 2)
        px(im, x, y, PEDRA); px(im, x + 1, y, PEDRA)
        px(im, x, y + 1, PEDRA_E); px(im, x + 1, y + 1, PEDRA_E)
    return im


def agua(v=0):
    im = nova()
    ret(im, 0, 0, T, T, AGUA)
    for j in range(T):
        for i in range(T):
            if (i * 3 + j * 5 + v * 7) % 17 < 3:
                px(im, i, j, AGUA_E)
    r = random.Random(31 + v)
    for _ in range(3):
        x, y = r.randrange(T), r.randrange(T)
        px(im, x, y, AGUA_C); px(im, x + 1, y, AGUA_C); px(im, x + 2, y, AGUA_C)
    return im


def areia():
    im = nova()
    ret(im, 0, 0, T, T, (234, 214, 166))
    ruido(im, (246, 232, 194), 24, 41)
    ruido(im, (206, 182, 138), 16, 42)
    return im


def pedra():
    im = nova()
    ret(im, 0, 0, T, T, PEDRA)
    ret(im, 0, 0, T, 3, PEDRA_C)
    ret(im, 0, T - 4, T, 4, PEDRA_E)
    r = random.Random(51)
    for _ in range(5):
        x, y = r.randrange(1, T - 3), r.randrange(4, T - 5)
        ret(im, x, y, 3, 2, PEDRA_E)
    return im


def chao_caverna():
    im = nova()
    ret(im, 0, 0, T, T, (150, 158, 176))
    ruido(im, (172, 180, 196), 24, 61)
    ruido(im, (120, 130, 152), 20, 62)
    return im


def parede_caverna():
    im = nova()
    ret(im, 0, 0, T, T, (98, 106, 130))
    ret(im, 0, 0, T, 3, (128, 136, 160))
    r = random.Random(71)
    for _ in range(6):
        x, y = r.randrange(1, T - 3), r.randrange(4, T - 3)
        ret(im, x, y, 3, 2, (70, 76, 100))
    return im


def madeira_chao():
    im = nova()
    ret(im, 0, 0, T, T, MADEIRA_C)
    for j in range(0, T, 5):
        ret(im, 0, j, T, 1, MADEIRA_E)
    ruido(im, MADEIRA, 18, 81)
    return im


TILES = [
    ("grama", grama(0)),
    ("grama2", grama(1)),
    ("grama3", grama(2)),
    ("grama-alta", grama_alta()),
    ("flores", flores()),
    ("terra", terra()),
    ("caminho", caminho()),
    ("areia", areia()),
    ("agua", agua(0)),
    ("agua2", agua(1)),
    ("pedra", pedra()),
    ("madeira-chao", madeira_chao()),
    ("chao-caverna", chao_caverna()),
    ("parede-caverna", parede_caverna()),
]


def gerar(saida, a_mao=None):
    cols = 8
    linhas = (len(TILES) + cols - 1) // cols
    folha = Image.new("RGBA", (cols * T, linhas * T), (0, 0, 0, 0))
    for i, (nome, im) in enumerate(TILES):
        usado = (a_mao("tile-" + nome) if a_mao else None) or im
        folha.paste(usado, ((i % cols) * T, (i // cols) * T))
    folha.save(os.path.join(saida, "tileset.png"))
    return {nome: i for i, (nome, _) in enumerate(TILES)}
