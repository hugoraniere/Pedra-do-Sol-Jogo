# -*- coding: utf-8 -*-
"""Serpente do Pantano.

"Engoliu o Cristal do Meio-dia sem querer." O SEM QUERER e a chave: ela nao e
uma vila, e um bicho grande que fez besteira. Por isso ela nao tem cara de
raiva; tem cara de incomodada, e o cristal aparece brilhando de dentro dela, no
meio do corpo, visivel de longe.

A fraqueza e cocegas embaixo do queixo, entao o queixo precisa estar A MOSTRA:
o pescoco sobe em S e deixa a garganta exposta na frente. E o desenho dizendo
onde e o ponto fraco, sem texto.

Ela nao anda: desliza. No ciclo de caminhada quem se mexe sao as curvas do
corpo, e nao pernas. Grade de 24 x 40.
"""
import os, sys
from base import *  # noqa

L, A = 24, 40
ESC_C = (126, 174, 96)      # escama, luz
ESC = (86, 132, 72)
ESC_E = (56, 92, 56)
BARRIGA = (206, 200, 150)
BARRIGA_E = (166, 158, 116)
CRISTAL = (255, 214, 96)


def serpente(direcao, coluna, tipo="pantano"):
    direcao, giro = normalizar(direcao)
    im = nova(L, A)
    bal, sobe, _ = deslocamento(coluna)
    tonto = coluna == "tonto"
    bote = coluna == "conjura"

    cx = L // 2
    base = A - 3
    virado = -1 if direcao == "esquerda" else 1
    de_lado = direcao in ("esquerda", "direita")

    # ------------------------------------------------------------- o rabo
    # uma volta larga no chao, que e o que da peso ao bicho
    elipse(im, cx, base - 4, 10, 4, ESC)
    elipse(im, cx, base - 5, 8, 3, ESC_C)
    elipse(im, cx, base - 3, 9, 3, ESC_E)
    # a ponta do rabo saindo da volta, do lado contrario ao da cabeca
    for k in range(6):
        px(im, cx - virado * (10 + k // 2), base - 5 - k, ESC if k < 4 else ESC_E)

    # ------------------------------------------------- o corpo, com o cristal
    # segunda volta, menor, por cima da primeira
    meio_y = base - 11
    elipse(im, cx + bal, meio_y, 7, 4, ESC)
    elipse(im, cx + bal, meio_y - 1, 6, 3, ESC_C)
    # a barriga clara aparece na frente da volta
    elipse(im, cx + bal, meio_y + 2, 5, 2, BARRIGA)
    px(im, cx + bal - 4, meio_y + 2, BARRIGA_E)
    # O CRISTAL, brilhando de dentro. Pisca com o quadro de respiracao.
    brilho = CRISTAL if coluna in ("respira", "conjura") else (226, 176, 72)
    elipse(im, cx + bal, meio_y + 1, 2, 2, brilho)
    px(im, cx + bal, meio_y, (255, 246, 200))

    # ----------------------------------------------------------- o pescoco
    # sobe em S: sai da volta pela frente, recua, e sobe. A garganta fica
    # exposta na curva de baixo, que e onde se faz cocega.
    altura = 13 if not bote else 9
    pescoco = []
    for k in range(altura):
        t = k / max(altura - 1, 1)
        # o S: dois senos somados, o de baixo mais largo
        dx = int(3.2 * (1 - t) * virado * (1 if not de_lado else 1.4)) - int(2.4 * t * virado)
        x = cx + bal + dx + (1 if tonto else 0)
        y = meio_y - 3 - k
        larg = 3 if k < altura - 3 else 2
        ret(im, x - larg // 2, y, larg, 1, ESC)
        px(im, x - larg // 2, y, ESC_C)
        px(im, x + larg // 2, y, ESC_E)
        pescoco.append((x, y))
    # a garganta clara, na barriga da curva de baixo
    for k in range(3, 7):
        x, y = pescoco[k]
        px(im, x + virado * 2, y, BARRIGA)
        px(im, x + virado * 2, y + 1, BARRIGA_E)

    # ------------------------------------------------------------ a cabeca
    hx, hy = pescoco[-1]
    hy -= 2
    elipse(im, hx, hy, 4, 3, ESC)
    elipse(im, hx, hy - 1, 3, 2, ESC_C)
    # focinho comprido, saindo da silhueta na direcao em que ela olha
    for k in range(4):
        px(im, hx + virado * (3 + k), hy + (k > 1), ESC)
        px(im, hx + virado * (3 + k), hy - 1 + (k > 1), ESC_C)
    # o queixo, mais claro: o alvo da cocega
    for k in range(3):
        px(im, hx + virado * (2 + k), hy + 2, BARRIGA)

    if bote:
        # boca aberta: o unico quadro em que ela mostra os dentes
        for k in range(4):
            px(im, hx + virado * (3 + k), hy + 2 + k // 2, TINTA)
        px(im, hx + virado * 4, hy + 1, PAPEL)
        px(im, hx + virado * 6, hy + 2, PAPEL)
    else:
        # a lingua bifurcada, so as vezes
        if coluna in ("passo-a", "respira"):
            px(im, hx + virado * 7, hy + 1, VERMELHO)
            px(im, hx + virado * 8, hy, VERMELHO)
            px(im, hx + virado * 8, hy + 2, VERMELHO)

    if direcao != "cima":
        # olho de reptil: uma fenda vertical, nao um ponto
        ox = hx + virado * 1
        if tonto:
            px(im, ox, hy - 1, TINTA); px(im, ox + 1, hy, TINTA)
        else:
            px(im, ox, hy - 1, OURO)
            px(im, ox, hy, TINTA)

    contorno_seletivo(im, TINTA, TINTA_2)
    luz_de_cima(im, (ESC, ESC_C), (160, 202, 124))
    for i in range(cx - 10, cx + 10):
        for j in (base, base + 1):
            if 0 <= j < A and im.getpixel((i, j))[3] == 0:
                px(im, i, j, (36, 30, 52, 70 if j == base else 45))
    return im


TIPOS = {"pantano": {}}
