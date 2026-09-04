# -*- coding: utf-8 -*-
"""Espantalho Andarilho.

"Anda sozinho pelo campo procurando o dono." A leitura tem que ser essa em um
segundo: ele nao e um monstro, e uma coisa triste que se mexe. Por isso a cabeca
pende para o lado o tempo todo, inclusive parado, e o chapeu e grande demais
para ele.

A fraqueza e agua, entao ele e feito de palha e pano: material que encharca. A
silhueta e uma CRUZ, com os bracos abertos que nunca abaixam, porque foi assim
que o penduraram. Ele anda arrastando a estaca, nao dando passos: no ciclo de
caminhada quem balanca e o corpo inteiro, e nao as pernas.
"""
import os, sys
from base import *  # noqa

PALHA = (232, 196, 108)
PALHA_E = (186, 148, 72)
PANO = (226, 214, 186)
PANO_E = (176, 162, 134)


def espantalho(direcao, coluna, tipo="campo"):
    direcao, giro = normalizar(direcao)
    im = nova()
    bal, sobe, braco = deslocamento(coluna)
    tonto = coluna == "tonto"
    conjura = coluna == "conjura"

    base = 29 + sobe
    # ele nao da passo: gira em torno da estaca. O balanco da perna vira
    # inclinacao do corpo inteiro, que e como uma coisa empalada se move.
    incl = bal
    if tonto:
        incl = 2

    # ------------------------------------------------------------ estaca
    ret(im, 8, base - 6, 1, 6, MADEIRA_E)
    px(im, 7, base - 1, MADEIRA_E)
    px(im, 9, base - 2, MADEIRA_E)

    # ------------------------------------------------- corpo de palha
    corpo_topo = base - 17
    for j in range(corpo_topo, base - 5):
        k = (j - corpo_topo) / 12
        larg = int(2 + k * 3)
        x = 8 + int(incl * (1 - k))
        ret(im, x - larg, j, larg * 2, 1, PANO if j % 3 else PANO_E)
    # palha saindo por baixo do pano
    for (x, y) in ((5, base - 6), (10, base - 6), (7, base - 5), (11, base - 7)):
        px(im, x + incl, y, PALHA)
        px(im, x + incl, y + 1, PALHA_E)

    # --------------------------------------------------------- bracos
    # a travessa e reta e nao acompanha o passo: braco de espantalho nao balanca
    ombro = corpo_topo + 3
    for lado in (-1, 1):
        for k in range(1, 6):
            y = ombro + (1 if k > 3 else 0)
            px(im, 8 + lado * k + incl, y, MADEIRA)
            if k == 5:
                # palha na ponta da manga
                px(im, 8 + lado * k + incl, y - 1, PALHA)
                px(im, 8 + lado * (k + 1) + incl, y, PALHA_E)
    if conjura:
        # o unico quadro em que ele levanta os bracos: o cata-vento
        for lado in (-1, 1):
            for k in range(1, 5):
                px(im, 8 + lado * k + incl, ombro - k + 1, MADEIRA)

    # --------------------------------------------------------- cabeca
    # o saco de pano pende para um lado. Vira mais ainda quando tonto.
    pend = 1 if not tonto else 2
    cx = 8 + incl + pend * (1 if giro >= 0 else -1)
    cy = corpo_topo - 3
    elipse(im, cx, cy, 4, 4, PANO)
    elipse(im, cx - 1, cy - 1, 2, 2, PAPEL_2)
    # a costura da boca, sempre torta. De costas nao existe rosto.
    if direcao != "cima":
        for k in range(-2, 3):
            px(im, cx + k, cy + 2 + (abs(k) == 2), PANO_E)

    if direcao != "cima":
        # olhos de botao: dois pontos e uma cruz de linha em cima
        ox = -2 if direcao != "direita" else -1
        for lado in (0, 3):
            x = cx + ox + lado
            if tonto:
                px(im, x, cy - 1, TINTA); px(im, x + 1, cy, TINTA)
                px(im, x + 1, cy - 1, TINTA); px(im, x, cy, TINTA)
            else:
                px(im, x, cy - 1, TINTA)
                px(im, x, cy, TINTA_2)

    # --------------------------------------------------------- chapeu
    # grande demais, caido na testa: e o que da a cara de coisa emprestada
    aba = 6
    ret(im, cx - aba, cy - 3, aba * 2, 1, PALHA_E)
    ret(im, cx - aba + 1, cy - 4, aba * 2 - 2, 1, PALHA)
    elipse(im, cx, cy - 6, 3, 3, PALHA)
    elipse(im, cx, cy - 7, 2, 2, PALHA_E)
    px(im, cx - 3, cy - 4, PALHA_E)

    contorno_seletivo(im, TINTA, TINTA_2)
    luz_de_cima(im, (PANO, PALHA), PAPEL)
    sombra_chao(im, 4)
    return im


TIPOS = {"campo": {}}
