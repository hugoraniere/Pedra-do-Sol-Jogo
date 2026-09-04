# -*- coding: utf-8 -*-
"""Bruxa Espinho.

Ela quebrou a Pedra do Sol e e a vila dos tres cristais. Nao pode parecer bruxa
de fantasia: precisa parecer ESPINHO. Por isso a silhueta dela nao tem uma
curva sequer. Ombros pontudos, manto que termina em bico, chapeu torto que
parece um espinho saindo da cabeca, e cabelo que sao gravetos.

A fraqueza e nao conseguir mentir sobre o proprio nome, o que faz dela a
criatura que mais fala. Ela precisa de um quadro de boca aberta, e e o
"conjura" que serve para isso.

Alta e magra: ocupa o quadro inteiro de 32 px, ao contrario do goblin. Quando
os dois aparecerem juntos numa tela, a diferenca de altura conta quem manda.
"""
import os, sys
from base import *  # noqa

MANTO = (74, 52, 104)
MANTO_C = (104, 78, 142)
MANTO_E = (48, 34, 72)
PELE_B = (196, 206, 178)      # esverdeada, mas doente, nao de desenho animado
PELE_B_E = (154, 166, 140)
ESPINHO = (58, 44, 40)


def bruxa(direcao, coluna, tipo="espinho"):
    direcao, giro = normalizar(direcao)
    im = nova()
    bal, sobe, braco = deslocamento(coluna)
    tonto = coluna == "tonto"
    fala = coluna == "conjura"

    base = 29 + sobe
    # --------------------------------------------------------- o manto
    # de baixo para cima, estreitando: cone. E o cone que da o ar de espinho.
    #
    # O manto e CURTO e o chapeu e comprido, e nao o contrario. A primeira
    # versao tinha manto de 20 px e o chapeu saia pela borda de cima do quadro,
    # cortado. Num sprite de 32 px a altura e um orcamento: gastei no chapeu,
    # que e o que identifica a Bruxa de longe.
    MANTO_ALT = 13
    topo = base - MANTO_ALT
    for j in range(topo, base):
        k = (j - topo) / MANTO_ALT
        larg = int(1 + k * 5)
        # a barra do manto arrasta e balanca com o passo
        if j > base - 4:
            larg += 1 + abs(bal)
        x0 = 8 - larg + (bal if j > base - 6 else 0)
        ret(im, x0, j, larg * 2, 1, MANTO)
        px(im, x0, j, MANTO_E)
        px(im, x0 + larg * 2 - 1, j, MANTO_E)
        if j % 4 == 0:
            px(im, x0 + 1, j, MANTO_C)
    # a barra termina em bicos, nao em linha reta
    for x in (3, 6, 9, 12):
        px(im, x + bal, base, MANTO_E)

    # -------------------------------------------------------- os ombros
    # pontudos, subindo acima do pescoco: e a leitura de "espinho" a distancia
    ombro = topo + 3
    for lado in (-1, 1):
        for k in range(4):
            px(im, 8 + lado * (3 + k), ombro - k, MANTO if k < 2 else MANTO_E)
    # bracos finos saindo de dentro do manto
    for lado in (-1, 1):
        b = braco * lado
        for k in range(4):
            px(im, 8 + lado * (4 + k // 2), ombro + 2 + k + (b if k > 1 else 0), MANTO_E)
    if fala:
        # a mao levantada, apontando: o quadro em que ela fala e ameaca junto
        for k in range(4):
            px(im, 12, ombro + 1 - k, PELE_B_E)

    # -------------------------------------------------------- a cabeca
    # A primeira versao afogava o rosto no cabelo e o chapeu virava um tufo. O
    # rosto e o que a Bruxa tem de mais importante: a fraqueza dela e nao
    # conseguir mentir sobre o proprio nome, entao ela e a criatura que mais
    # fala, e falar exige boca visivel.
    cy = topo - 2
    cx = 8 + (1 if tonto else 0)
    elipse(im, cx, cy, 3, 3, PELE_B)
    ret(im, cx - 2, cy + 2, 5, 2, PELE_B)
    ret(im, cx - 2, cy + 3, 5, 1, PELE_B_E)      # queixo comprido e afilado

    # cabelo: dois gravetos de cada lado, curtos, saindo de baixo do chapeu.
    # Mais que isso vira arbusto e come o rosto, que e o que precisa ser visto.
    for (dx, comp) in ((-4, 5), (4, 5)):
        for k in range(comp):
            px(im, cx + dx + (1 if k > 2 else 0) * (1 if dx < 0 else -1),
               cy + k, ESPINHO if k % 3 else (58, 48, 60))

    if direcao == "cima":
        # de costas nao existe rosto: o cabelo desce e fecha a nuca
        for dx in range(-3, 4):
            for k in range(4 + (abs(dx) < 2)):
                px(im, cx + dx, cy - 1 + k, ESPINHO if (dx + k) % 3 else (58, 48, 60))
    else:
        frente = 0 if direcao == "baixo" else (-1 if direcao == "esquerda" else 1)
        # olhos fundos: um pixel escuro com uma sombra em cima, e o que da idade
        ox = -2 if direcao != "direita" else -1
        for lado in (0, 3):
            x = cx + ox + lado
            px(im, x, cy - 1, TINTA_2)
            px(im, x, cy, TINTA if not tonto else TINTA_2)
        # nariz adunco, saindo da silhueta
        if frente:
            for k in range(3):
                px(im, cx + frente * (2 + k // 2), cy + k, PELE_B_E)
        else:
            px(im, cx, cy, PELE_B_E); px(im, cx, cy + 1, PELE_B_E)
        if fala:
            ret(im, cx - 1, cy + 2, 3, 2, TINTA)
            px(im, cx, cy + 3, (168, 60, 72))     # a boca aberta, falando
        else:
            ret(im, cx - 1, cy + 2, 3, 1, PELE_B_E)

    # -------------------------------------------------------- o chapeu
    # Um cone alto e TORTO, que sai da cabeca como espinho. A aba e reta e
    # estreita de proposito: aba larga e redonda vira bruxa de festa junina.
    aba_y = cy - 4
    ret(im, cx - 5, aba_y, 11, 1, MANTO_E)
    ret(im, cx - 4, aba_y - 1, 9, 1, MANTO)
    alt = 7 if not tonto else 5
    for k in range(alt):
        # a ponta cai para um lado: o desvio cresce com a altura
        desvio = (k * k) // 9
        larg = max(1, 4 - (k * 4) // alt)
        x = cx - larg // 2 + desvio
        ret(im, x, aba_y - 2 - k, larg, 1, MANTO if k < alt - 3 else MANTO_C)
        px(im, x, aba_y - 2 - k, MANTO_E)
    # a fivela: um unico pixel de ouro, o so ponto quente do desenho inteiro
    px(im, cx - 1, aba_y - 2, OURO)

    contorno_seletivo(im, TINTA, TINTA_2)
    luz_de_cima(im, (MANTO, PELE_B), MANTO_C)
    sombra_chao(im, 4)
    return im


TIPOS = {"espinho": {}}
