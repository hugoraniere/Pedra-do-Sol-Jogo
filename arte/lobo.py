# -*- coding: utf-8 -*-
"""Lobo de Nevoa.

"Aparece e some no meio da neblina." Ele nao e um lobo cinzento: e nevoa com
forma de lobo, e a diferenca esta na BORDA. O corpo tem contorno so embaixo,
onde encosta no chao; em cima ele se desfaz em pontos soltos, como fumaca que
ainda nao decidiu ser bicho.

A fraqueza e luz forte, entao a unica parte solida dele sao os olhos, que
acendem. Num sprite de 16 px, dois pixels acesos no meio de uma mancha clara
sao o bastante para dar medo sem precisar de dente nenhum.

Ele e baixo e comprido: ocupa a metade de baixo do quadro e quase toda a
largura. Silhueta de quadrupede, que nenhuma outra criatura do jogo tem.
"""
import os, sys
from base import *  # noqa

NEVOA_C = (222, 234, 244)
NEVOA_M = (186, 204, 220)
NEVOA_E = (140, 160, 182)
OLHO = (168, 226, 255)


def lobo(direcao, coluna, tipo="nevoa"):
    direcao, giro = normalizar(direcao)
    im = nova()
    bal, sobe, _ = deslocamento(coluna)
    tonto = coluna == "tonto"
    # o quadro "conjura" e o que ele usa para sumir: quase todo desfeito
    sumindo = coluna == "conjura"
    # agachado, pronto pro bote: nao precisa de dente novo, so postura --
    # "dar medo sem precisar de dente nenhum" e a propria regra do desenho.
    ataca = coluna == "ataque"
    # esquiva de lado: o corpo inteiro desloca, pernas e cabeca incluidas.
    esquiva = coluna == "esquiva"
    # derrota: agacha ao chao e os olhos apagam -- ele "e" a nevoa, entao
    # vencido nao e ferido, e a forma que se desfaz e nao acende mais.
    derrota = coluna == "derrota"

    base = 29 + sobe + (2 if derrota else 0)
    de_lado = direcao in ("esquerda", "direita")
    virado = -1 if direcao == "esquerda" else 1
    cx0 = 8 + (4 if esquiva else 0)

    if de_lado:
        # ---------------------------------------------------- vista de lado
        corpo_y = base - 9 + (2 if ataca else 0)
        elipse(im, cx0, corpo_y, 6, 3, NEVOA_M)
        elipse(im, cx0, corpo_y - 1, 5, 2, NEVOA_C)
        # quatro patas: as de tras e as da frente em oposicao, e o que faz trote
        for (dx, fase) in ((-4, 1), (-2, -1), (3, -1), (5, 1)):
            comp = (5 + fase * bal) if not derrota else 2
            x = cx0 + dx * virado
            for k in range(comp):
                px(im, x, corpo_y + 2 + k, NEVOA_M if k < comp - 2 else NEVOA_E)
        # pescoco e cabeca, baixos: lobo caca de cabeca abaixada. No bote a
        # cabeca joga ainda mais pra frente e mais baixo -- e o musculo que
        # avisa o bote, nao o dente.
        cx = cx0 + (6 + (2 if ataca else 0)) * virado
        cy = corpo_y - (1 if not tonto else -1) + (1 if ataca else 0)
        elipse(im, cx, cy, 3, 2, NEVOA_C)
        # focinho comprido saindo da silhueta
        for k in range(1, 4):
            px(im, cx + (3 + k) * virado, cy + 1, NEVOA_M)
            px(im, cx + (3 + k) * virado, cy, NEVOA_C)
        # orelha em pe
        px(im, cx - 1 * virado, cy - 3, NEVOA_M)
        px(im, cx - 1 * virado, cy - 4, NEVOA_E)
        px(im, cx + 1 * virado, cy - 3, NEVOA_M)
        # rabo: sobe e se desfaz
        for k in range(4):
            px(im, cx0 - (6 + k) * virado, corpo_y - k, NEVOA_M if k < 2 else NEVOA_E)
        olhos = [] if derrota else [(cx + 2 * virado, cy)]
    else:
        # ------------------------------------------- vista de frente e de costas
        # Ele estava pequeno demais: no meio da mata virava um borrao claro de
        # doze pixels e ninguem lia "lobo". Um quadrupede de frente precisa de
        # PEITO LARGO, quase da largura do quadro, com a cabeca baixa entre os
        # ombros e as quatro patas visiveis por baixo. Largura e o que da porte.
        corpo_y = base - 8 + (2 if ataca else 0)
        elipse(im, cx0, corpo_y, 7, 4, NEVOA_M)          # peito, bem largo
        elipse(im, cx0, corpo_y - 1, 6, 3, NEVOA_C)
        elipse(im, cx0, corpo_y - 4, 4, 3, NEVOA_E if direcao == "baixo" else NEVOA_M)
        # ombros salientes, um de cada lado da cabeca
        for dx in (-5, 5):
            elipse(im, cx0 + dx, corpo_y - 2, 2, 2, NEVOA_C)
        # quatro patas, as de dentro mais longas -- na derrota, so tocos curtos
        for (dx, dentro) in ((-6, False), (-2, True), (3, True), (6, False)):
            fase = bal if dx < 0 else -bal
            comp = 2 if derrota else (7 if dentro else 5) + fase
            for k in range(comp):
                px(im, cx0 + dx, corpo_y + 3 + k,
                   (NEVOA_M if dentro else NEVOA_E) if k < comp - 2 else NEVOA_E)
                if dentro:
                    px(im, cx0 + dx + 1, corpo_y + 3 + k, NEVOA_M if k < comp - 2 else NEVOA_E)
        cy = corpo_y - 6
        elipse(im, cx0, cy, 4, 3, NEVOA_C)               # cabeca, maior
        # orelhas em triangulo, bem separadas e altas -- deitadas na derrota
        alt_orelha = 1 if derrota else 3
        for dx in (-4, 4):
            for k in range(alt_orelha):
                px(im, cx0 + dx + (k // 2) * (1 if dx < 0 else -1), cy - 2 - k,
                   NEVOA_C if k < 2 else NEVOA_M)
        if direcao == "baixo":
            elipse(im, cx0, cy + 3, 3, 2, NEVOA_M)       # focinho
            px(im, cx0, cy + 4, TINTA_2)
            olhos = [] if derrota else [(cx0 - 2, cy), (cx0 + 2, cy)]
        else:
            for k in range(6):
                px(im, cx0, cy - 1 - k, NEVOA_M if k < 4 else NEVOA_E)
                px(im, cx0 + 1, cy - 1 - k, NEVOA_E)
            olhos = []

    # ------------------------------------------------- a nevoa se desfazendo
    # pontos soltos por cima da silhueta: e o que separa "lobo" de "lobo de
    # nevoa". Quando ele esta sumindo, sao muitos; quando esta inteiro, poucos.
    soltos = [(2, base - 14), (13, base - 12), (5, base - 16), (11, base - 15),
              (3, base - 11), (14, base - 16)]
    for i, (x, y) in enumerate(soltos):
        if sumindo or i < 3:
            px(im, x, y, NEVOA_E if i % 2 else NEVOA_M)

    contorno_seletivo(im, TINTA_2)
    if sumindo:
        # apaga metade do que foi desenhado, em xadrez: ele fica translucido
        for y in range(im.height):
            for x in range(im.width):
                if (x + y) % 2 and im.getpixel((x, y))[3]:
                    apagar(im, x, y)

    # os olhos por ultimo, e nunca apagados: a ultima coisa que some
    for (x, y) in olhos:
        px(im, x, y, OLHO)
        px(im, x, y - 1, (255, 255, 255))
    if not sumindo:
        sombra_chao(im, 5)
    return im


TIPOS = {"nevoa": {}}
