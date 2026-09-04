# -*- coding: utf-8 -*-
"""Objetos do mundo desenhados como pecas inteiras, nao como tiles soltos.

Foi essa a mudanca que tirou o jogo da cara de "quadradinho repetido": uma casa e
UMA imagem de 48x64 com telhado, porta, janela e chamine, nao seis tiles colados.
Arvore, poste do sino, barraca, cerca e poco seguem a mesma ideia.
"""
import os
import sys
from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from paleta import *  # noqa
from desenho import nova, px, ret, linha_h, linha_v, contorno_alfa, sombra
import floresta


# ------------------------------------------------------------------ casas
def telhado(im, x, y, w, h, base, claro, escuro):
    """Telhado de duas aguas com fileiras de telha."""
    for j in range(h):
        recuo = max(0, (h - 1 - j) // 2)
        largura = w - recuo * 2
        ret(im, x + recuo, y + j, largura, 1, base)
        if j % 3 == 0:
            ret(im, x + recuo, y + j, largura, 1, escuro)
        elif j % 3 == 1:
            for i in range(x + recuo + (j // 3) % 2, x + recuo + largura, 3):
                px(im, i, y + j, claro)
    # beiral
    ret(im, x - 1, y + h - 1, w + 2, 2, escuro)
    ret(im, x - 1, y + h - 1, w + 2, 1, claro)


def parede(im, x, y, w, h, base, claro, escuro):
    ret(im, x, y, w, h, base)
    for i in range(x, x + w, 4):
        linha_v(im, i, y, h, escuro)
    for i in range(x + 2, x + w, 4):
        linha_v(im, i, y, h, claro)
    ret(im, x, y + h - 2, w, 2, escuro)


def janela(im, x, y, w=8, h=7):
    ret(im, x, y, w, h, AGUA_E)
    ret(im, x, y, w, 2, AGUA)
    linha_v(im, x + w // 2, y, h, MADEIRA_C)
    linha_h(im, x, y + h // 2, w, MADEIRA_C)
    for i in range(w):
        px(im, x + i, y - 1, MADEIRA_E)
        px(im, x + i, y + h, MADEIRA_E)
    for j in range(h):
        px(im, x - 1, y + j, MADEIRA_E)
        px(im, x + w, y + j, MADEIRA_E)
    px(im, x + 1, y + 1, PAPEL)


def porta(im, x, y, w=10, h=14, cor=MADEIRA_E):
    ret(im, x, y, w, h, cor)
    for i in range(x + 1, x + w, 3):
        linha_v(im, i, y + 1, h - 1, MADEIRA)
    ret(im, x, y, w, 2, MADEIRA)
    px(im, x + w - 3, y + h // 2, OURO)
    px(im, x + w - 3, y + h // 2 + 1, OURO_E)
    for j in range(h):
        px(im, x - 1, y + j, TINTA)
        px(im, x + w, y + j, TINTA)
    for i in range(w):
        px(im, x + i, y - 1, TINTA)


def casa(w_tiles=3, h_px=64, cor_telha=(TELHA, TELHA_C, TELHA_E), com_chamine=True):
    w = w_tiles * 16
    im = nova(w, h_px)
    sombra(im, w / 2 - 1, 4, w / 2, h_px - 4)
    alt_telhado = 22
    topo = h_px - 4 - 34 - alt_telhado
    parede(im, 3, topo + alt_telhado, w - 6, 34, CR_PAREDE, CR_PAREDE_C, CR_PAREDE_E)
    porta(im, w // 2 - 5, topo + alt_telhado + 20)
    janela(im, 8, topo + alt_telhado + 6)
    if w >= 48:
        janela(im, w - 16, topo + alt_telhado + 6)
    telhado(im, 1, topo, w - 2, alt_telhado, *cor_telha)
    if com_chamine:
        ret(im, w - 16, topo - 8, 7, 12, PEDRA)
        ret(im, w - 16, topo - 8, 7, 2, PEDRA_C)
        for j in range(9):
            linha_h(im, w - 16, topo - 8 + j, 7, PEDRA if j % 2 else PEDRA_E)
        ret(im, w - 17, topo - 9, 9, 2, PEDRA_E)
    contorno_alfa(im)
    return im


CR_PAREDE = (232, 214, 178)
CR_PAREDE_C = (246, 234, 206)
CR_PAREDE_E = (196, 172, 134)


def casa_pequena():
    return casa(3, 60, (TELHA, TELHA_C, TELHA_E))


def casa_grande():
    return casa(4, 68, (TELHA, TELHA_C, TELHA_E))


def ferraria():
    im = casa(4, 68, (PEDRA, PEDRA_C, PEDRA_E), com_chamine=True)
    # bigorna do lado de fora
    ret(im, 6, im.height - 14, 12, 4, PEDRA_E)
    ret(im, 9, im.height - 10, 6, 4, PEDRA_E)
    ret(im, 5, im.height - 8, 14, 4, PEDRA)
    contorno_alfa(im)
    return im


def casa_vovo():
    im = casa(4, 68, (ROXO, ROXO_C, (86, 60, 148)))
    return im


# ---------------------------------------------------------------- arvores
def arvore(altura=52, largura=40, folha=(FOLHA, FOLHA_C, FOLHA_E)):
    im = nova(largura, altura)
    cx = largura / 2
    base = altura - 4
    sombra(im, largura / 2 - 4, 4, cx, base)
    # tronco
    ret(im, cx - 3, base - 16, 6, 16, MADEIRA)
    linha_v(im, cx - 3, base - 16, 16, MADEIRA_E)
    linha_v(im, cx + 2, base - 16, 16, MADEIRA_E)
    ret(im, cx - 5, base - 3, 10, 3, MADEIRA_E)
    # copa em tres bolhas, quebra o formato de bola perfeita
    copa = [(cx, base - 34, 15, 13), (cx - 10, base - 27, 11, 9), (cx + 10, base - 27, 11, 9)]
    for (bx, by, rx, ry) in copa:
        for j in range(int(by - ry), int(by + ry + 1)):
            for i in range(int(bx - rx), int(bx + rx + 1)):
                if ((i - bx) / rx) ** 2 + ((j - by) / ry) ** 2 <= 1:
                    px(im, i, j, folha[0])
    # sombra embaixo da copa e luz em cima
    for (bx, by, rx, ry) in copa:
        for j in range(int(by), int(by + ry + 1)):
            for i in range(int(bx - rx), int(bx + rx + 1)):
                d = ((i - bx) / rx) ** 2 + ((j - by) / ry) ** 2
                if 0.45 < d <= 1:
                    px(im, i, j, folha[2])
    for (dx, dy) in [(-6, -8), (-3, -11), (2, -10), (7, -6), (-9, -3), (5, -1), (-1, -4)]:
        px(im, cx + dx, base - 34 + dy, folha[1])
        px(im, cx + dx + 1, base - 34 + dy, folha[1])
    contorno_alfa(im)
    return im


def arvore_escura():
    return arvore(52, 40, ((52, 104, 66), (76, 138, 84), (34, 74, 48)))


def arbusto_obj():
    im = nova(20, 18)
    sombra(im, 8, 3, 10, 15)
    for (bx, by, rx, ry) in [(10, 9, 9, 6), (6, 11, 5, 4), (14, 11, 5, 4)]:
        for j in range(int(by - ry), int(by + ry + 1)):
            for i in range(int(bx - rx), int(bx + rx + 1)):
                if ((i - bx) / rx) ** 2 + ((j - by) / ry) ** 2 <= 1:
                    px(im, i, j, FOLHA)
    for i in range(3, 17):
        for j in range(11, 15):
            if im.getpixel((i, j))[3]:
                px(im, i, j, FOLHA_E)
    for (x, y) in [(7, 5), (12, 6), (9, 7)]:
        px(im, x, y, FOLHA_C)
    contorno_alfa(im)
    return im


# ------------------------------------------------------- moveis e cenario
def poste_sino(com_sino=False):
    im = nova(20, 46)
    sombra(im, 7, 3, 10, 43)
    ret(im, 8, 6, 4, 36, MADEIRA)
    linha_v(im, 8, 6, 36, MADEIRA_E)
    linha_v(im, 11, 6, 36, MADEIRA_C)
    ret(im, 5, 41, 10, 3, MADEIRA_E)
    # braco
    ret(im, 8, 6, 8, 3, MADEIRA)
    linha_h(im, 8, 6, 8, MADEIRA_C)
    if com_sino:
        ret(im, 12, 11, 6, 7, OURO)
        ret(im, 11, 17, 8, 2, OURO_E)
        ret(im, 10, 19, 10, 2, OURO)
        px(im, 14, 21, OURO_E); px(im, 15, 21, OURO_E)
        for j in range(11, 18):
            px(im, 12, j, OURO_E)
    else:
        # so a corda cortada balancando
        for j, x in enumerate([15, 15, 16, 16, 15]):
            px(im, x, 9 + j, TERRA_C)
            px(im, x, 9 + j, TERRA if j % 2 else TERRA_C)
    contorno_alfa(im)
    return im


def poco():
    im = nova(28, 30)
    sombra(im, 12, 4, 14, 27)
    ret(im, 4, 14, 20, 12, PEDRA)
    for j in range(14, 26, 4):
        for i in range(4 + ((j // 4) % 2) * 3, 24, 6):
            ret(im, i, j, 5, 3, PEDRA_E)
    ret(im, 4, 12, 20, 3, PEDRA_C)
    ret(im, 8, 13, 12, 3, TINTA_2)
    ret(im, 5, 4, 2, 10, MADEIRA)
    ret(im, 21, 4, 2, 10, MADEIRA)
    ret(im, 3, 0, 22, 5, TELHA)
    ret(im, 3, 4, 22, 1, TELHA_E)
    contorno_alfa(im)
    return im


def barraca_feira():
    im = nova(44, 34)
    sombra(im, 20, 4, 22, 31)
    ret(im, 4, 16, 36, 12, MADEIRA)
    ret(im, 4, 16, 36, 2, MADEIRA_C)
    ret(im, 4, 26, 36, 4, MADEIRA_E)
    for i, cor in enumerate([VERMELHO, PAPEL, VERDE, PAPEL, OURO, PAPEL, AZUL, PAPEL]):
        ret(im, 2 + i * 5, 4, 5, 9, cor)
    ret(im, 2, 12, 40, 2, TINTA_2)
    ret(im, 2, 2, 40, 3, MADEIRA_E)
    for (x, cor) in [(9, VERMELHO), (15, OURO), (21, VERDE), (27, ROSA), (33, ROXO_C)]:
        ret(im, x, 19, 4, 4, cor)
        px(im, x + 1, 18, FOLHA_E)
    contorno_alfa(im)
    return im


def cerca(vertical=False):
    im = nova(16, 20) if not vertical else nova(16, 20)
    sombra(im, 7, 2, 8, 18)
    if vertical:
        ret(im, 6, 2, 4, 16, MADEIRA)
        linha_v(im, 6, 2, 16, MADEIRA_E)
        ret(im, 2, 6, 12, 2, MADEIRA_C)
        ret(im, 2, 12, 12, 2, MADEIRA_C)
    else:
        for x in (2, 10):
            ret(im, x, 4, 4, 14, MADEIRA)
            linha_v(im, x, 4, 14, MADEIRA_E)
        ret(im, 0, 7, 16, 2, MADEIRA_C)
        ret(im, 0, 13, 16, 2, MADEIRA_C)
    contorno_alfa(im)
    return im


def fogueira():
    im = nova(20, 18)
    sombra(im, 9, 3, 10, 15)
    ret(im, 3, 10, 14, 4, MADEIRA_E)
    ret(im, 5, 12, 10, 3, MADEIRA)
    for j in range(2, 11):
        largura = max(1, 9 - abs(j - 7))
        ret(im, 10 - largura // 2, j, largura, 1, BRASA)
    for j in range(5, 11):
        largura = max(1, 5 - abs(j - 8))
        ret(im, 10 - largura // 2, j, largura, 1, OURO)
    for j in range(7, 11):
        px(im, 10, j, PAPEL)
    contorno_alfa(im)
    return im


def bau():
    im = nova(20, 18)
    sombra(im, 9, 3, 10, 16)
    ret(im, 3, 7, 14, 9, MADEIRA)
    for i in range(4, 17, 4):
        linha_v(im, i, 7, 9, MADEIRA_E)
    ret(im, 3, 3, 14, 5, MADEIRA_C)
    ret(im, 3, 8, 14, 2, OURO_E)
    ret(im, 8, 8, 4, 5, OURO)
    px(im, 10, 10, TINTA)
    contorno_alfa(im)
    return im


def placa():
    im = nova(20, 22)
    sombra(im, 7, 2, 10, 20)
    ret(im, 9, 10, 3, 10, MADEIRA_E)
    ret(im, 2, 2, 16, 9, MADEIRA_C)
    ret(im, 2, 9, 16, 2, MADEIRA)
    for (x, y, w) in [(5, 5, 10), (5, 7, 7)]:
        ret(im, x, y, w, 1, MADEIRA_E)
    contorno_alfa(im)
    return im


def varal():
    im = nova(48, 26)
    sombra(im, 21, 2, 24, 24)
    for x in (3, 43):
        ret(im, x, 6, 3, 18, MADEIRA)
        linha_v(im, x, 6, 18, MADEIRA_E)
    ret(im, 3, 6, 42, 1, TINTA_2)
    roupas = [(9, AZUL), (18, VERDE), (27, OURO), (36, PEDRA)]
    for (x, cor) in roupas:
        ret(im, x, 7, 7, 10, cor)
        ret(im, x, 7, 7, 2, PAPEL if cor != PEDRA else PEDRA_C)
        px(im, x + 3, 6, TINTA)
    contorno_alfa(im)
    return im


OBJETOS = [
    ("casa-pequena", casa_pequena, (0.10, 0.55)),
    ("casa-grande", casa_grande, (0.10, 0.55)),
    ("ferraria", ferraria, (0.10, 0.55)),
    ("casa-vovo", casa_vovo, (0.10, 0.55)),
    ("arvore", arvore, (0.30, 0.14)),
    ("arvore-escura", arvore_escura, (0.30, 0.14)),
    ("arbusto", arbusto_obj, (0.40, 0.45)),
    ("poste-sino", lambda: poste_sino(False), (0.25, 0.14)),
    ("poste-com-sino", lambda: poste_sino(True), (0.25, 0.14)),
    ("poco", poco, (0.40, 0.45)),
    ("barraca", barraca_feira, (0.45, 0.40)),
    ("cerca", cerca, (0.50, 0.40)),
    ("fogueira", fogueira, (0.40, 0.40)),
    ("bau", bau, (0.45, 0.45)),
    ("placa", placa, (0.30, 0.25)),
    ("varal", varal, (0.50, 0.30)),
    # a Floresta dos Sussurros. O desenho mora em arte/floresta.py; os nomes
    # ficam aqui em literal porque e desta lista que o verificar.mjs confere o
    # espelho com OBJETOS de src/dados/config.ts.
    ("pinheiro", floresta.pinheiro, (0.24, 0.11)),
    ("pinheiro-baixo", floresta.pinheiro_baixo, (0.24, 0.12)),
    ("grande-ouvinte", floresta.grande_ouvinte, (0.22, 0.09)),
    ("arvore-raio", floresta.arvore_raio, (0.24, 0.10)),
    ("tronco-caido", floresta.tronco_caido, (0, 0)),
    ("toco", floresta.toco, (0.40, 0.40)),
    ("samambaia", floresta.samambaia, (0, 0)),
    ("cogumelo", floresta.cogumelo, (0, 0)),
    ("cogumelo-azul", floresta.cogumelo_azul, (0, 0)),
    ("pedra-musgo", floresta.pedra_musgo, (0.45, 0.40)),
    ("teia", floresta.teia, (0, 0)),
    ("raizes", floresta.raizes, (0.40, 0.20)),
]


def gerar(saida, a_mao=None):
    """Salva cada objeto num PNG proprio e devolve o tamanho e a caixa de colisao."""
    pasta = os.path.join(saida, "objetos")
    os.makedirs(pasta, exist_ok=True)
    ficha = {}
    for nome, fabrica, (fw, fh) in OBJETOS:
        im = (a_mao(nome) if a_mao else None) or fabrica()
        im.save(os.path.join(pasta, nome + ".png"))
        ficha[nome] = {
            "w": im.width,
            "h": im.height,
            # caixa de colisao proporcional, ancorada nos pes do objeto
            "cw": round(im.width * fw * 2),
            "ch": round(im.height * fh),
        }
    return ficha
