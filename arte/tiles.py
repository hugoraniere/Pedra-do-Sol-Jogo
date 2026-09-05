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


def _mistura(a, b, t):
    return tuple(round(a[i] * (1 - t) + b[i] * t) for i in range(3))


# ------------------------------------------------------------------- grama
#: grama/grama2/grama3 nao sao mais o MESMO verde repetido: cada um e um
#: tom levemente diferente (a mesma cor puxada 20% para a luz ou para a
#: sombra ja existentes). Tile continua liso, sem UM PIXEL de ruido dentro
#: dele -- mas bordasDeGrama() ja escolhe entre os tres pela posicao
#: (x*7+y*13), entao o MAPA ganha uma mancha suave de tom sem que nenhum
#: tile individual pare de ser cor solida. Foi tentar "vida" com ruido
#: dentro do tile que virou estatica; a vida mora entre tiles, nao dentro
#: de um so.
_TONS_GRAMA = [GRAMA, _mistura(GRAMA, GRAMA_C, 0.2), _mistura(GRAMA, GRAMA_E, 0.2)]


def grama(v=0):
    """Lisa, mas nao mais a MESMA cor solida nos tres quadros -- ver
    _TONS_GRAMA acima. Ainda zero pixel de textura dentro do tile: quem
    varia e o tom entre tiles vizinhos, nao o interior de cada um.

    Chao e o que mais se repete na tela inteira, entao qualquer informacao
    aqui e multiplicada por centena de tiles. O detalhe (touceira, flor,
    capim alto) mora nos tiles SEPARADOS que ja existem pra isso --
    grama-alta, flores -- que o autor do mapa planta a mao, raro de
    proposito, em vez de nascerem escondidos dentro do "." comum."""
    im = nova()
    ret(im, 0, 0, T, T, _TONS_GRAMA[v % 3])
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


def grama_pequena():
    """Um brotinho, nao uma touceira: 3 laminas de 1-2 px, bem mais
    discreto que grama_alta(). E o tile que quebra o "." liso de vez em
    quando sem virar uma zona de capim de verdade."""
    im = grama(0)
    cx, cy = T // 2, T // 2 + 2
    px(im, cx, cy, GRAMA_E)
    px(im, cx - 1, cy - 1, GRAMA_C)
    px(im, cx + 1, cy - 1, GRAMA_C)
    px(im, cx, cy - 1, GRAMA_C)
    px(im, cx, cy - 2, GRAMA_C)
    return im


def grama_falha():
    """Grama gasta, areia aparecendo por baixo -- pisoteio, nao buraco.
    Mancha pequena e organica (nao circulo perfeito), sombra so no lado
    que a luz nao bate (embaixo-direita), luz de cima-esquerda igual
    todo o resto do jogo."""
    im = grama(0)
    cx, cy = T // 2, T // 2
    corpo = [(0, 0), (1, 0), (-1, 0), (2, 0), (0, -1), (1, -1), (-1, 1), (0, 1)]
    for dx, dy in corpo:
        px(im, cx + dx, cy + dy, AREIA)
    for dx, dy in [(1, 1), (2, 1), (0, 1)]:
        px(im, cx + dx, cy + dy, AREIA_E)
    px(im, cx - 1, cy - 1, AREIA_C)
    return im


def grama_orvalho():
    """Um brilho pontual, gota de orvalho pegando luz -- so 1 px bem claro
    em cima de uma laminazinha, pra nao virar pixel de erro solto no
    verde."""
    im = grama(0)
    cx, cy = T // 2, T // 2
    px(im, cx, cy, GRAMA_E)
    px(im, cx, cy - 1, GRAMA_C)
    px(im, cx, cy - 2, (232, 248, 224))
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


def terra():
    """100% lisa. So existe uma terra() na producao -- qualquer marca
    desenhada aqui e a MESMA marca repetida tile apos tile, o que le pior
    do que nenhuma marca nenhuma. Se um dia terra ganhar variedade de
    verdade, e um seixo-tile SEPARADO e raro, do jeito que grama-alta e
    separado de grama() -- nao mais textura dentro do tile comum."""
    im = nova()
    ret(im, 0, 0, T, T, TERRA)
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
    """100% lisa, mesma razao de grama()/terra()/areia(): o dither diagonal
    de antes (a cada ~3 pixels) e as 3 listras eram informacao demais pra
    um tile que se repete centenas de vezes na tela."""
    im = nova()
    ret(im, 0, 0, T, T, AGUA)
    return im


