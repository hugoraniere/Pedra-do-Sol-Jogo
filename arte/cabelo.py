# -*- coding: utf-8 -*-
"""Cabelo e chapeu. Saem em branco e recebem cor por tint.

Desenhados uma vez so, no porte normal. A cabeca tem sempre 10 px de largura e
12 de altura em todas as racas, entao um unico conjunto de cortes e chapeus
serve para todo mundo: o jogo so desce a camada alguns pixels quando o
personagem e mais baixo. Ver pessoa.desloque."""
import os, sys
from base import *  # noqa
from pessoa import CABECA_ALT, CABECA_L, PORTE_BASE, esqueleto, _lados

ESTILOS = ["curto", "comprido", "cacheado", "rabo", "moicano", "coque", "chanel", "careca"]


def cabelo(direcao, coluna, estilo="curto"):
    direcao, giro = normalizar(direcao)
    im = nova()
    if estilo == "careca":
        return im
    _, sobe, _ = deslocamento(coluna)
    topo = esqueleto(PORTE_BASE)["cabeca_topo"] + sobe + (1 if coluna == "tonto" else 0)
    L = CABECA_L
    X = _lados(L)
    alt = CABECA_ALT
    perfil = direcao in ("esquerda", "direita")
    de_costas = direcao == "cima"
    nuca_x = X + L // 2 if direcao == "esquerda" else X - 1
    nuca_l = (L // 2) + 1

    if de_costas:
        # a nuca e arredondada, nao reta: cabelo quadrado por tras vira capacete
        ret(im, X, topo, L, alt - 4, B)
        ret(im, X + 1, topo + alt - 4, L - 2, 1, B)
        apagar(im, X, topo); apagar(im, X + L - 1, topo)
        ret(im, X + 1, topo, L - 2, 1, BL)
        # duas mechas claras e a risca no meio dao volume ao que seria um bloco
        ret(im, X + L // 2 - 1, topo + 2, 1, alt - 8, BS)
        pontos(im, [(X + 1, topo + 2), (X + 1, topo + 3),
                    (X + L - 2, topo + 2)], BL)
        if estilo in ("comprido", "rabo", "chanel"):
            ret(im, X, topo + alt - 4, L, 5 if estilo == "comprido" else 3, BS)
        if estilo == "coque":
            elipse(im, 8, topo - 2, 3, 2, B)
        return contorno_seletivo(im, TINTA, TINTA_2)

    # Franja com risca de lado. Franja reta de ponta a ponta deixa o cabelo com
    # cara de capacete, e como a franja fica logo acima do olho e ela que decide
    # se a cabeca parece uma pessoa ou um brinquedo de plastico.
    ret(im, X, topo, L, 3, B)
    apagar(im, X, topo); apagar(im, X + L - 1, topo)
    ret(im, X + 1, topo - 1, L - 2, 1, B)
    ret(im, X + 1, topo, L - 4, 1, BL)
    if estilo != "moicano":
        pontos(im, [(X + 2, topo + 3), (X + 3, topo + 3)], B)   # mecha caindo
        apagar(im, X + L - 2, topo + 2)                          # canto levantado

    if estilo == "curto":
        if perfil:
            ret(im, nuca_x, topo, nuca_l, 7, B)
            ret(im, nuca_x, topo + 5, nuca_l, 2, BS)
        else:
            ret(im, X, topo + 3, 1, 4, B)
            ret(im, X + L - 1, topo + 3, 1, 4, B)
            px(im, X + L - 1, topo + 6, BS)
    elif estilo == "comprido":
        if perfil:
            ret(im, nuca_x, topo, nuca_l, alt + 2, B)
            ret(im, nuca_x + (nuca_l - 2 if direcao == "esquerda" else 0), topo + 6, 2, alt - 4, BS)
        else:
            ret(im, X - 1, topo + 2, 2, alt + 1, B)
            ret(im, X + L - 1, topo + 2, 2, alt + 1, B)
            ret(im, X + L, topo + 7, 1, alt - 4, BS)
    elif estilo == "chanel":
        if perfil:
            ret(im, nuca_x, topo, nuca_l, 9, B)
            ret(im, nuca_x, topo + 7, nuca_l, 2, BS)
        else:
            ret(im, X - 1, topo + 2, 2, 7, B)
            ret(im, X + L - 1, topo + 2, 2, 7, B)
            ret(im, X + L, topo + 6, 1, 3, BS)
    elif estilo == "cacheado":
        if perfil:
            ret(im, nuca_x, topo, nuca_l, 8, B)
            for k in range(3):
                x = nuca_x + (nuca_l - 1 if direcao == "esquerda" else -1)
                ret(im, x, topo + 1 + k * 3, 2, 2, B)
            ret(im, nuca_x, topo + 6, nuca_l, 2, BS)
        else:
            for (x, y) in [(X - 1, topo + 2), (X - 1, topo + 5), (X + L - 1, topo + 2),
                           (X + L - 1, topo + 5), (X, topo - 2), (X + L - 2, topo - 2), (7, topo - 3)]:
                ret(im, x, y, 2, 2, B)
            ret(im, X, topo + 3, 1, 4, B)
            ret(im, X + L - 1, topo + 3, 1, 4, B)
    elif estilo == "rabo":
        lado_dir = direcao != "esquerda"
        x = X + L if lado_dir else X - 2
        if perfil:
            ret(im, nuca_x, topo, nuca_l, 6, B)
        else:
            ret(im, X, topo + 3, 1, 3, B)
            ret(im, X + L - 1, topo + 3, 1, 3, B)
        ret(im, x, topo + 2, 2, 9, B)
        ret(im, x + (1 if lado_dir else 0), topo + 6, 1, 5, BS)
    elif estilo == "coque":
        elipse(im, 8, topo - 3, 3, 2, B)
        if perfil:
            ret(im, nuca_x, topo, nuca_l, 6, B)
        else:
            ret(im, X, topo + 3, 1, 3, B)
            ret(im, X + L - 1, topo + 3, 1, 3, B)
    elif estilo == "moicano":
        ret(im, 6, topo - 4, 4, 5, B)
        ret(im, 7, topo - 5, 2, 2, B)
        if perfil:
            ret(im, nuca_x, topo, nuca_l, 4, BS)
        else:
            ret(im, X, topo + 3, 1, 2, BS)
            ret(im, X + L - 1, topo + 3, 1, 2, BS)

    return contorno_seletivo(im, TINTA, TINTA_2)


TIPOS_CHAPEU = ["nenhum", "pontudo", "palha", "capuz", "coroa", "boina", "elmo"]


def chapeu(direcao, coluna, tipo="pontudo"):
    """Chapeus.

    Tres regras decidem tudo aqui.

    Primeira: acima da cabeca so existem 4 px de ceu. Quem desenha uma copa de
    7 px perde a copa, porque ela sai pela borda de cima do quadro. Por isso o
    chapeu de mago e tombado para o lado em vez de reto para cima: tombado ele
    cabe, e de quebra fica mais simpatico.

    Segunda: o chapeu nunca desce abaixo de topo + 2, porque o olho comeca em
    topo + 5. Chapeu que cobre o olho apaga a expressao, e a expressao e o que
    faz o personagem parecer vivo. O elmo e a unica excecao, e mesmo ele deixa
    a fresta aberta.

    Terceira: a aba passa no maximo 1 px de cada lado da cabeca, fora o chapeu
    de palha, onde a aba larga E o desenho. Numa cabeca de 10 px, uma aba de 14
    vira um bloco com pernas."""
    direcao, giro = normalizar(direcao)
    im = nova()
    if tipo == "nenhum":
        return im
    _, sobe, _ = deslocamento(coluna)
    topo = esqueleto(PORTE_BASE)["cabeca_topo"] + sobe + (1 if coluna == "tonto" else 0)
    L = CABECA_L
    X = _lados(L)
    de_costas = direcao == "cima"
    # para que lado a ponta do chapeu tomba: acompanha para onde ele olha
    lado = -1 if direcao == "esquerda" else 1

    if tipo == "pontudo":
        # cone de verdade, uma linha por largura: 12, 8, 6, 4, 2. Duas linhas de
        # 8 empilhadas nao leem como cone, leem como caixa, e o chapeu de mago
        # so funciona se a ponta aparecer
        ret(im, X - 1, topo + 1, L + 2, 1, B)         # aba
        ret(im, X - 1, topo + 2, L + 2, 1, BS)
        for i, larg in enumerate([8, 6, 4]):
            # cada linha sobe e escorrega um pouco para o lado: e a copa tombada
            x0 = _lados(larg) + lado * (i + 1) // 2
            ret(im, x0, topo - i, larg, 1, B)
            px(im, x0, topo - i, BL)
            px(im, x0 + larg - 1, topo - i, BS)
        px(im, _lados(2) + lado * 2, topo - 3, B)     # a pontinha

    elif tipo == "palha":
        ret(im, X - 3, topo + 1, L + 6, 1, BS)        # aba larga, so 1 px
        ret(im, X - 2, topo, L + 4, 1, B)
        ret(im, X + 1, topo - 3, L - 2, 3, B)         # copa baixa
        ret(im, X + 2, topo - 3, 2, 1, BL)
        ret(im, X + L - 3, topo - 2, 1, 2, BS)

    elif tipo == "capuz":
        # o capuz e arredondado em cima e afunila embaixo. reto dos dois lados
        # ele vira uma caixa de papelao em volta da cabeca
        ret(im, X, topo - 2, L, 1, B)
        ret(im, X - 1, topo - 1, L + 2, 3, B)
        ret(im, X + 1, topo - 2, 3, 1, BL)
        ret(im, X + L, topo - 1, 1, 3, BS)
        if de_costas:
            ret(im, X - 1, topo + 2, L + 2, 5, B)     # o capuz inteiro nas costas
            ret(im, X, topo + 7, L, 1, B)
            ret(im, X + L - 2, topo + 2, 2, 5, BS)
        else:
            # as duas pontas caidas, emoldurando o rosto, afinando na ponta
            ret(im, X - 1, topo + 2, 2, 4, B)
            px(im, X, topo + 6, B)
            ret(im, X + L - 1, topo + 2, 2, 4, BS)
            px(im, X + L - 1, topo + 6, BS)

    elif tipo == "coroa":
        ret(im, X + 1, topo - 1, L - 2, 2, B)         # faixa
        for k in (0, 3, 6):                           # tres pontas
            ret(im, X + 1 + k, topo - 3, 1, 2, B)
        ret(im, X + 1, topo, L - 2, 1, BS)
        px(im, X + 4, topo - 4, BL)                   # a joia da ponta do meio

    elif tipo == "boina":
        ret(im, X - 1, topo - 1, L + 2, 2, B)
        ret(im, X, topo - 2, L - 2, 1, B)
        ret(im, X - 1, topo, L + 2, 1, BS)
        ret(im, X, topo - 2, 3, 1, BL)
        px(im, X + L - 1, topo - 3, B)                # o pompom do lado alto

    elif tipo == "elmo":
        # a fresta fica exatamente na linha dos olhos (topo + 5). um pixel fora
        # e o cavaleiro perde o olhar, e um personagem sem olhar nao tem cara
        ret(im, X - 1, topo - 1, L + 2, 8, B)
        ret(im, X, topo - 2, L, 1, B)
        ret(im, X + 1, topo - 1, 3, 2, BL)
        ret(im, X + L, topo - 1, 1, 8, BS)
        if not de_costas:
            ret(im, X, topo + 4, L, 3, VAZIO4)        # fresta dos olhos
            ret(im, X + 4, topo + 4, 2, 3, B)         # nasal no meio da fresta
        ret(im, X - 1, topo + 7, L + 2, 1, BS)
        ret(im, X + 4, topo - 3, 2, 2, B)             # crista

    return contorno_seletivo(im, TINTA, TINTA_2)
