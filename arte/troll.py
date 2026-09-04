# -*- coding: utf-8 -*-
"""Grulo, o Troll da ponte.

"Cobra pedagio na ponte. No fundo quer companhia." A segunda frase e que manda
no desenho. Ele nao pode dar medo de verdade: e grande, mas a postura e de
quem esta esperando alguem, nao de quem vai atacar. Ombros caidos, barrigao,
cabeca baixa, e olhos pequenos e juntos, que e o que da cara de bobo simpatico.

A fraqueza dele e uma boa gargalhada, entao o quadro `conjura` e ele RINDO, de
boca aberta e olhos fechados. Esse quadro e o momento em que o jogador ganha a
briga sem lutar, e por isso precisa ser o desenho mais bonito da folha.

Grade de 24 x 40: na de 16 x 32 ele nao seria maior que o heroi, e o tamanho e
metade do personagem dele.
"""
import os, sys
from base import *  # noqa

L, A = 24, 40
PELE_T = (128, 156, 118)
PELE_T_C = (160, 186, 142)
PELE_T_E = (92, 116, 88)
PANO_T = (150, 110, 78)


def troll(direcao, coluna, tipo="grulo"):
    direcao, giro = normalizar(direcao)
    im = nova(L, A)
    bal, sobe, braco = deslocamento(coluna)
    tonto = coluna == "tonto"
    rindo = coluna == "conjura"

    cx = L // 2
    base = A - 4 + sobe

    # ------------------------------------------------------------ pernas
    # curtas e grossas, bem afastadas: e o que sustenta o barrigao
    for (dx, fase) in ((-5, 1), (4, -1)):
        alt = 7 + fase * bal
        ret(im, cx + dx, base - alt, 5, alt, PELE_T)
        ret(im, cx + dx, base - alt, 1, alt, PELE_T_E)
        ret(im, cx + dx - 1, base - 2, 7, 2, PELE_T_E)      # pe chato e largo
        for k in range(3):                                   # dedos
            px(im, cx + dx + k * 2, base - 3, PELE_T_C)

    # ------------------------------------------------------------ barriga
    # o centro de gravidade do desenho. Ela vem a frente do peito.
    barriga_y = base - 15
    elipse(im, cx, barriga_y, 9, 7, PELE_T)
    elipse(im, cx - 2, barriga_y - 2, 6, 4, PELE_T_C)
    elipse(im, cx, barriga_y + 4, 8, 3, PELE_T_E)
    # o pano amarrado na cintura, unica roupa dele
    ret(im, cx - 9, barriga_y + 5, 18, 3, PANO_T)
    for x in range(cx - 8, cx + 8, 3):
        px(im, x, barriga_y + 7, (110, 78, 54))

    # ------------------------------------------------------------- ombros
    # caidos, bem abaixo da linha da cabeca: postura de quem espera
    ombro_y = barriga_y - 7
    for lado in (-1, 1):
        elipse(im, cx + lado * 8, ombro_y + 1, 4, 3, PELE_T)
        elipse(im, cx + lado * 8, ombro_y, 3, 2, PELE_T_C)
    # bracos compridos, passam do joelho. A borda de DENTRO e escura: sem ela o
    # braco tem a mesma cor da barriga, encosta nela e some. Num bicho todo da
    # mesma cor, quem separa as partes e a linha, nao o tom.
    for lado in (-1, 1):
        b = braco * lado
        for k in range(11):
            x = cx + lado * (10 - k // 5)
            y = ombro_y + 3 + k + (b if k > 4 else 0)
            ret(im, x - 1, y, 3, 1, PELE_T if k < 9 else PELE_T_E)
            px(im, x - lado, y, PELE_T_E)              # a borda de dentro
            px(im, x + lado, y, PELE_T_C)              # a luz por fora
        elipse(im, cx + lado * 9, ombro_y + 15 + b, 2, 2, PELE_T_C)
        elipse(im, cx + lado * 9, ombro_y + 16 + b, 2, 1, PELE_T_E)

    # ------------------------------------------------------------- cabeca
    # encaixada nos ombros, sem pescoco, e jogada para a frente
    cy = ombro_y - 4 + (1 if tonto else 0)
    # sombra embaixo do queixo: e o que descola a cabeca do peito sem precisar
    # de pescoco, que um troll nao tem
    elipse(im, cx, cy + 5, 5, 2, PELE_T_E)
    elipse(im, cx, cy, 6, 5, PELE_T)
    elipse(im, cx - 1, cy - 1, 5, 3, PELE_T_C)
    # orelhas pequenas, quase sumidas na cabeca grande
    for lado in (-1, 1):
        elipse(im, cx + lado * 6, cy, 2, 2, PELE_T_E)

    if direcao != "cima":
        frente = 0 if direcao == "baixo" else (-1 if direcao == "esquerda" else 1)
        # o nariz e a coisa maior do rosto, uma batata caida
        nx = cx + frente * 3
        elipse(im, nx, cy + 2, 3, 2, PELE_T_C)
        px(im, nx - 1, cy + 3, PELE_T_E)
        # olhos pequenos e juntos, quase colados no nariz
        for lado in (-1, 1):
            x = cx + lado * 2 + frente
            if rindo or tonto:
                # rindo: olho fechado, um traco para cima
                px(im, x - 1, cy - 1, TINTA); px(im, x, cy - 2, TINTA)
                px(im, x + 1, cy - 1, TINTA)
            else:
                px(im, x, cy - 1, TINTA)
                px(im, x, cy - 2, PELE_T_E)
        # a boca
        if rindo:
            ret(im, cx - 4, cy + 4, 9, 3, TINTA)
            ret(im, cx - 3, cy + 5, 7, 1, (168, 80, 90))     # lingua
            px(im, cx - 3, cy + 4, PAPEL); px(im, cx + 3, cy + 4, PAPEL)  # dentes
        else:
            ret(im, cx - 3, cy + 5, 7, 1, PELE_T_E)
            # o dente de baixo saindo da boca fechada, sempre
            px(im, cx + 2, cy + 4, PAPEL_2)
            px(im, cx + 2, cy + 3, PAPEL)

    # ---------------------------------------------------------- o porrete
    # so aparece de lado: de frente ele fica atras das costas
    if direcao in ("esquerda", "direita") and not rindo:
        v = -1 if direcao == "esquerda" else 1
        topo = ombro_y + 4 + braco * v
        for k in range(12):
            larg = 2 + k // 5
            ret(im, cx + v * 11 - larg // 2, topo + k, larg, 1, MADEIRA)
        elipse(im, cx + v * 11, topo + 13, 3, 3, MADEIRA_E)
        px(im, cx + v * 11, topo + 12, MADEIRA_C)

    contorno_seletivo(im, TINTA, TINTA_2)
    luz_de_cima(im, (PELE_T, PELE_T_C), (188, 210, 168))
    for i in range(cx - 8, cx + 8):
        for j in (base, base + 1):
            if 0 <= j < A and im.getpixel((i, j))[3] == 0:
                px(im, i, j, (36, 30, 52, 70 if j == base else 45))
    return im


TIPOS = {"grulo": {}}
