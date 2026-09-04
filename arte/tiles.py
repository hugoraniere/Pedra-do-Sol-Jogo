# -*- coding: utf-8 -*-
"""Tiles de chao, 16x16. So chao: grama, terra, caminho, agua, pedra, caverna.
Casa, arvore, cerca e o resto sao objetos inteiros, em arte/mundo.py."""
import math
import os
import random
import sys
from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from paleta import *  # noqa

T = 16


def nova():
    return Image.new("RGBA", (T, T), (0, 0, 0, 0))


def px(im, x, y, cor):
    x, y = int(x) % T, int(y) % T
    im.putpixel((x, y), cor if len(cor) == 4 else cor + (255,))


def ret(im, x, y, w, h, cor):
    for j in range(int(h)):
        for i in range(int(w)):
            px(im, x + i, y + j, cor)


def ruido(im, cor, quantidade, semente):
    r = random.Random(semente)
    for _ in range(quantidade):
        px(im, r.randrange(T), r.randrange(T), cor)


def _ancoras(qtd, semente, distancia=5):
    """QTD pontos, cada um a pelo menos DISTANCIA do anterior (Poisson pobre).

    Grade com jitter foi a primeira tentativa e criou um problema pior que o
    ruido: como o tile se REPETE, uma grade fixa vira uma treliça visivel
    assim que dois tiles ficam lado a lado -- o olho encontra o padrao
    exatamente porque ele e regular demais. Sorteio com rejeicao (tenta uma
    posicao, descarta se ficou perto demais de outra ja colocada) da
    espacamento sem virar grade, porque a distancia minima e a UNICA regra:
    nada alinha em linha ou coluna."""
    r = random.Random(semente)
    pontos = []
    tentativas = 0
    while len(pontos) < qtd and tentativas < qtd * 40:
        tentativas += 1
        cx, cy = r.uniform(0, T), r.uniform(0, T)
        # a distancia tambem "enrola" pelas bordas, senao dois pontos perto
        # de lados opostos parecem longe mas colam quando o tile repete
        perto = any(
            min(abs(cx - px_), T - abs(cx - px_)) ** 2
            + min(abs(cy - py_), T - abs(cy - py_)) ** 2 < distancia ** 2
            for px_, py_, _ in pontos
        )
        if not perto:
            pontos.append((cx, cy, r))
    return pontos


# ------------------------------------------------------------------- grama
def _tufo_grama(im, x, y, r):
    """Uma touceira: sombra no pe, 2 a 3 laminas inclinadas para o mesmo lado.
    O pe em sombra e o que ancora a touceira no chao; sem ele ela flutua."""
    lado = 1 if r.random() < 0.5 else -1
    px(im, x, y, GRAMA_E)
    px(im, x + lado, y - 1, GRAMA_C)
    if r.random() < 0.7:
        px(im, x + lado * 2, y - 2, GRAMA_C)
    px(im, x - lado, y, GRAMA_C)


def grama(v=0):
    im = nova()
    ret(im, 0, 0, T, T, GRAMA)
    # 5 touceiras soltas -- ESPACO NEGATIVO entre elas e o que separa "textura
    # rica" de "borrao". Cada variante planta em posicoes diferentes.
    for (x, y, r) in _ancoras(4, 100 + v * 37, distancia=4.5):
        _tufo_grama(im, x, y, r)
    return im


def grama_alta():
    """Nao e grama() com mais ruido: e uma segunda camada de laminas MAIS
    ALTAS, num numero menor de tufos, para ler como capim entre a grama baixa."""
    im = grama(0)
    for (x, y, r) in _ancoras(2, 777, distancia=6):
        for k in range(4):
            px(im, x + (1 if k > 1 else 0), y - k, FOLHA if k < 3 else FOLHA_C)
        px(im, x - 1, y, FOLHA_E)
    return im


