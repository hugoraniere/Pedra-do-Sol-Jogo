# -*- coding: utf-8 -*-
"""Brasanegra, o dragao guardiao.

Ele nao e um dragao mau: e o guardiao da Pedra do Sol com o coracao cheio de
cinzas, e o nome verdadeiro dele e AUREL. Os dois finais do jogo dependem de o
jogador entender isso. Entao o desenho precisa carregar as duas coisas ao mesmo
tempo: por fora ele e escuro, quase carvao; por dentro ele ainda ARDE, e as
rachaduras acesas mostram isso.

E por isso que a brasa nao e enfeite. Ela e a prova de que sobrou fogo dentro
dele, e no quadro `conjura` o peito inteiro acende antes do sopro: o telegrafo
do golpe e a mesma coisa que a esperanca de salva-lo.

Grade de 48 x 48. E o unico ser do jogo desse tamanho, e e assim que se sabe,
sem nenhuma barra de vida, que a briga e outra.
"""
import os, sys
from base import *  # noqa

L, A = 48, 48
ESCAMA_C = (92, 78, 108)
ESCAMA = (60, 50, 76)
ESCAMA_E = (36, 30, 48)
ASA = (78, 60, 84)
ASA_E = (50, 38, 58)
CHIFRE_D = (198, 190, 178)
BRASA_Q = (255, 186, 74)
BRASA_F = (196, 88, 40)


