# -*- coding: utf-8 -*-
"""Aranha da Teia Doce.

Do bestiario: 2 coracoes, fraqueza "comer a teia e escapar". Ela nao e inimiga de
verdade, e a teia dela e doce. Entao o desenho tem que ser FOFO, nao assustador:
corpo redondo e peludo, oito olhos grandes e brilhantes, sorrisinho, e meia listrada
dourada em cada perna.

Cabe na mesma folha 16 x 32 dos outros para nao mexer no codigo do jogo: a aranha
ocupa a parte de baixo do quadro, ancorada nos pes.

A animacao de caminhada mexe as pernas em dois grupos alternados, que e como aranha
anda de verdade: as pernas 1 e 3 de um lado sobem junto com as 2 e 4 do outro.
"""
import os, sys
from base import *  # noqa

ROXO_ARANHA = (150, 120, 210)
ROXO_ARANHA_E = (104, 78, 160)
ROXO_ARANHA_C = (192, 170, 236)

# O corpo e de proposito menor do que caberia. Num quadro de 16 px, se o corpo
# ocupa mais que a metade nao sobra espaco para a perna arquear, e sem o arco o
# bicho le como besouro, nao como aranha.
TIPOS = {
    "filhote":   dict(rx=2, ry=2, pernas=3, meia=OURO, corpo=ROXO_ARANHA_C, olhos=4),
    "pequena":   dict(rx=3, ry=3, pernas=3, meia=OURO, corpo=ROXO_ARANHA, olhos=6),
    "media":     dict(rx=4, ry=3, pernas=4, meia=OURO, corpo=ROXO_ARANHA, olhos=8),
    "matriarca": dict(rx=5, ry=4, pernas=4, meia=PAPEL_2, corpo=(120, 96, 178), olhos=8),
}

PES = 29


def _perna(im, ombro, joelho, pe, lado, cor, meia, fase):
    """Perna de aranha em dois trechos: sobe do ombro ate o joelho, que fica ACIMA
    do corpo, e desce dali ate o chao. E esse arco que faz o bicho parecer aranha.
    Sem ele, perna saindo reta para o lado le como besouro."""
    ox, oy = ombro
    jx, jy = joelho
    fx, fy = pe
    if fase:
        fy -= 2        # pe no ar, no meio do passo
        fx -= lado
    linha(im, ox, oy, jx, jy, cor)          # femur, liso
    linha(im, jx, jy, fx, fy, cor, meia, 2)  # canela, com a meia listrada
    px(im, jx, jy, cor)
    if not fase:
        px(im, fx, fy, cor)


