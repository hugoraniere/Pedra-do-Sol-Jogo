# -*- coding: utf-8 -*-
"""Esboco da arte em 32 x 64, para decidir a resolucao.

NAO e producao. Ver docs/estudo-de-resolucao.md.

    python3 ferramentas/esbocar-resolucao.py

Desenha o mesmo goblin em duas resolucoes lado a lado: o de hoje (16 x 32,
ampliado 2x com vizinho mais proximo, para ficar do mesmo tamanho fisico) e um
proposto em 32 x 64. Nao e o mesmo desenho com o dobro de pixels: e outro
desenho, que so cabe com o dobro de pixels.

O que 32 x 64 compra, e que 16 x 32 nao tem espaco para ter:

  RAMPA DE 5 TONS em vez de 3. Com 3 tons um musculo nao cabe: ou a superficie
  e clara ou e escura. Com 5 da para ter luz, meio-tom, base, sombra e sombra
  profunda, e e isso que faz uma superficie parecer curva em vez de chapada.

  CONTORNO INTERNO. O contorno de hoje so existe na borda de fora. Aqui braco,
  perna e mandibula tem linha propria por dentro da silhueta, que e o que separa
  membro de membro sem depender de tom.

  OLHO COM ESTRUTURA. A 16 px o olho e um retangulo branco com um pixel escuro.
  A 32 px cabe esclera, iris, pupila e brilho, e e o olho que da intencao ao
  bicho: o goblin passa a estar olhando para alguma coisa.

  MAO COM DEDOS. Tres dedos e um polegar, com vao escuro entre eles. A 16 px a
  mao inteira tem 3 px de largura e nao ha dedo nenhum.
"""
import os
import sys

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(RAIZ, "arte"))
from base import *  # noqa

L, A = 32, 64
CHAO = 58

# ------------------------------------------------------------------ a rampa
# 5 tons, derivados dos 3 que ja existem em arte/paleta.py. E o degrau novo que
# a resolucao compra: com 3 tons uma superficie e clara ou escura, com 5 ela
# pode ser curva
G0 = (58, 100, 48)      # sombra profunda, so em vinco e vao
G1 = GOBLIN_E           # sombra
G2 = GOBLIN             # base
G3 = GOBLIN_C           # meio-tom claro
G4 = (214, 244, 184)    # luz, so na borda que o sol pega
ESCLERA = (240, 236, 206)
IRIS = (206, 130, 52)
IRIS_E = (150, 84, 34)
COURO = (124, 86, 54)
COURO_E = (86, 58, 38)
DENTE = (238, 234, 214)

#: largura de cada linha da cabeca, de cima para baixo, a partir de y=20.
#: Cunha: crane estreito, malar largo, queixo pontudo. E a cunha que diz
#: "isto nao e gente" antes de qualquer detalhe de rosto
CABECA = [8, 12, 15, 17, 18, 19, 20, 20, 20, 20, 20, 20,
          19, 18, 17, 15, 13, 11, 9, 7, 5, 4]
CAB_Y = 16
TRONCO_Y = 36
#: ombro largo afinando ate o quadril: o goblin e curvado, e a curva mora aqui
TRONCO = [14, 16, 18, 18, 18, 17, 16, 15, 14, 13, 12, 11, 11, 10]