def flores():
    im = grama(1)
    r = random.Random(9)
    for cor in (VERMELHO, OURO, ROSA, ROXO_C):
        x, y = r.randrange(2, T - 3), r.randrange(2, T - 3)
        px(im, x, y, cor); px(im, x + 1, y, cor)
        px(im, x, y + 1, cor); px(im, x + 1, y + 1, cor)
        px(im, x, y + 2, GRAMA_E)
        px(im, x, y, tuple(min(255, c + 40) for c in cor))
    return im


# -------------------------------------------------------------------- terra
def _seixo(im, x, y, r, cor_clara, cor_escura):
    """Uma pedrinha: um L de 3 px com luz de um lado e sombra do outro.
    Quadrado perfeito le como pixel de erro; o L le como seixo.

    O L gira em uma de quatro posicoes. Sem o giro, todo seixo do tile e o
    MESMO desenho, so movido de lugar -- e um carimbo repetido parece
    fileira de sinais identicos, nao pedrinhas soltas."""
    giro = r.randrange(4)
    pontas = [((1, 0), (0, 1)), ((-1, 0), (0, 1)),
              ((1, 0), (0, -1)), ((-1, 0), (0, -1))][giro]
    px(im, x, y, cor_clara)
    px(im, x + pontas[0][0], y + pontas[0][1], cor_clara)
    px(im, x + pontas[1][0], y + pontas[1][1], cor_escura)


def _rachadura(im, x, y, cor, comprimento, r):
    """Uma linha organica curta: anda, e a cada passo pode desviar 1 px.
    E o que da a terra um VEIO em vez de estatica."""
    for _ in range(comprimento):
        px(im, x, y, cor)
        x += r.choice([-1, 0, 0, 1])
        y += r.choice([0, 1])


def terra():
    im = nova()
    ret(im, 0, 0, T, T, TERRA)
    for (x, y, r) in _ancoras(3, 11, distancia=5):
        _seixo(im, x, y, r, TERRA_C, TERRA_E)
    r = random.Random(12)
    _rachadura(im, r.randrange(2, 6), r.randrange(2, 6), TERRA_E, 6, r)
    return im


def caminho():
    """Terra batida clara com pedrinha solta e uma mancha de desgaste."""
    im = nova()
    ret(im, 0, 0, T, T, (206, 176, 128))
    # uma mancha clara de chao pisado, maior e mais rara que uma pedrinha
    r = random.Random(20)
    mx, my = r.randrange(4, T - 4), r.randrange(4, T - 4)
    for dx in range(-2, 3):
        for dy in range(-1, 2):
            if abs(dx) + abs(dy) <= 2 and r.random() < 0.7:
                px(im, mx + dx, my + dy, (222, 196, 154))
    for (x, y, rr) in _ancoras(3, 21, distancia=5):
        _seixo(im, x, y, rr, PEDRA_C, PEDRA_E)
    return im


def agua(v=0):
    im = nova()
    ret(im, 0, 0, T, T, AGUA)
    for j in range(T):
        for i in range(T):
            if (i * 3 + j * 5 + v * 7) % 17 < 3:
                px(im, i, j, AGUA_E)
    r = random.Random(31 + v)
    for _ in range(3):
        x, y = r.randrange(T), r.randrange(T)
        px(im, x, y, AGUA_C); px(im, x + 1, y, AGUA_C); px(im, x + 2, y, AGUA_C)
    return im


def areia():
    """Ondulacao de vento: tracos curtos e horizontais, nao poeira solta."""
    im = nova()
    ret(im, 0, 0, T, T, (234, 214, 166))
    for (x, y, r) in _ancoras(3, 41, distancia=5):
        larg = 2 if r.random() < 0.6 else 3
        ret(im, x, y, larg, 1, (246, 232, 194))
        px(im, x, y + 1, (206, 182, 138))
    return im