def aranha(direcao, coluna, tipo="media"):
    direcao, giro = normalizar(direcao)
    im = nova()
    t = TIPOS[tipo]
    _, sobe, _ = deslocamento(coluna)
    tonto = coluna == "tonto"
    conjura = coluna == "conjura"
    # "encolhe as oito pernas antes do bote" (telegrafo do bestiario): as
    # pernas se recolhem para debaixo do corpo e ela agacha, pronta pra
    # saltar. E o mesmo quadro que fica em pe durante o avanco de verdade
    # (atacarComoCriatura em Combate.ts so move a POSICAO, nao troca de
    # quadro), entao "agachada" tem que ler tanto parada quanto em salto.
    ataca = coluna == "ataque"
    # pulo de lado, rapido -- o corpo INTEIRO desloca (pernas incluidas, elas
    # sao relativas a cx), nao so a cara. E o mesmo truque do goblin.
    esquiva = coluna == "esquiva"
    # pernas para cima e para dentro, feito inseto morto de barriga pra cima
    # -- e a leitura universal de "aranha vencida", sem precisar de sangue.
    derrota = coluna == "derrota"

    rx, ry = t["rx"], t["ry"]
    cor, escura, clara = t["corpo"], ROXO_ARANHA_E, ROXO_ARANHA_C
    cy = PES - ry - 2 + sobe + (2 if ataca else 0) + (3 if derrota else 0)
    cx = 8 + (4 if esquiva else 0)

    # ------------------------------------------------------------ pernas
    # dois grupos alternados: e assim que aranha anda
    grupo = 0
    if coluna == "passo-a":
        grupo = 1
    elif coluna == "passo-b":
        grupo = 2
    n = t["pernas"]
    recolhe = 2 if ataca else 0
    for lado in (-1, 1):
        for k in range(n):
            impar = (k + (0 if lado < 0 else 1)) % 2
            fase = 1 if (grupo == 1 and impar) or (grupo == 2 and not impar) else 0
            # as pernas da frente sao mais altas e mais curtas que as de tras
            ombro = (cx + lado * (rx - 1), cy - ry + 2 + k)
            if derrota:
                # curva para CIMA e para DENTRO em vez de descer ao chao
                joelho = (cx + lado * max(1, rx - 1), cy - ry - 1 - k // 2)
                pe = (cx + lado * max(1, rx - 3), cy - ry - 4 - k // 2)
            else:
                joelho = (cx + lado * max(1, rx + 1 + k // 2 - recolhe), cy - ry - 2 + k + (recolhe if ataca else 0))
                pe = (cx + lado * max(2, rx + 2 + (n - 1 - k) - recolhe * 2), PES - 1)
            _perna(im, ombro, joelho, pe, lado, escura, t["meia"], 0 if derrota else fase)

    # ------------------------------------------------------------- corpo
    elipse(im, cx, cy, rx, ry, cor)
    elipse(im, cx, cy - 1, rx - 1, ry - 1, clara)
    elipse(im, cx, cy, rx, ry, None) if False else None
    # pelinho: sombra embaixo e no lado direito
    for j in range(cy, cy + ry + 1):
        for i in range(cx - rx, cx + rx + 1):
            if im.getpixel((max(0, min(15, i)), max(0, min(31, j))))[3] and (
                ((i - cx) / rx) ** 2 + ((j - cy) / ry) ** 2 > 0.45
            ):
                px(im, i, j, escura)
    # tufinhos de pelo, so tres, senao parece coroa
    for k in (-2, 0, 2):
        px(im, cx + k, cy - ry - 1, cor)

    # ------------------------------------------------------------- rosto
    if direcao != "cima":
        oy = cy - ry + 2
        if derrota:
            # oito olhos fechados viram duas linhas so -- fechados, nao "x"
            # de tonto: ela nao esta zonza, desistiu.
            ret(im, cx - 4, oy + 1, 3, 1, TINTA)
            ret(im, cx + 1, oy + 1, 3, 1, TINTA)
        elif tonto:
            for ex in (cx - 3, cx + 1):
                pontos(im, [(ex, oy), (ex + 1, oy + 1), (ex, oy + 2), (ex + 1, oy)], TINTA)
        else:
            # fila de cima com os olhos grandes, fila de baixo com os pequenos
            grandes = [(cx - 3, oy), (cx + 1, oy)]
            if direcao == "esquerda":
                grandes = [(cx - 4, oy), (cx - 1, oy)]
            elif direcao == "direita":
                grandes = [(cx, oy), (cx + 3, oy)]
            for (ex, ey) in grandes:
                ret(im, ex, ey, 2, 2, BRANCO)
                px(im, ex + 1, ey + 1, TINTA)
                px(im, ex, ey, PAPEL)
            if t["olhos"] >= 6:
                pequenos = [(cx - 4, oy + 2), (cx - 1, oy + 3), (cx + 2, oy + 2), (cx + 3, oy + 3)]
                for (ex, ey) in pequenos[: t["olhos"] - 2]:
                    px(im, ex, ey, BRANCO)
            # sorrisinho
            by = cy + 1
            ret(im, cx - 1, by, 3, 1, TINTA_2)
            px(im, cx - 2, by - 1, TINTA_2)
            px(im, cx + 2, by - 1, TINTA_2)

    # ---------------------------------------------------------- teia doce
    if conjura:
        # solta um fio de teia dourado para cima
        for k in range(6):
            px(im, cx + (1 if k % 2 else 0), cy - ry - 2 - k, OURO)
        px(im, cx, cy - ry - 8, PAPEL_2)

    if tipo == "matriarca" and direcao != "cima":
        # coroa de teia, so para dizer quem manda no atalho
        for k in (-3, 0, 3):
            px(im, cx + k, cy - ry - 2, PAPEL_2)
            px(im, cx + k, cy - ry - 3, PAPEL_2)
        ret(im, cx - 4, cy - ry - 1, 9, 1, PAPEL_2)

    contorno_seletivo(im, TINTA, TINTA_2)
    sombra_chao(im, rx, PES + 1)
    return im
