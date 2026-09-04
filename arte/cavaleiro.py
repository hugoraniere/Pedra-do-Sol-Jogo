# -*- coding: utf-8 -*-
"""Cavaleiro de Cinzas.

"Armadura vazia por dentro, cheia de cinza." O desenho inteiro serve a essa
frase: a armadura e fechada e certinha, mas onde deveria haver corpo ha um
buraco escuro, e de dentro dele sai cinza. A viseira nao tem olhos: tem uma
FRESTA que acende, e o telegrafo do golpe dele e essa fresta acendendo.

Ele e o unico ser do jogo com linha reta. Todo o resto do Reino de Aurora e
feito de curva e canto arredondado; ele e feito de aresta. E o que faz o
jogador sentir que ele nao pertence a este mundo.

A fraqueza e agua fria: cinza quente apaga. Grade de 24 x 40, e ele usa a
altura toda, ao contrario do troll, que usa a largura.
"""
import os, sys
from base import *  # noqa

L, A = 24, 40
ACO_C = (176, 184, 200)
ACO = (128, 138, 158)
ACO_E = (86, 94, 116)
VAZIO_D = (28, 24, 36)
BRASA_C = (255, 176, 84)
CINZA = (150, 146, 152)


def cavaleiro(direcao, coluna, tipo="cinzas"):
    direcao, giro = normalizar(direcao)
    im = nova(L, A)
    bal, sobe, braco = deslocamento(coluna)
    tonto = coluna == "tonto"
    acende = coluna == "conjura"

    cx = L // 2
    base = A - 3 + sobe

    # ------------------------------------------------------------- pernas
    # grevas retangulares, sem curva nenhuma
    for (dx, fase) in ((-4, 1), (2, -1)):
        alt = 11 + fase * bal
        ret(im, cx + dx, base - alt, 4, alt, ACO)
        ret(im, cx + dx, base - alt, 1, alt, ACO_C)
        ret(im, cx + dx + 3, base - alt, 1, alt, ACO_E)
        for k in range(2, alt, 4):                      # placas
            ret(im, cx + dx, base - alt + k, 4, 1, ACO_E)
        ret(im, cx + dx - 1, base - 2, 6, 2, ACO_E)     # sabaton bicudo
        px(im, cx + dx + (5 if dx > 0 else -1), base - 1, ACO_E)

    peito_y = base - 26

    # ------------------------------------------------------------- tronco
    # tronco afunilando na cintura, nao um retangulo
    for j in range(15):
        larg = 12 - (2 if j > 10 else 0)
        ret(im, cx - larg // 2, peito_y + j, larg, 1, ACO)
    ret(im, cx - 6, peito_y, 12, 1, ACO_C)
    ret(im, cx - 6, peito_y + 14, 12, 1, ACO_E)
    ret(im, cx - 6, peito_y, 1, 15, ACO_C)
    ret(im, cx + 5, peito_y, 1, 15, ACO_E)
    # o V do peitoral, unica marca da placa
    for k in range(5):
        px(im, cx - 4 + k, peito_y + 3 + k, ACO_E)
        px(im, cx + 4 - k, peito_y + 3 + k, ACO_E)

    # o buraco: onde deveria estar o corpo. E o coracao do desenho.
    if direcao != "cima":
        # uma RACHA, com bordas irregulares. Retangulo virava painel de robo.
        for (dy, x0, larg) in ((0, -1, 3), (1, -2, 5), (2, -3, 6), (3, -2, 6),
                               (4, -2, 4), (5, -1, 3)):
            ret(im, cx + x0, peito_y + 6 + dy, larg, 1, VAZIO_D)
        for (x, y) in ((cx - 2, peito_y + 7), (cx + 2, peito_y + 9), (cx, peito_y + 10)):
            px(im, x, y, CINZA)
        if acende:
            px(im, cx, peito_y + 8, BRASA)
            px(im, cx + 1, peito_y + 9, BRASA_C)

    # ------------------------------------------------------------- ombros
    # pauldrons quadrados, mais largos que o peito: a silhueta de aresta
    for lado in (-1, 1):
        # tres placas sobrepostas, cada uma um pixel mais baixa e mais estreita:
        # e a sobreposicao que le como armadura, e nao a caixa que eu tinha
        # desenhado antes, que dava robo de lata.
        for k in range(3):
            larg = 6 - k
            x = cx + lado * 9 - larg // 2 - (0 if lado < 0 else 1)
            ret(im, x, peito_y - 3 + k * 2, larg, 2, ACO if k else ACO_C)
            ret(im, x, peito_y - 2 + k * 2, larg, 1, ACO_E)
        px(im, cx + lado * 12, peito_y - 3, ACO_E)      # espinho
    # bracos retos
    for lado in (-1, 1):
        b = braco * lado
        ret(im, cx + lado * 8 - 1, peito_y + 4 + b, 3, 9, ACO)
        ret(im, cx + lado * 8 - 1, peito_y + 4 + b, 1, 9, ACO_C)
        ret(im, cx + lado * 8 - 1, peito_y + 12 + b, 3, 2, ACO_E)   # manopla

    # -------------------------------------------------------------- elmo
    # Great helm: LARGO em cima e afunilando ate o queixo, topo chato. Eu tinha
    # feito o contrario, estreito em cima e abrindo embaixo, e com uma aba de
    # sobrancelha saliente: saia balde de chapeu, nao elmo. A forma de cima para
    # baixo e o que o olho reconhece como cavaleiro.
    cy = peito_y - 8
    for j in range(11):
        larg = 10 - (j * 4) // 11               # 10 em cima, 6 no queixo
        x = cx - larg // 2
        ret(im, x, cy - 3 + j, larg, 1, ACO)
        px(im, x, cy - 3 + j, ACO_C)
        px(im, x + larg - 1, cy - 3 + j, ACO_E)
    ret(im, cx - 5, cy - 3, 10, 1, ACO_C)       # topo chato
    ret(im, cx - 3, cy + 8, 6, 1, ACO_E)        # gola

    if direcao != "cima":
        frente = 0 if direcao == "baixo" else (-1 if direcao == "esquerda" else 1)
        # a fresta em cruz, o traco que so o elmo tem: uma horizontal larga e um
        # corte vertical descendo dela ate o queixo
        fx = cx - 4 + frente
        ret(im, fx, cy + 1, 8, 2, VAZIO_D)
        ret(im, cx + frente, cy + 3, 1, 4, VAZIO_D)
        if acende:
            ret(im, fx + 1, cy + 1, 6, 1, BRASA)
            ret(im, fx + 2, cy + 2, 4, 1, BRASA_C)
            px(im, cx + frente, cy + 4, BRASA)
        elif tonto:
            px(im, fx + 2, cy + 2, CINZA); px(im, fx + 5, cy + 1, CINZA)
        else:
            px(im, fx + 2, cy + 1, (92, 60, 44))
            px(im, fx + 5, cy + 1, (92, 60, 44))

    # ------------------------------------------------------- cinza subindo
    # sai do buraco e do elmo. Sempre, mesmo parado: ele esta queimando devagar.
    # A cinza subindo faz o papel que uma capa faria: da movimento sem
    # acrescentar massa. Uma capa desenhada a 24 px virou laje escura.
    fumaca = [(cx - 7, cy - 5), (cx + 7, cy - 8), (cx - 8, cy - 10),
              (cx + 6, cy - 12), (cx - 6, cy - 14), (cx + 8, cy - 16)]
    for i, (x, y) in enumerate(fumaca):
        if acende or i < 2:
            px(im, x, y, CINZA)
            px(im, x + 1, y - 1, (110, 106, 116))

    contorno_seletivo(im, TINTA)
    for i in range(cx - 8, cx + 8):
        for j in (base, base + 1):
            if 0 <= j < A and im.getpixel((i, j))[3] == 0:
                px(im, i, j, (36, 30, 52, 70 if j == base else 45))
    return im


TIPOS = {"cinzas": {}}
