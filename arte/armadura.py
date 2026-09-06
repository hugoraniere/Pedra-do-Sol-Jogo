# -*- coding: utf-8 -*-
"""Armadura, uma segunda peca encaixada por cima da roupa.

Mesma tecnica de arte/roupa.py — peca pequena, fora do quadro do corpo,
pendurada pelo ponto `tronco` (pessoa.pontos_da_raca) — mesma grade (4 vistas
x 3 balancos de passo, 16 x 20), so que com uma diferenca de proposito:

roupa nasce em BRANCO e recebe a cor que o jogador escolheu (e guarda-roupa,
personalizavel). Armadura nasce com a PROPRIA cor, fixa, sem tint — e um
achado do mundo (couro da vila, cinza de forja, teia lapidada...), nao uma
escolha de guarda-roupa. Mesmo espirito de arte/equipamento.py (armas: cor
propria, sem tint).

So uma armadura por vez equipada (o slot e um so), desenhada por cima da
roupa — um colete de couro sobre uma tunica, por exemplo. Revisao de
2026-09-05, primeiro pedaco do cano: so `colete-vila` nesta rodada, pra
provar arte -> encaixes.json -> heroi.ts -> jogo antes de desenhar as outras
4 (ver docs/plano-de-itens-e-equipamento.md e o plano do Hugo).
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from base import *  # noqa
from pessoa import CORPOS, TRONCO_ALT, _lados
from roupa import LARGURA_PECA, ALTURA_PECA, VISTAS, BALANCOS

#: id de Armadura (conteudo.ts) -> ainda so uma. As outras 4 entram depois
#: que esta provar o cano inteiro (arte -> encaixes.json -> heroi.ts -> jogo).
ARMADURAS = [
    "colete-vila",
]


def _nova_peca():
    return Image.new("RGBA", (LARGURA_PECA, ALTURA_PECA), VAZIO4)


def peca(vista, balanco, armadura, tipo="normal"):
    """Uma peca de armadura. y = 0 e a linha de cima do tronco, igual roupa."""
    im = _nova_peca()
    c = CORPOS[tipo]
    costas = vista == "costas"
    perfil = vista in ("esquerda", "direita")
    largura = c["tronco"] + (2 if c["barriga"] else 0) - (2 if perfil else 0)
    x = _lados(largura)
    alt = TRONCO_ALT + (0 if c["barriga"] else 1)

    if armadura == "colete-vila":
        # colete de couro simples, aberto na frente — mais estreito que o
        # tronco (1 px de cada lado), pra roupa por baixo aparecer na borda
        # e o colete ler como PECA A PARTE, nao como a propria roupa
        lc = largura - 2
        xc = x + 1
        ret(im, xc, 1, lc, alt - 2, COURO)
        ret(im, xc + lc - 1, 1, 1, alt - 2, COURO_E)
        ret(im, xc, 1, 1, alt - 2, COURO_C)
        if not costas:
            # abertura em V na frente — o colete nao fecha
            meio = xc + lc // 2
            for k in range(alt - 2):
                largura_v = max(0, 2 - k // 2)
                if largura_v:
                    ret(im, meio - largura_v // 2, 1 + k, largura_v, 1, VAZIO4)
            # duas fivelas pequenas fechando o que sobrou da abertura
            pontos(im, [(meio - 1, alt - 3), (meio - 1, alt - 4)], COURO_E)
        else:
            # de costas o colete fecha inteiro, so a costura central aparece
            ret(im, xc + lc // 2, 1, 1, alt - 2, COURO_E)
        # ombreira curta dos dois lados — o que da silhueta de "colete" e
        # nao "camisa", mesmo a distancia
        ret(im, xc, 0, 2 if not perfil else 1, 1, COURO)

    return contorno_seletivo(im, TINTA, TINTA_2)


def folha_de_armadura(armadura, tipo="normal"):
    """4 vistas por 3 posicoes de barra, mesma grade de roupa."""
    im = Image.new("RGBA", (LARGURA_PECA * len(VISTAS), ALTURA_PECA * len(BALANCOS)), VAZIO4)
    for linha, balanco in enumerate(BALANCOS):
        for coluna, vista in enumerate(VISTAS):
            im.paste(peca(vista, balanco, armadura, tipo),
                     (coluna * LARGURA_PECA, linha * ALTURA_PECA))
    return im