def _brasa(im, pontos_lista, forte):
    for i, (x, y, comp) in enumerate(pontos_lista):
        for k in range(comp):
            cor = BRASA_Q if (forte or i % 2 == 0) else BRASA_F
            px(im, x + k, y + (k // 2), cor if k % 2 == 0 or forte else BRASA_F)


def dragao(direcao, coluna, tipo="brasanegra"):
    direcao, giro = normalizar(direcao)
    im = nova(L, A)
    bal, sobe, _ = deslocamento(coluna)
    tonto = coluna == "tonto"
    sopro = coluna == "conjura"

    cx = L // 2
    base = A - 4 + sobe
    virado = -1 if direcao == "esquerda" else 1
    de_lado = direcao in ("esquerda", "direita")

    # ------------------------------------------------------------- as asas
    # A primeira versao preenchia ate a linha reta entre as pontas dos dedos, e
    # saia um triangulo chapado que lia como montanha de fundo, nao como asa.
    # Asa de morcego nao tem borda reta: entre um dedo e outro a membrana CEDE,
    # e sao esses festoes que o olho reconhece. Aqui a membrana e preenchida ate
    # uma curva que afunda na direcao do ombro, e nao ate a reta.
    abertura = 1.0 if not sopro else 1.18
    for lado in (-1, 1):
        ombro_x, ombro_y = cx + lado * 6, base - 26
        dedos = [(-19, -13), (-20, -3), (-15, 5)]
        pontas = [(ombro_x + lado * int(-dx * abertura), ombro_y + int(dy * abertura))
                  for (dx, dy) in dedos]
        # membrana festonada, de um dedo ao seguinte
        for i in range(len(pontas) - 1):
            (x1, y1), (x2, y2) = pontas[i], pontas[i + 1]
            for p in range(25):
                k = p / 24
                mx = x1 + (x2 - x1) * k
                my = y1 + (y2 - y1) * k
                # o afundamento: maximo no meio do vao, zero nos dedos
                sag = (1 - (2 * k - 1) ** 2) * 4.5
                mx += (ombro_x - mx) * sag / 24
                my += (ombro_y - my) * sag / 24
                linha(im, ombro_x, ombro_y, int(mx), int(my), ASA)
        # os dedos por cima da membrana, mais claros: e o osso que da a leitura
        for (px_, py_) in pontas:
            linha(im, ombro_x, ombro_y, px_, py_, ASA_E)
            linha(im, ombro_x, ombro_y, px_, py_, ASA_E)
            px(im, px_, py_, CHIFRE_D)
            px(im, px_ + lado, py_, CHIFRE_D)
        # o osso do braco da asa, do ombro ate o dedo do meio, mais grosso
        (mx, my) = pontas[1]
        linha(im, ombro_x, ombro_y, mx, my, (108, 86, 112))
        linha(im, ombro_x, ombro_y - 1, mx, my - 1, (108, 86, 112))

    # -------------------------------------------------------------- o rabo
    for k in range(16):
        x = cx - virado * (8 + k) + (0 if not de_lado else 0)
        y = base - 6 + (k * k) // 30 - k // 3
        larg = max(1, 5 - k // 4)
        ret(im, x - larg // 2, y, larg, 1, ESCAMA if k < 12 else ESCAMA_E)
        px(im, x - larg // 2, y, ESCAMA_C)
    # a ponta do rabo, uma lamina
    px(im, cx - virado * 24, base - 10, CHIFRE_D)

    # -------------------------------------------------------------- corpo
    corpo_y = base - 12
    elipse(im, cx, corpo_y, 13, 8, ESCAMA)
    elipse(im, cx - 2, corpo_y - 3, 10, 5, ESCAMA_C)
    elipse(im, cx, corpo_y + 4, 12, 4, ESCAMA_E)
    # as patas dianteiras, com garra
    for (dx, fase) in ((-8, 1), (6, -1)):
        alt = 7 + fase * bal
        ret(im, cx + dx, base - alt, 4, alt, ESCAMA)
        ret(im, cx + dx, base - alt, 1, alt, ESCAMA_C)
        ret(im, cx + dx - 1, base - 2, 6, 2, ESCAMA_E)
        for k in range(3):
            px(im, cx + dx - 1 + k * 2, base - 1, CHIFRE_D)

    # ------------------------------------------------------------ pescoco
    altura = 15 if not sopro else 12
    pescoco = []
    for k in range(altura):
        t = k / max(altura - 1, 1)
        dx = int(virado * (2 - 5 * t)) if de_lado else int(1.5 * (0.5 - t) * 4)
        x = cx + dx + (1 if tonto else 0)
        y = corpo_y - 6 - k
        larg = 6 - (k * 3) // altura
        ret(im, x - larg // 2, y, larg, 1, ESCAMA)
        px(im, x - larg // 2, y, ESCAMA_C)
        px(im, x + larg // 2, y, ESCAMA_E)
        pescoco.append((x, y))
    # a crista de espinhos descendo o pescoco: a linha que le como dragao
    for k in range(0, altura, 2):
        x, y = pescoco[k]
        px(im, x - virado * (3 - k // 6), y, ESCAMA_E)

    # ------------------------------------------------------------- cabeca
    hx, hy = pescoco[-1]
    hy -= 3
    elipse(im, hx, hy, 6, 4, ESCAMA)
    elipse(im, hx, hy - 1, 5, 3, ESCAMA_C)
    # focinho comprido, saindo da silhueta
    for k in range(6):
        larg = 4 - k // 3
        y = hy + 1 + k // 4
        ret(im, hx + virado * (4 + k) - (larg // 2 if not de_lado else 0), y, larg, 1,
            ESCAMA if k < 4 else ESCAMA_E)
    # dois chifres varridos para tras, o traco mais reconhecivel
    for lado in (-1, 1):
        for k in range(6):
            px(im, hx + lado * (3 + k // 2) - virado * k // 2, hy - 3 - k + k // 3,
               CHIFRE_D if k < 4 else (150, 142, 132))

    if direcao != "cima":
        # o olho: uma fenda acesa. Ele nao tem pupila, tem brasa.
        ox = hx + virado * 2
        if tonto:
            px(im, ox, hy - 1, CHIFRE_D); px(im, ox + 1, hy, CHIFRE_D)
        else:
            px(im, ox, hy - 1, BRASA_Q)
            px(im, ox, hy, BRASA_F)
            px(im, ox - virado, hy - 1, ESCAMA_E)

    if sopro:
        # a boca aberta e a luz saindo dela
        for k in range(5):
            px(im, hx + virado * (5 + k), hy + 2 + k // 3, BRASA_F)
            px(im, hx + virado * (5 + k), hy + 1 + k // 3, BRASA_Q)

    # ---------------------------------------------------- as rachaduras
    # o que sobrou de fogo dentro dele. No sopro, o peito inteiro acende.
    rachas = [(cx - 6, corpo_y - 2, 5), (cx + 2, corpo_y + 1, 4),
              (cx - 2, corpo_y + 4, 6), (cx + 6, corpo_y - 4, 3)]
    _brasa(im, rachas, sopro)
    if sopro:
        elipse(im, cx, corpo_y, 5, 3, BRASA_F)
        elipse(im, cx, corpo_y, 3, 2, BRASA_Q)
    # e uma no pescoco, subindo: mostra que o fogo vem de dentro
    for k in range(0, min(6, altura), 2):
        x, y = pescoco[k]
        px(im, x, y, BRASA_F if not sopro else BRASA_Q)

    contorno_seletivo(im, TINTA)
    for i in range(cx - 14, cx + 14):
        for j in (base, base + 1, base + 2):
            if 0 <= j < A and im.getpixel((i, j))[3] == 0:
                px(im, i, j, (36, 30, 52, 70 if j == base else 45))
    return im


TIPOS = {"brasanegra": {}}
