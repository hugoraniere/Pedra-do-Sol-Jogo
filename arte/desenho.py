# -*- coding: utf-8 -*-
"""Primitivas de desenho, compartilhadas por quem desenha peca inteira.

Sairam de arte/mundo.py quando arte/floresta.py passou a precisar das mesmas
funcoes: sem um modulo comum, os dois se importariam em circulo. Aqui nao mora
nenhum desenho, so o pincel."""
import os
import sys
from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from paleta import *  # noqa


def nova(w, h):
    return Image.new("RGBA", (w, h), (0, 0, 0, 0))


def px(im, x, y, cor):
    x, y = int(x), int(y)
    if 0 <= x < im.width and 0 <= y < im.height:
        im.putpixel((x, y), cor if len(cor) == 4 else cor + (255,))


def ret(im, x, y, w, h, cor):
    for j in range(int(h)):
        for i in range(int(w)):
            px(im, x + i, y + j, cor)


def linha_h(im, x, y, w, cor):
    ret(im, x, y, w, 1, cor)


def linha_v(im, x, y, h, cor):
    ret(im, x, y, 1, h, cor)


def contorno_alfa(im, cor=TINTA):
    """Poe 1 px de contorno em volta de tudo que ja foi desenhado."""
    base = im.copy()
    for j in range(im.height):
        for i in range(im.width):
            if base.getpixel((i, j))[3]:
                continue
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                a, b = i + dx, j + dy
                if 0 <= a < im.width and 0 <= b < im.height and base.getpixel((a, b))[3] > 200:
                    px(im, i, j, cor)
                    break
    return im


def sombra(im, largura, altura, cx, cy, forca=90):
    """Elipse escura no chao. E o que gruda o objeto no cenario."""
    for j in range(int(cy - altura), int(cy + altura + 1)):
        for i in range(int(cx - largura), int(cx + largura + 1)):
            if 0 <= i < im.width and 0 <= j < im.height:
                d = ((i - cx) / largura) ** 2 + ((j - cy) / altura) ** 2
                if d <= 1:
                    r, g, b, a = im.getpixel((i, j))
                    if a == 0:
                        px(im, i, j, (36, 30, 52, forca))
    return im
