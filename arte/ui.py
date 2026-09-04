# -*- coding: utf-8 -*-
"""Sprites de interface: painel de 9 fatias, icones e o direcional de toque.
Tudo na mesma paleta e no mesmo tracado do resto do jogo."""
import os
import sys
from PIL import Image, ImageDraw

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from paleta import *  # noqa

U = 16  # celula dos icones


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


# ------------------------------------------------------- painel 9 fatias
def painel(fundo, borda=TINTA, luz=None, tamanho=24):
    """Imagem de 24x24 pensada para o NineSlice do Phaser com cantos de 8 px.
    O miolo e liso, entao pode esticar do tamanho que for."""
    im = nova(tamanho, tamanho)
    ret(im, 0, 0, tamanho, tamanho, fundo)
    # contorno de 1 px
    for i in range(tamanho):
        px(im, i, 0, borda); px(im, i, tamanho - 1, borda)
        px(im, 0, i, borda); px(im, tamanho - 1, i, borda)
    # cantos arredondados
    for (x, y) in [(0, 0), (1, 0), (0, 1), (tamanho - 1, 0), (tamanho - 2, 0), (tamanho - 1, 1),
                   (0, tamanho - 1), (1, tamanho - 1), (0, tamanho - 2),
                   (tamanho - 1, tamanho - 1), (tamanho - 2, tamanho - 1), (tamanho - 1, tamanho - 2)]:
        px(im, x, y, (0, 0, 0, 0))
    for (x, y) in [(1, 1), (tamanho - 2, 1), (1, tamanho - 2), (tamanho - 2, tamanho - 2)]:
        px(im, x, y, borda)
    # brilho de cima, da o volume do material impresso
    if luz:
        for i in range(2, tamanho - 2):
            px(im, i, 1, luz)
    # sombra de baixo
    for i in range(2, tamanho - 2):
        px(im, i, tamanho - 2, borda)
    return im


# ------------------------------------------------------------- icones
def i_coracao(cheio=True):
    im = nova(U, U)
    forma = [
        "..XXX.XXX..",
        ".XCCCXCCCX.",
        "XCCCCCCCCCX",
        "XCCCCCCCCCX",
        "XCCCCCCCCCX",
        ".XCCCCCCCX.",
        "..XCCCCCX..",
        "...XCCCX...",
        "....XCX....",
        ".....X.....",
    ]
    dentro = VERMELHO if cheio else (0, 0, 0, 0)
    for j, linha in enumerate(forma):
        for i, ch in enumerate(linha):
            if ch == "X":
                px(im, i + 3, j + 3, TINTA)
            elif ch == "C":
                px(im, i + 3, j + 3, dentro)
    if cheio:
        pontos(im, [(6, 5), (7, 5), (6, 6)], (255, 150, 140))
    return im


def i_moeda():
    im = nova(U, U)
    for j in range(U):
        for i in range(U):
            d = (i - 7.5) ** 2 + (j - 7.5) ** 2
            if d < 20:
                px(im, i, j, OURO)
            elif d < 30:
                px(im, i, j, TINTA)
    ret(im, 6, 5, 1, 6, OURO_E)
    ret(im, 9, 5, 1, 6, OURO_E)
    pontos(im, [(5, 4), (6, 4)], (255, 230, 160))
    return im


def i_selo():
    im = nova(U, U)
    estrela = [
        ".....X.....",
        "....XCX....",
        "...XCCCX...",
        "XXXXCCCXXXX",
        ".XCCCCCCCX.",
        "..XCCCCCX..",
        "..XCCCCCX..",
        ".XCCX.XCCX.",
        ".XCX...XCX.",
        "..X.....X..",
    ]
    for j, linha in enumerate(estrela):
        for i, ch in enumerate(linha):
            if ch == "X":
                px(im, i + 3, j + 3, TINTA)
            elif ch == "C":
                px(im, i + 3, j + 3, OURO)
    return im


def i_seta(direcao):
    """direcao: 0 cima, 1 baixo, 2 esquerda, 3 direita"""
    im = nova(U, U)
    for j in range(6):
        largura = 1 + j * 2
        ret(im, 8 - largura // 2 - largura % 2 // 2, 4 + j, largura, 1, PAPEL)
    ret(im, 6, 9, 4, 3, PAPEL)
    # contorno
    base = im.copy()
    for j in range(U):
        for i in range(U):
            if base.getpixel((i, j))[3]:
                continue
            vizinho = any(
                0 <= i + dx < U and 0 <= j + dy < U and base.getpixel((i + dx, j + dy))[3]
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))
            )
            if vizinho:
                px(im, i, j, TINTA)
    giros = {0: 0, 1: 180, 2: 90, 3: 270}
    return im.rotate(giros[direcao])


def i_botao_a():
    im = nova(U, U)
    for j in range(U):
        for i in range(U):
            d = (i - 7.5) ** 2 + (j - 7.5) ** 2
            if d < 30:
                px(im, i, j, OURO)
            elif d < 44:
                px(im, i, j, TINTA)
    for j in range(U):
        for i in range(U):
            d = (i - 7.5) ** 2 + (j - 6.5) ** 2
            if 20 < d < 30:
                px(im, i, j, OURO_E)
    letra = ["..X..", ".X.X.", "X...X", "XXXXX", "X...X"]
    for j, linha in enumerate(letra):
        for i, ch in enumerate(linha):
            if ch == "X":
                px(im, i + 6, j + 5, TINTA)
    return im


