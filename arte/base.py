# -*- coding: utf-8 -*-
"""Ferramentas comuns de desenho. Nada de personagem aqui, so o encanamento."""
import os
import sys
from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from paleta import *  # noqa

PW, PH = 16, 32
COLUNAS = ["parado", "passo-a", "passo-b", "respira", "conjura", "tonto"]
LINHAS = ["baixo", "esquerda", "direita", "cima"]

B = (255, 255, 255)
BS = (196, 196, 196)
BL = (255, 255, 255)
VAZIO4 = (0, 0, 0, 0)


def nova(w=PW, h=PH):
    return Image.new("RGBA", (w, h), VAZIO4)


def px(im, x, y, cor):
    x, y = int(x), int(y)
    if 0 <= x < im.width and 0 <= y < im.height:
        im.putpixel((x, y), cor if len(cor) == 4 else tuple(cor) + (255,))


def ret(im, x, y, w, h, cor):
    for j in range(int(h)):
        for i in range(int(w)):
            px(im, x + i, y + j, cor)


def pontos(im, lista, cor):
    for (x, y) in lista:
        px(im, x, y, cor)


def elipse(im, cx, cy, rx, ry, cor):
    for j in range(int(cy - ry), int(cy + ry + 1)):
        for i in range(int(cx - rx), int(cx + rx + 1)):
            if ((i - cx) / max(rx, 0.01)) ** 2 + ((j - cy) / max(ry, 0.01)) ** 2 <= 1:
                px(im, i, j, cor)


def apagar(im, x, y):
    px(im, x, y, VAZIO4)


def contorno_seletivo(im, escuro=TINTA, medio=None):
    """1 px de contorno. Escuro embaixo e nas laterais, tom medio so em cima,
    onde a luz bate. E o selout, que evita o desenho ficar chapado."""
    base = im.copy()
    for j in range(im.height):
        for i in range(im.width):
            if base.getpixel((i, j))[3]:
                continue
            vizinhos = []
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                a, b = i + dx, j + dy
                if 0 <= a < im.width and 0 <= b < im.height and base.getpixel((a, b))[3] > 200:
                    vizinhos.append((dx, dy))
            if not vizinhos:
                continue
            so_por_cima = all(dy == 1 for (_, dy) in vizinhos)
            px(im, i, j, medio if (so_por_cima and medio) else escuro)
    return im


def sombra_chao(im, largura=6, base_y=None):
    base_y = base_y if base_y is not None else im.height - 2
    for i in range(8 - largura, 8 + largura):
        for j in (base_y, base_y + 1):
            if 0 <= j < im.height and im.getpixel((i, j))[3] == 0:
                borda = abs(i - 7.5) > largura - 1.5
                if not (borda and j == base_y):
                    px(im, i, j, (36, 30, 52, 70 if j == base_y else 45))
    return im


def deslocamento(coluna):
    """(balanco da perna, sobe e desce do corpo, balanco do braco)."""
    if coluna == "passo-a":
        return 1, -1, 1
    if coluna == "passo-b":
        return -1, -1, -1
    if coluna == "respira":
        return 0, 1, 0
    return 0, 0, 0


def folha(desenhar, **kw):
    im = Image.new("RGBA", (PW * len(COLUNAS), PH * len(LINHAS)), VAZIO4)
    for li, direcao in enumerate(LINHAS):
        for ci, coluna in enumerate(COLUNAS):
            im.paste(desenhar(direcao, coluna, **kw), (ci * PW, li * PH))
    return im


def descer(folha_im, dy):
    """Desce o conteudo dy pixels DENTRO DE CADA QUADRO.

    Nao da para deslocar a folha inteira de uma vez: ela e uma grade de quadros
    de 32 px colados, e mover tudo junto empurra o pe de um quadro para dentro
    da cabeca do quadro de baixo. O erro nao aparece parado, so quando a
    animacao roda, e ai o personagem pisca com pedacos de outro quadro."""
    if dy == 0:
        return folha_im
    saida = Image.new("RGBA", folha_im.size, VAZIO4)
    for topo in range(0, folha_im.height, PH):
        quadro = folha_im.crop((0, topo, folha_im.width, topo + PH))
        recorte = Image.new("RGBA", quadro.size, VAZIO4)
        if dy > 0:
            recorte.alpha_composite(quadro.crop((0, 0, quadro.width, PH - dy)), (0, dy))
        else:
            recorte.alpha_composite(quadro.crop((0, -dy, quadro.width, PH)), (0, 0))
        saida.paste(recorte, (0, topo))
    return saida


def pintar(im, cor):
    """Aplica cor nas camadas que sao desenhadas em branco. Preserva o contorno."""
    saida = im.copy()
    p = saida.load()
    for y in range(saida.height):
        for x in range(saida.width):
            r, g, b, a = p[x, y]
            if not a or (r, g, b) in (TINTA, TINTA_2):
                continue
            k = r / 255
            p[x, y] = (int(cor[0] * k), int(cor[1] * k), int(cor[2] * k), a)
    return saida


def linha(im, x0, y0, x1, y1, cor, cor2=None, passo_cor=2):
    """Linha de Bresenham. Se cor2 for dada, alterna as duas cores a cada
    passo_cor pixels, que e como sai a meia listrada das aranhas."""
    x0, y0, x1, y1 = int(x0), int(y0), int(x1), int(y1)
    dx, dy = abs(x1 - x0), -abs(y1 - y0)
    sx = 1 if x0 < x1 else -1
    sy = 1 if y0 < y1 else -1
    erro = dx + dy
    k = 0
    while True:
        px(im, x0, y0, cor2 if (cor2 and (k // passo_cor) % 2) else cor)
        if x0 == x1 and y0 == y1:
            break
        e2 = 2 * erro
        if e2 >= dy:
            erro += dy
            x0 += sx
        if e2 <= dx:
            erro += dx
            y0 += sy
        k += 1