def _lin(im, y, larg, cor):
    """Uma linha centrada de dada largura. Toda forma organica deste arquivo e
    uma pilha destas: o que faz a silhueta ser curva e cada linha ter largura
    diferente da de cima."""
    ret(im, (L - larg) // 2, y, larg, 1, cor)


def _chao(im):
    for i in range(10, 22):
        for j in (CHAO + 1, CHAO + 2):
            if im.getpixel((i, j))[3] == 0:
                borda = abs(i - 15.5) > 4.5
                if not (borda and j == CHAO + 1):
                    px(im, i, j, (36, 30, 52, 70 if j == CHAO + 1 else 45))


# --------------------------------------------------------------------- pecas
def _mao(im, x, y, virada):
    """Mao de 6 px com tres dedos e um polegar. O vao escuro entre os dedos e o
    que faz a mao ter dedos: sem ele e uma pa."""
    ret(im, x, y, 6, 3, G2)
    ret(im, x, y, 6, 1, G3)
    for k in range(3):                       # os tres dedos, com vao entre eles
        dx = x + 1 + k * 2
        ret(im, dx, y + 3, 1, 3 - (k == 2), G2)
        px(im, dx, y + 3 + (2 - (k == 2)), G1)
        px(im, dx + 1, y + 3, G0)            # o vao
        px(im, dx + 1, y + 4, G0)
    pol = x + 6 if virada > 0 else x - 1     # o polegar, do lado de fora
    ret(im, pol, y + 1, 1, 2, G2)
    px(im, pol, y + 3, G1)


def _braco(im, lado, bal):
    """Braco comprido, que passa do joelho. Ombro colado no tronco, cotovelo
    afastando. Sai um tom abaixo do tronco: e o TOM que separa membro de
    membro, e ele sobrevive em escala 2 quando detalhe nenhum sobrevive."""
    ombro_x = 6 if lado < 0 else 22
    cot_x = 3 if lado < 0 else 25
    y0 = TRONCO_Y + 2 + bal
    for k in range(7):                        # braco: do ombro ao cotovelo
        x = ombro_x + round((cot_x - ombro_x) * k / 6)
        ret(im, x, y0 + k, 4, 1, G1)
        ret(im, x + (3 if lado < 0 else 0), y0 + k, 1, 1, G0)   # contorno interno
    ret(im, ombro_x + (0 if lado < 0 else 1), y0, 3, 1, G2)     # a luz do deltoide
    for k in range(4):                        # antebraco, mais fino
        ret(im, cot_x + (1 if lado < 0 else 0), y0 + 7 + k, 3, 1, G1)
    ret(im, cot_x + (1 if lado < 0 else 0), y0 + 7, 3, 1, G0)   # o vinco do cotovelo
    _mao(im, cot_x - (1 if lado < 0 else 0), y0 + 11, lado)


def _perna(im, lado, desloc):
    quadril = 10 if lado < 0 else 17
    pe = quadril - 1 + desloc if lado < 0 else quadril + 1 + desloc
    for k in range(7):                        # perna arqueada: abre ate o pe
        x = quadril + round((pe - quadril) * k / 6)
        ret(im, x, 48 + k, 5, 1, G1)
        ret(im, x + 4, 48 + k, 1, 1, G0)
    ret(im, quadril + 1, 50, 2, 3, G2)        # a luz da coxa
    y = 55
    ret(im, pe - 1, y, 7, 4, G1)              # pe grande e chato, sem bota
    ret(im, pe - 1, y, 7, 1, G2)
    for k in range(3):                        # tres dedos, separados por vao
        px(im, pe + k * 2, y + 3, G0)


def _olho(im, x, y):
    """Esclera, iris, pupila e brilho. Sao quatro coisas em 6 x 5, e e por isso
    que este olho olha para alguma coisa e o de 16 px nao."""
    ret(im, x, y, 6, 5, ESCLERA)
    ret(im, x, y, 6, 1, (208, 200, 168))      # a palpebra faz sombra na esclera
    ret(im, x + 1, y + 1, 4, 4, IRIS)
    ret(im, x + 1, y + 3, 4, 1, IRIS_E)
    ret(im, x + 2, y + 2, 2, 2, TINTA)        # pupila
    px(im, x + 2, y + 1, (255, 255, 255))     # o brilho, sempre em cima e a esquerda
    ret(im, x, y, 1, 5, G0)                   # o canto do olho, fundo
    ret(im, x + 5, y, 1, 5, G0)


def _orelha(im, lado):
    """Orelha em folha, com dobra interna. Sobe enquanto se afasta e a ponta
    cai de volta: e a linha que mais diz goblin na silhueta."""
    for k in range(7):
        x = 5 - k if lado < 0 else 26 + k
        topo = 23 - k - (1 if k > 4 else 0)
        alt = max(3, 11 - k)
        ret(im, x, topo, 1, alt, G3)
        px(im, x, topo, G4)                   # a borda de cima pega luz
        px(im, x, topo + alt - 1, G1)
        if k < 4:
            px(im, x, topo + 3 + k // 2, G1)  # a dobra de dentro


def goblin32(fase="parado"):
    bal, desl_a, desl_b = {
        "parado":  (0, 0, 0),
        "passo-a": (1, 3, -3),
        "passo-b": (-1, -3, 3),
        "prepara": (-6, -2, 2),
    }[fase]
    im = nova(L, A)

    _perna(im, -1, desl_a)
    _perna(im, 1, desl_b)

    # ----------------------------------------------------------------- tronco
    for k, larg in enumerate(TRONCO):
        _lin(im, TRONCO_Y + k, larg, G2)
    for k, larg in enumerate(TRONCO):         # a lateral em sombra: o barril
        x = (L - larg) // 2
        px(im, x, TRONCO_Y + k, G1)
        px(im, x + larg - 1, TRONCO_Y + k, G1)
        px(im, x + larg - 2, TRONCO_Y + k, G1)
    ret(im, 11, TRONCO_Y + 1, 10, 2, G3)      # a clavicula
    ret(im, 12, TRONCO_Y + 3, 8, 1, G1)
    for k in (6, 9):                          # dois vincos de costela
        ret(im, 12, TRONCO_Y + k, 3, 1, G1)
        ret(im, 17, TRONCO_Y + k, 3, 1, G1)

    ret(im, 10, 46, 12, 5, COURO)             # a tanga de couro
    ret(im, 10, 46, 12, 1, (156, 112, 72))
    ret(im, 10, 50, 12, 1, COURO_E)
    for k in range(3):
        px(im, 12 + k * 4, 49, COURO_E)

    _braco(im, -1, bal)
    _braco(im, 1, -bal)

    # ----------------------------------------------------------------- cabeca
    for k, larg in enumerate(CABECA):
        _lin(im, CAB_Y + k, larg, G2)
    for k, larg in enumerate(CABECA):
        x = (L - larg) // 2
        px(im, x, CAB_Y + k, G1)
        px(im, x + larg - 1, CAB_Y + k, G1)
    _lin(im, CAB_Y, 8, G4)                    # a luz no alto do craneo
    _lin(im, CAB_Y + 1, 10, G3)
    _lin(im, CAB_Y + 2, 11, G3)

    _orelha(im, -1)
    _orelha(im, 1)

    # ------------------------------------------------------------------ rosto
    ret(im, 6, 21, 20, 2, G1)                 # a arcada da sobrancelha
    ret(im, 6, 21, 20, 1, G0)
    ret(im, 7, 23, 18, 1, G1)                 # e a sombra que ela joga no olho
    _olho(im, 7, 24)
    _olho(im, 19, 24)

    by = 32                                    # a boca larga, atras do nariz
    ret(im, 9, by, 14, 4, (86, 44, 52))
    ret(im, 10, by + 1, 12, 2, (52, 26, 34))
    ret(im, 9, by, 14, 1, G0)
    for dx in (10, 13, 18, 21):               # os dentes
        ret(im, dx, by, 2, 2, DENTE)
        px(im, dx, by + 2, (196, 190, 170))

    # o nariz: nasce entre os olhos, atravessa a boca, e a PONTA PASSA DO
    # QUEIXO. Este e o traco que o goblin de 16 px promete no docstring e nao
    # entrega, porque la ele nao tem para onde crescer
    for k, larg in enumerate([2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 5]):
        _lin(im, 28 + k, larg, G2)
        x = (L - larg) // 2
        px(im, x + larg - 1, 28 + k, G1)      # a aba direita, na sombra
    for k in range(8):
        px(im, 15, 29 + k, G3)                # o cavalete: UMA coluna de luz
    _lin(im, 39, 4, G1)                       # a base, na sombra
    px(im, 13, 38, G0)                        # as narinas
    px(im, 18, 38, G0)

    _lin(im, CAB_Y + 20, 5, G1)               # o queixo, sob o nariz
    _lin(im, CAB_Y + 21, 4, G1)

    contorno_seletivo(im, TINTA, TINTA_2)
    _chao(im)
    return im


def comparacao(zoom=6):
    from PIL import Image
    P = os.path.join(RAIZ, "public", "assets") + os.sep
    g = Image.open(P + "goblin-magricela.png").convert("RGBA")
    fases = ["parado", "passo-a", "passo-b", "prepara"]
    colunas = [0, 1, 2, 4]
    larg = (L + 4) * 4
    fora = Image.new("RGBA", (larg, A * 2 + 6), (90, 130, 70, 255))
    for i, c in enumerate(colunas):
        # o de hoje ampliado 2x, para os dois ficarem do mesmo TAMANHO FISICO.
        # E assim que a comparacao e honesta: nao e um maior que o outro, e o
        # mesmo tamanho na tela com quatro vezes mais pixels
        q = g.crop((c * 16, 0, c * 16 + 16, 32)).resize((L, A), Image.NEAREST)
        fora.alpha_composite(q, (i * (L + 4), 0))
    for i, f in enumerate(fases):
        fora.alpha_composite(goblin32(f), (i * (L + 4), A + 6))
    return fora.resize((larg * zoom, (A * 2 + 6) * zoom), Image.NEAREST)


if __name__ == "__main__":
    destino = os.path.join(RAIZ, "docs", "referencia", "estudo-de-resolucao-goblin.png")
    comparacao().save(destino)
    print("escrito: docs/referencia/estudo-de-resolucao-goblin.png")
