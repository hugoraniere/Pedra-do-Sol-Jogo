# -*- coding: utf-8 -*-
"""Arte da tela inicial: um cenario largo com montanha, floresta e o poste do sino.
O nome do jogo nao vem desenhado aqui, e escrito por cima com a fonte do jogo,
assim da para mudar o titulo sem regerar a arte."""
import os
import random
import sys
from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from paleta import *  # noqa

W, H = 320, 120


def nova(w=W, h=H):
    return Image.new("RGBA", (w, h), (0, 0, 0, 0))


def px(im, x, y, cor):
    x, y = int(x), int(y)
    if 0 <= x < im.width and 0 <= y < im.height:
        im.putpixel((x, y), cor if len(cor) == 4 else cor + (255,))


def ret(im, x, y, w, h, cor):
    for j in range(int(h)):
        for i in range(int(w)):
            px(im, x + i, y + j, cor)


def morro(im, cx, base, largura, altura, cor, cor_topo=None):
    for i in range(int(cx - largura), int(cx + largura + 1)):
        d = abs(i - cx) / largura
        alto = int(altura * (1 - d * d))
        for j in range(base - alto, base):
            px(im, i, j, cor)
        if cor_topo and alto > 3:
            px(im, i, base - alto, cor_topo)


def pinheiro(im, x, base, altura, cor, cor_c):
    largura = max(3, altura // 3)
    for j in range(altura):
        w = int(largura * (j / altura)) + 1
        for i in range(-w, w + 1):
            px(im, x + i, base - altura + j, cor)
        if j % 4 == 0:
            px(im, x - w, base - altura + j, cor_c)


def banner():
    im = nova()
    r = random.Random(7)

    # ceu, do creme quente em cima para o azul claro perto do horizonte
    for j in range(H):
        t = j / H
        cor = (
            int(255 - 90 * t),
            int(240 - 40 * t),
            int(210 + 20 * t),
        )
        ret(im, 0, j, W, 1, cor)

    # sol
    for j in range(H):
        for i in range(W):
            d = (i - 250) ** 2 + (j - 22) ** 2
            if d < 150:
                px(im, i, j, (255, 236, 180))
            elif d < 240:
                px(im, i, j, (255, 246, 214))

    # nuvens
    for (cx, cy, s) in [(60, 20, 1.4), (150, 14, 1.0), (215, 30, 0.8), (30, 40, 0.7)]:
        for (dx, dy, rx, ry) in [(0, 0, 12, 5), (-9, 2, 8, 4), (9, 2, 8, 4)]:
            for j in range(int(cy + dy - ry * s), int(cy + dy + ry * s + 1)):
                for i in range(int(cx + dx - rx * s), int(cx + dx + rx * s + 1)):
                    if ((i - cx - dx) / (rx * s)) ** 2 + ((j - cy - dy) / (ry * s)) ** 2 <= 1:
                        px(im, i, j, PAPEL)

    # montanhas ao fundo
    morro(im, 40, 78, 46, 34, (150, 148, 178), (206, 206, 224))
    morro(im, 96, 78, 40, 26, (162, 160, 188), (216, 216, 232))
    morro(im, 262, 78, 52, 30, (150, 148, 178), (206, 206, 224))

    # faixa de floresta escura
    ret(im, 0, 72, W, 10, (46, 92, 60))
    for x in range(-2, W + 4, 7):
        pinheiro(im, x, 82, r.randint(14, 22), (52, 104, 66), (76, 138, 84))

    # campo da frente
    ret(im, 0, 82, W, H - 82, GRAMA)
    for j in range(82, H):
        for i in range(W):
            if (i * 3 + j * 7) % 23 == 0:
                px(im, i, j, GRAMA_C)
            elif (i * 5 + j * 3) % 29 == 0:
                px(im, i, j, GRAMA_E)

    # trilha subindo ate a floresta
    for j in range(82, H):
        t = (j - 82) / (H - 82)
        largura = int(4 + t * 22)
        centro = 160 + int(t * 6)
        ret(im, centro - largura // 2, j, largura, 1, (206, 176, 128))
        px(im, centro - largura // 2, j, (176, 144, 100))
        px(im, centro + largura // 2 - 1, j, (176, 144, 100))

    # poste do sino, o simbolo da aventura 1
    bx, by = 208, 112
    ret(im, bx, by - 30, 3, 30, MADEIRA)
    ret(im, bx, by - 30, 3, 30, MADEIRA_E)
    ret(im, bx + 1, by - 30, 1, 30, MADEIRA)
    ret(im, bx, by - 30, 8, 2, MADEIRA)
    ret(im, bx + 6, by - 25, 5, 6, OURO)
    ret(im, bx + 5, by - 19, 7, 2, OURO_E)
    px(im, bx + 8, by - 17, OURO_E)
    ret(im, bx - 3, by - 1, 9, 2, GRAMA_E)

    # duas arvores grandes emoldurando
    for tx in (22, 298):
        ret(im, tx - 3, 92, 7, 28, MADEIRA)
        ret(im, tx - 3, 92, 2, 28, MADEIRA_E)
        ret(im, tx + 2, 92, 2, 28, MADEIRA_E)
        for (dx, dy, rx, ry) in [(0, 0, 20, 16), (-13, 10, 13, 10), (13, 10, 13, 10)]:
            cy2 = 78 + dy
            for j in range(cy2 - ry, cy2 + ry + 1):
                for i in range(tx + dx - rx, tx + dx + rx + 1):
                    if ((i - tx - dx) / rx) ** 2 + ((j - cy2) / ry) ** 2 <= 1:
                        px(im, i, j, FOLHA)
        for j in range(78, 96):
            for i in range(tx - 24, tx + 25):
                if im.getpixel((max(0, min(W - 1, i)), j))[:3] == FOLHA and (i + j) % 3 == 0:
                    px(im, i, j, FOLHA_E)
        for _ in range(16):
            px(im, tx + r.randint(-16, 16), 66 + r.randint(0, 16), FOLHA_C)

    # vinheta escura nas bordas, ajuda o texto a se destacar
    for j in range(H):
        for i in range(W):
            d = max(0.0, (abs(i - W / 2) / (W / 2)) ** 3, (abs(j - H / 2) / (H / 2)) ** 3)
            if d > 0.55:
                r0, g0, b0, a0 = im.getpixel((i, j))
                k = min(0.45, (d - 0.55) * 1.2)
                px(im, i, j, (int(r0 * (1 - k) + 44 * k), int(g0 * (1 - k) + 36 * k), int(b0 * (1 - k) + 64 * k)))
    return im


def gerar(saida, a_mao=None):
    im = (a_mao("titulo") if a_mao else None) or banner()
    im.save(os.path.join(saida, "titulo.png"))