#: mesma ideia de _TONS_GRAMA: tres tons solidos, nao um so.
_TONS_AREIA = [AREIA, _mistura(AREIA, AREIA_C, 0.2), _mistura(AREIA, AREIA_E, 0.2)]


def areia(v=0):
    """Lisa, com o mesmo truque de tres tons entre tiles que grama() usa
    agora -- antes so existia UM tom, entao qualquer trecho grande de areia
    era literalmente a mesma cor solida, sem mancha nenhuma entre tiles."""
    im = nova()
    ret(im, 0, 0, T, T, _TONS_AREIA[v % 3])
    return im


def areia_pedra():
    """Uma pedrinha solta, o MESMO desenho de _seixo() que ja serve
    caminho() e pedra() -- reaproveitar a linguagem existente, nao inventar
    seixo novo so porque o chao embaixo mudou de cor."""
    im = areia()
    r = random.Random(61)
    _seixo(im, T // 2, T // 2, r, PEDRA_C, PEDRA_E)
    return im


def areia_mancha():
    """Um pedaco escuro, tipo areia molhada ou uma reentrancia -- mancha
    lisa, sem seixo, pra nao competir com areia_pedra()."""
    im = areia()
    cx, cy = T // 2, T // 2
    for dx, dy in [(0, 0), (1, 0), (-1, 0), (0, 1), (1, 1), (-1, -1), (0, -1)]:
        px(im, cx + dx, cy + dy, AREIA_E)
    return im


def areia_pegada():
    """Uma pegada pequena de bicho -- o sinal de que algo passou por ali,
    nao decoracao pura. Duas marcas ovais, tom unico."""
    im = areia()
    cx, cy = T // 2 - 2, T // 2
    for dx, dy in [(0, 0), (1, 0), (0, 1)]:
        px(im, cx + dx, cy + dy, AREIA_E)
    for dx, dy in [(3, 2), (4, 2), (3, 3)]:
        px(im, cx + dx, cy + dy, AREIA_E)
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


# ------------------------------------------- a Floresta dos Sussurros
# A mata usa uma familia de verde propria, mais escura e mais fria que a grama da
# vila. Trocar so o brilho nao bastava: a floresta ficava com cara de vila mal
# iluminada em vez de lugar diferente.


def mata():
    """Chao de mata fechada. Tile SOLIDO: e por cima dele que a arvore e plantada."""
    im = nova()
    ret(im, 0, 0, T, T, MATA)
    ruido(im, MATA_C, 20, 401)
    ruido(im, MATA_E, 30, 402)
    r = random.Random(403)
    for _ in range(4):
        x, y = r.randrange(1, T - 1), r.randrange(1, T - 2)
        px(im, x, y, MATA_E); px(im, x, y + 1, MATA_E)
    return im


def grama_mata():
    """Grama de clareira DENTRO da floresta. Mais fria e menos amarela que a
    grama da vila: sem ela, a clareira da floresta sai identica ao gramado da
    Vila Semente e o jogador nao sente que mudou de lugar."""
    im = nova()
    ret(im, 0, 0, T, T, MATA_C)
    ruido(im, (96, 158, 106), 24, 451)
    ruido(im, MATA, 22, 452)
    r = random.Random(453)
    for _ in range(3):
        x, y = r.randrange(1, T - 1), r.randrange(1, T - 2)
        px(im, x, y, (96, 158, 106)); px(im, x, y + 1, MATA)
    return im


def folhagem():
    """Chao de folha seca sobre a mata. E o tapete das clareiras."""
    im = mata()
    r = random.Random(411)
    for _ in range(14):
        x, y = r.randrange(T), r.randrange(T)
        cor = (FOLHAGEM, FOLHAGEM_C, FOLHAGEM_E)[(x + y) % 3]
        px(im, x, y, cor); px(im, x + 1, y, cor)
        px(im, x, y + 1, FOLHAGEM_E)
    return im


def trilha():
    """Trilha estreita, terra pisada. Mais escura que o caminho da vila de
    proposito: e picada de mata, nao rua."""
    im = nova()
    ret(im, 0, 0, T, T, (170, 134, 92))
    ruido(im, (192, 158, 114), 26, 421)
    ruido(im, (134, 102, 68), 24, 422)
    r = random.Random(423)
    for _ in range(3):
        x, y = r.randrange(1, T - 2), r.randrange(1, T - 2)
        px(im, x, y, MUSGO); px(im, x + 1, y + 1, MUSGO)
    return im


def agua_rasa():
    """O riacho no pe do barranco: da para ver a pedra no fundo."""
    im = nova()
    ret(im, 0, 0, T, T, AGUA_C)
    for j in range(T):
        for i in range(T):
            if (i * 5 + j * 3) % 13 < 3:
                px(im, i, j, AGUA)
    r = random.Random(431)
    for _ in range(5):
        x, y = r.randrange(1, T - 3), r.randrange(1, T - 3)
        ret(im, x, y, 3, 2, PEDRA)
        ret(im, x, y + 2, 3, 1, PEDRA_E)
    return im


def barranco():
    """A parede de pedra que corta a floresta em duas alturas. Tile SOLIDO."""
    im = nova()
    ret(im, 0, 0, T, T, BARRANCO)
    ret(im, 0, 0, T, 2, BARRANCO_C)
    r = random.Random(441)
    for _ in range(6):
        x, y = r.randrange(0, T - 4), r.randrange(3, T - 3)
        ret(im, x, y, 4, 2, BARRANCO_E)
    for _ in range(4):
        x = r.randrange(0, T - 2)
        px(im, x, 2, MUSGO); px(im, x + 1, 2, MUSGO_C)
    return im


# --------------------------------------------------------------- as beiras
# Onde a grama encosta em outro terreno, o corte de 16 px e reto e o mapa lê
# como tabuleiro de xadrez. A beira conserta isso por SOBREPOSICAO, nao por
# substituicao: e um tile quase todo transparente, com uma franja de grama
# desenhada so na borda que precisa, e o jogo o desenha numa segunda camada,
# por cima do chao que estiver embaixo. Por isso UMA familia de 8 beiras
# serve para grama-contra-caminho, grama-contra-terra, grama-contra-areia e
# grama-contra-agua: a beira nao sabe nem precisa saber o que tem debaixo.
#
# Sao 8 porque cobrem quatro lados soltos (a grama vem so de cima, so de
# baixo, so da esquerda, so da direita) e quatro cantos convexos (a grama
# vem de dois lados vizinhos, tipo cima+esquerda). Grama nos quatro lados ou
# em lados opostos e raro no formato como os mapas sao desenhados a mao, e
# quem monta a segunda camada (ver bordasDeGrama em src/dados/mapas.ts)
# escolhe a aproximacao mais proxima quando isso acontece.
_LADOS = ["n", "s", "l", "o"]


#: o perfil de UM LOBO REDONDO, do tamanho do tile inteiro (periodo 16).
#: A primeira versao subia 1 px por coluna ATE O TOPO -- e "nunca pular
#: mais de 1 px" garante que a escada seja lisa, mas uma RAMPA RETA de
#: passo 1 continua sendo um TRIANGULO, so que sem quina serrilhada. Bojo
#: redondo de verdade precisa da INCLINACAO MUDANDO: mais inclinado perto
#: da base, quase chato perto do topo -- e por isso a tabela vem de um
#: arco de circulo (sqrt(R^2 - d^2)), nao de uma rampa linear. Nos dois
#: pontos onde o arco pularia 2 px de uma vez (perto da base, onde o
#: circulo e mais vertical) o valor foi ajustado a mao em 1 px pra manter
#: a regra de nunca pular mais que 1 -- sem isso volta a ter quina.
#:
#: Existem DOIS perfis, nao um so: o grande (acima) e otimo numa lagoa ou
#: clareira, mas em cima de um caminho estreito de 1-2 tiles ele avanca
#: quase 1/4 da largura de cada lado e vira bolha, que foi exatamente o
#: defeito que apareceu na Vila. A escolha de qual usar e de
#: src/dados/mapas.ts, medindo a largura de verdade do chao ali -- e por
#: isso o resultado muda pelo mapa em vez de ser sempre igual: nao e
#: aleatorio, e a beira respondendo ao que esta desenhado.
_PERFIL_GRANDE = [4, 5, 6, 7, 7, 8, 8, 8, 8, 8, 8, 7, 7, 6, 5, 4]
_PERFIL_PEQUENO = [2, 3, 4, 4, 4, 3, 2, 2]


def _franja(k, semente, perfil):
    """Quanto a grama avanca para dentro, na coluna/linha k.

    Um lobo redondo por tile (o periodo do PERFIL fecha sem emenda quando
    o tile se repete, porque os dois perfis tem tamanho que divide T).
    Sobe e desce 1 px por coluna, sempre -- e o "nunca pular mais de 1 px"
    que faz ler como bojo redondo, nao ziguezague."""
    return perfil[(k + semente * 2) % len(perfil)]


def beira(lados, semente=0, perfil=_PERFIL_GRANDE):
    """Beira de grama de 16 x 16, transparente exceto nos LADOS pedidos.

    Cada lado sombreia a SI MESMO, nao um contorno unico compartilhado com
    o terreno vizinho: a ponta da franja sai em GRAMA_E (a propria grama
    mais escura), e so nos lados "s" e "l" -- onde o chao mais baixo fica
    na direcao para onde a sombra cai (baixo-direita, luz de cima-esquerda,
    igual toda sombra do jogo) -- 1 px semi-transparente escuro cai UM
    PASSO ALEM da grama. Semi-transparente porque esta camada e generica
    por cima de QUALQUER chao (terra, caminho, areia, agua): nao da pra
    pintar uma cor de sombra fixa sem saber o que tem embaixo, mas dá pra
    escurecer o que tiver la."""
    im = nova()
    SOMBRA_CHAO = (20, 30, 22, 90)
    for lado in lados:
        tem_sombra = lado in ("s", "l")
        for k in range(T):
            f = _franja(k, semente + _LADOS.index(lado), perfil)
            for d in range(f):
                if lado == "n":
                    x, y = k, d
                elif lado == "s":
                    x, y = k, T - 1 - d
                elif lado == "o":
                    x, y = d, k
                else:
                    x, y = T - 1 - d, k
                px(im, x, y, GRAMA_E if d == f - 1 else GRAMA)
            if tem_sombra:
                if lado == "n":
                    x, y = k, f
                elif lado == "s":
                    x, y = k, T - 1 - f
                elif lado == "o":
                    x, y = f, k
                else:
                    x, y = T - 1 - f, k
                px(im, x, y, SOMBRA_CHAO)
    return im


#: as 8 combinacoes desenhadas, na mesma ordem em que entram em TILES logo
#: abaixo -- a ordem aqui e o indice que src/dados/config.ts referencia
BEIRAS = [
    ("beira-n", ("n",)), ("beira-s", ("s",)),
    ("beira-l", ("l",)), ("beira-o", ("o",)),
    ("beira-no", ("n", "o")), ("beira-nl", ("n", "l")),
    ("beira-so", ("s", "o")), ("beira-sl", ("s", "l")),
]

#: as mesmas 8 combinacoes, com o lobo pequeno -- para quando
#: src/dados/mapas.ts mede o chao vizinho e acha estreito (ver _PERFIL_PEQUENO)
BEIRAS_FINA = [
    ("beira-n-fina", ("n",)), ("beira-s-fina", ("s",)),
    ("beira-l-fina", ("l",)), ("beira-o-fina", ("o",)),
    ("beira-no-fina", ("n", "o")), ("beira-nl-fina", ("n", "l")),
    ("beira-so-fina", ("s", "o")), ("beira-sl-fina", ("s", "l")),
]

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
    ("mata", mata()),
    ("folhagem", folhagem()),
    ("trilha", trilha()),
    ("agua-rasa", agua_rasa()),
    ("barranco", barranco()),
    ("grama-mata", grama_mata()),
    *[(nome, beira(lados, i)) for i, (nome, lados) in enumerate(BEIRAS)],
    ("grama-pequena", grama_pequena()),
    ("grama-falha", grama_falha()),
    ("grama-orvalho", grama_orvalho()),
    ("areia-pedra", areia_pedra()),
    ("areia-mancha", areia_mancha()),
    ("areia-pegada", areia_pegada()),
    ("areia2", areia(1)),
    ("areia3", areia(2)),
    *[(nome, beira(lados, i, perfil=_PERFIL_PEQUENO)) for i, (nome, lados) in enumerate(BEIRAS_FINA)],
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