# -------------------------------------------------------------------- pedra
def pedra():
    """Afloramento rochoso: 2-3 blocos angulares SOLTOS, com o tom base entre
    eles, nao um split que cobre o tile inteiro.

    A primeira tentativa dividia o tile inteiro em duas metades por uma linha
    que anda de cima a baixo. Cobrindo 100% da area, essa linha se repete a
    cada 16 px e vira zigue-zague continuo quando os tiles ficam lado a lado --
    pior que as faixas horizontais que isto substituiu. Blocos que NAO cobrem
    o tile inteiro, com o tom base como espaco negativo entre eles, e o mesmo
    principio que funcionou na grama: o vazio entre os elementos e o que
    impede o padrao de se fechar numa linha continua."""
    im = nova()
    ret(im, 0, 0, T, T, PEDRA)
    r = random.Random(51)

    def bloco(cx, cy, raio):
        # um poligono irregular: caminha em volta de cx,cy variando o raio,
        # como a bossa da copa da arvore
        ang = 0
        pontos = []
        while ang < 360:
            rr = raio + r.uniform(-1.4, 1.4)
            import math
            pontos.append((cx + rr * math.cos(math.radians(ang)),
                          cy + rr * math.sin(math.radians(ang))))
            ang += r.uniform(35, 55)
        minx, maxx = int(min(p[0] for p in pontos)), int(max(p[0] for p in pontos)) + 1
        miny, maxy = int(min(p[1] for p in pontos)), int(max(p[1] for p in pontos)) + 1
        n = len(pontos)
        for j in range(miny, maxy + 1):
            for i in range(minx, maxx + 1):
                dentro = False
                for k in range(n):
                    x0, y0 = pontos[k]
                    x1, y1 = pontos[(k + 1) % n]
                    if (y0 > j) != (y1 > j):
                        xi = x0 + (j - y0) / (y1 - y0) * (x1 - x0)
                        if xi > i:
                            dentro = not dentro
                if dentro:
                    dx, dy = i - cx, j - cy
                    tom = PEDRA_C if (dx * -1 + dy * -1) > raio * 0.15 else PEDRA_E
                    px(im, i, j, tom)

    for (cx, cy, rr) in _ancoras(2, 51, distancia=8):
        bloco(cx, cy, rr.uniform(3.2, 4.2))
    return im


def chao_caverna():
    im = nova()
    ret(im, 0, 0, T, T, (150, 158, 176))
    for (x, y, r) in _ancoras(3, 61, distancia=5):
        _seixo(im, x, y, r, (172, 180, 196), (120, 130, 152))
    return im


def parede_caverna():
    im = nova()
    ret(im, 0, 0, T, T, (98, 106, 130))
    ret(im, 0, 0, T, 3, (128, 136, 160))
    r = random.Random(71)
    for _ in range(6):
        x, y = r.randrange(1, T - 3), r.randrange(4, T - 3)
        ret(im, x, y, 3, 2, (70, 76, 100))
    return im


def madeira_chao():
    im = nova()
    ret(im, 0, 0, T, T, MADEIRA_C)
    for j in range(0, T, 5):
        ret(im, 0, j, T, 1, MADEIRA_E)
    ruido(im, MADEIRA, 18, 81)
    return im


TILES = [
    ("grama", grama(0)),
    ("grama2", grama(1)),
    ("grama3", grama(2)),
    ("grama-alta", grama_alta()),
    ("flores", flores()),
    ("terra", terra()),
    ("caminho", caminho()),
    ("areia", areia()),
    ("agua", agua(0)),
    ("agua2", agua(1)),
    ("pedra", pedra()),
    ("madeira-chao", madeira_chao()),
    ("chao-caverna", chao_caverna()),
    ("parede-caverna", parede_caverna()),
]


def gerar(saida, a_mao=None):
    cols = 8
    linhas = (len(TILES) + cols - 1) // cols
    folha = Image.new("RGBA", (cols * T, linhas * T), (0, 0, 0, 0))
    for i, (nome, im) in enumerate(TILES):
        usado = (a_mao("tile-" + nome) if a_mao else None) or im
        folha.paste(usado, ((i % cols) * T, (i // cols) * T))
    folha.save(os.path.join(saida, "tileset.png"))
    return {nome: i for i, (nome, _) in enumerate(TILES)}