def i_mochila():
    im = nova(U, U)
    ret(im, 4, 5, 8, 8, MADEIRA)
    ret(im, 4, 5, 8, 2, MADEIRA_C)
    ret(im, 6, 3, 4, 2, MADEIRA_E)
    ret(im, 7, 8, 2, 3, OURO)
    for i in range(U):
        for j in range(U):
            pass
    # contorno
    for (x, y, w, h) in [(4, 5, 8, 8)]:
        for i in range(w):
            px(im, x + i, y - 1, TINTA); px(im, x + i, y + h, TINTA)
        for j in range(h):
            px(im, x - 1, y + j, TINTA); px(im, x + w, y + j, TINTA)
    return im


def i_livro():
    im = nova(U, U)
    ret(im, 3, 4, 10, 9, PAPEL)
    ret(im, 3, 4, 10, 2, AZUL)
    ret(im, 7, 4, 2, 9, AZUL)
    for j in range(7, 12, 2):
        ret(im, 4, j, 3, 1, TINTA_2)
        ret(im, 10, j, 2, 1, TINTA_2)
    for i in range(10):
        px(im, 3 + i, 3, TINTA); px(im, 3 + i, 13, TINTA)
    for j in range(9):
        px(im, 2, 4 + j, TINTA); px(im, 13, 4 + j, TINTA)
    return im


def i_lupa():
    im = nova(U, U)
    for j in range(U):
        for i in range(U):
            d = (i - 6.5) ** 2 + (j - 6.5) ** 2
            if d < 12:
                px(im, i, j, AGUA_C)
            elif d < 20:
                px(im, i, j, TINTA)
    for k in range(4):
        px(im, 10 + k, 10 + k, TINTA)
        px(im, 11 + k, 10 + k, TINTA)
    pontos(im, [(4, 4), (5, 4)], PAPEL)
    return im


def i_dado():
    im = nova(U, U)
    ret(im, 3, 3, 10, 10, PAPEL)
    for i in range(10):
        px(im, 3 + i, 2, TINTA); px(im, 3 + i, 13, TINTA)
        px(im, 2, 3 + i, TINTA); px(im, 13, 3 + i, TINTA)
    for (x, y) in [(5, 5), (10, 5), (5, 10), (10, 10), (7, 7)]:
        px(im, x, y, TINTA); px(im, x + 1, y, TINTA)
        px(im, x, y + 1, TINTA); px(im, x + 1, y + 1, TINTA)
    return im


ICONES = [
    ("coracao_cheio", i_coracao(True)),
    ("coracao_vazio", i_coracao(False)),
    ("moeda", i_moeda()),
    ("selo", i_selo()),
    ("seta_cima", i_seta(0)),
    ("seta_baixo", i_seta(1)),
    ("seta_esq", i_seta(2)),
    ("seta_dir", i_seta(3)),
    ("botao_a", i_botao_a()),
    ("mochila", i_mochila()),
    ("livro", i_livro()),
    ("lupa", i_lupa()),
    ("dado", i_dado()),
]


def gerar(saida):
    folha = nova(U * len(ICONES), U)
    for i, (_, im) in enumerate(ICONES):
        folha.paste(im, (i * U, 0))
    folha.save(os.path.join(saida, "ui.png"))
    painel(PAPEL, TINTA, PAPEL_2).save(os.path.join(saida, "painel.png"))
    painel(PAPEL_2, TINTA, PAPEL).save(os.path.join(saida, "painel-creme.png"))
    painel(OURO, TINTA, (255, 214, 120)).save(os.path.join(saida, "painel-ouro.png"))
    painel(TINTA, TINTA_2, TINTA_2).save(os.path.join(saida, "painel-escuro.png"))
    return {nome: i for i, (nome, _) in enumerate(ICONES)}


def favicon(caminho):
    """Icone da aba do navegador, 32 x 32: o selo dourado do Reino de Aurora.

    Existe por um motivo bobo e real: sem ele o navegador pede /favicon.ico em
    toda carga, leva 404, e o 404 aparece no console junto com os erros de
    verdade. Erro falso no console e pior que icone feio, porque treina a gente
    a ignorar o console."""
    im = Image.new("RGBA", (32, 32), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.ellipse((1, 1, 30, 30), fill=TINTA)
    d.ellipse((3, 3, 28, 28), fill=OURO)
    d.ellipse((5, 5, 26, 22), fill=(255, 214, 92))
    # a estrela de quatro pontas, a mesma da tunica do mago
    for (x0, y0, x1, y1) in ((14, 7, 17, 24), (7, 14, 24, 17)):
        d.rectangle((x0, y0, x1, y1), fill=TINTA)
    d.rectangle((13, 13, 18, 18), fill=TINTA)
    im.save(caminho)
