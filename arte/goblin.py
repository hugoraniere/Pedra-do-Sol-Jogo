# -*- coding: utf-8 -*-
"""Goblins.

O goblin anterior era um humano verde de capuz. Aqui ele vira outra coisa, e a
diferenca esta na ANATOMIA, nao na cor:

  . baixinho: ocupa so a metade de baixo do quadro
  . cabeca enorme, mais LARGA que alta, encaixada direto no tronco, sem pescoco
  . orelhas gigantes saindo de lado, caidas
  . nariz comprido saindo da silhueta, o traco que mais marca
  . boca larga de orelha a orelha com um dente so
  . postura curvada, cabeca jogada para a frente
  . braco comprido, passa do joelho
  . perna arqueada, pe grande e chato, sem bota

Quatro tipos, e eles nao sao so escala:
  magricela  alto e fino, orelha maior ainda, nariz enorme
  gorducho   baixo e redondo, barriga, orelha pequena
  moleque    pequenininho, cabeca gigante, olho enorme
  chefe      o Zonzo: maior, coroa de osso, barba rala, cara de chefe
"""
import os, sys
from base import *  # noqa

TIPOS = {
    "magricela": dict(corpo=6, cabeca=8, orelha=4, nariz=3, altura=0, barriga=0, perna=2),
    "gorducho":  dict(corpo=10, cabeca=8, orelha=3, nariz=2, altura=2, barriga=1, perna=3),
    "moleque":   dict(corpo=5, cabeca=9, orelha=3, nariz=2, altura=5, barriga=0, perna=2),
    "chefe":     dict(corpo=9, cabeca=9, orelha=3, nariz=3, altura=-2, barriga=1, perna=3),
}


def goblin(direcao, coluna, tipo="magricela"):
    im = nova()
    t = TIPOS[tipo]
    perna_bal, sobe, braco_bal = deslocamento(coluna)
    tonto = coluna == "tonto"
    conjura = coluna == "conjura"

    PES = 29
    pe_alt = 2
    perna_alt = 4 - (1 if tipo == "moleque" else 0)
    tronco_alt = 6 + t["barriga"]
    cab_alt = 9 if tipo != "moleque" else 10

    base = PES - t["altura"] + sobe
    perna_topo = base - pe_alt - perna_alt
    tronco_topo = perna_topo - tronco_alt
    cab_topo = tronco_topo - cab_alt + 1        # sem pescoco: cabeca encaixa no tronco
    if tonto:
        cab_topo += 1

    L = t["cabeca"]
    X = (16 - L) // 2
    # a cabeca vai um pouco para a frente, e o que da a postura curvada
    if direcao == "esquerda":
        X -= 1
    elif direcao == "direita":
        X += 1

    # ------------------------------------------------------------ pernas
    corpo_l = t["corpo"]
    corpo_x = (16 - corpo_l) // 2
    pe_l = t["perna"]
    # perna arqueada: sai mais aberta do que o tronco
    px_esq = corpo_x - 1
    px_dir = corpo_x + corpo_l - pe_l + 1
    for (x, bal) in ((px_esq, perna_bal), (px_dir, -perna_bal)):
        ret(im, x, perna_topo, pe_l, perna_alt + bal, GOBLIN)
        ret(im, x + pe_l - 1, perna_topo, 1, perna_alt + bal, GOBLIN_E)
        # pe grande e chato, sem bota
        y = perna_topo + perna_alt + bal
        largura = pe_l + 2
        bx = x - (2 if x < 8 else 0)
        ret(im, bx, y, largura, pe_alt, GOBLIN_E)
        ret(im, bx, y, largura, 1, GOBLIN)

    # ------------------------------------------------------------ tronco
    if t["barriga"]:
        elipse(im, 8, tronco_topo + tronco_alt // 2, corpo_l // 2 + 1, tronco_alt // 2 + 1, GOBLIN_E)
        elipse(im, 8, tronco_topo + tronco_alt - 1, corpo_l // 2, 2, GOBLIN)
        ret(im, corpo_x + 1, tronco_topo, 2, 2, GOBLIN)
    else:
        ret(im, corpo_x, tronco_topo, corpo_l, tronco_alt, GOBLIN_E)
        ret(im, corpo_x + 1, tronco_topo, 2, 3, GOBLIN)
        apagar(im, corpo_x, tronco_topo)
        apagar(im, corpo_x + corpo_l - 1, tronco_topo)

    # ------------------------------------------------------------ cabeca
    ret(im, X, cab_topo, L, cab_alt, GOBLIN)
    ret(im, X + 1, cab_topo, L - 2, 1, GOBLIN_C)
    ret(im, X, cab_topo + cab_alt - 2, L, 2, GOBLIN_E)
    ret(im, X + L - 1, cab_topo + 1, 1, cab_alt - 2, GOBLIN_E)
    for (dx, dy) in [(0, 0), (L - 1, 0)]:
        apagar(im, X + dx, cab_topo + dy)

    # ----------------------------------------------------------- orelhas
    # orelha grande em forma de folha, caida para tras. e a marca do goblin:
    # se voce so ve a silhueta, a orelha ja diz que nao e gente
    o = t["orelha"]
    oy = cab_topo + 1
    if direcao != "cima":
        for lado in (-1, 1):
            if direcao == "esquerda" and lado > 0:
                continue
            if direcao == "direita" and lado < 0:
                continue
            bx = X - 1 if lado < 0 else X + L
            for k in range(o):
                x = bx - k if lado < 0 else bx + k
                # sobe enquanto se afasta, e a ponta cai de volta
                topo_o = oy - k + (1 if k == o - 1 else 0)
                alt = max(2, 5 - k)
                ret(im, x, topo_o, 1, alt, GOBLIN_C)
                px(im, x, topo_o + alt - 1, GOBLIN_E)

    # ------------------------------------------------------------- rosto
    olho_y = cab_topo + 2
    if tonto:
        for bx in (X + 1, X + L - 3):
            pontos(im, [(bx, olho_y), (bx + 1, olho_y + 1), (bx, olho_y + 2), (bx + 1, olho_y)], TINTA)
    elif direcao != "cima":
        grande = tipo == "moleque"
        largura_olho = 3 if grande else 2
        alt_olho = 3 if grande else 2
        e1 = X + 1
        e2 = X + L - 1 - largura_olho
        for ex in (e1, e2):
            ret(im, ex, olho_y, largura_olho, alt_olho, BRANCO)
            ret(im, ex + (largura_olho - 1 if ex == e2 else 0), olho_y, 1, alt_olho, TINTA)
            px(im, ex + (0 if ex == e2 else largura_olho - 1), olho_y, PAPEL)
        if tipo == "chefe":
            # so o chefe tem sobrancelha, e o que da cara de mandao
            ret(im, e1, olho_y - 1, largura_olho, 1, GOBLIN_E)
            ret(im, e2, olho_y - 1, largura_olho, 1, GOBLIN_E)
        # nariz comprido e batatudo, o traco que mais marca o goblin
        n = t["nariz"]
        cx = X + L // 2
        nariz_y = olho_y + alt_olho
        if direcao == "baixo":
            for k in range(n):
                largura = 1 + (1 if k >= n - 2 else 0) + (1 if k == n - 1 else 0)
                ret(im, cx - largura // 2, nariz_y + k, largura, 1, GOBLIN_C)
            px(im, cx, nariz_y + n - 1, GOBLIN_E)
        else:
            frente = X - 1 if direcao == "esquerda" else X + L
            passo = -1 if direcao == "esquerda" else 1
            for k in range(n + 1):
                ret(im, frente + k * passo, nariz_y + k - 1, 1, 2, GOBLIN_C)
            px(im, frente + n * passo, nariz_y + n, GOBLIN_E)
        # boca larga de orelha a orelha, com dente de fora
        by = cab_topo + cab_alt - 2
        ret(im, X + 1, by, L - 2, 2, TINTA_2)
        ret(im, X + 2, by + 1, L - 4, 1, (120, 66, 74))
        px(im, X + 2, by, PAPEL); px(im, X + 3, by, PAPEL)
        if tipo != "moleque":
            px(im, X + L - 4, by, PAPEL)

    # ------------------------------------------------------- coroa/barba
    if tipo == "chefe" and direcao != "cima":
        for k in range(3):
            ret(im, X + 1 + k * ((L - 2) // 2), cab_topo - 2, 2, 2, PAPEL_2)
        ret(im, X, cab_topo - 1, L, 1, PAPEL_2)
        ret(im, X + 2, cab_topo + cab_alt - 1, L - 4, 2, (168, 190, 150))

    # ------------------------------------------------------------ bracos
    braco_alt = tronco_alt + 3            # braco comprido, passa do joelho
    for (lado, bal) in ((-1, braco_bal), (1, -braco_bal)):
        if conjura and lado > 0:
            ret(im, corpo_x + corpo_l, cab_topo + 1, 2, braco_alt - 2, GOBLIN)
            continue
        bx = corpo_x - 2 if lado < 0 else corpo_x + corpo_l
        if direcao == "esquerda" and lado > 0:
            continue
        if direcao == "direita" and lado < 0:
            continue
        ret(im, bx, tronco_topo + 1 + bal, 2, braco_alt, GOBLIN)
        ret(im, bx + 1, tronco_topo + 1 + bal, 1, braco_alt, GOBLIN_E)
        ret(im, bx, tronco_topo + 1 + bal + braco_alt - 1, 2, 1, GOBLIN_C)

    contorno_seletivo(im, TINTA, TINTA_2)
    sombra_chao(im, 5, base + 1)
    return im
