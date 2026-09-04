# -*- coding: utf-8 -*-
"""Esboco do cenario novo: arvore por MOITAS, e tiles de transicao.

NAO e producao. Ver docs/estudo-de-cenario.md.

    python3 ferramentas/esbocar-cenario.py

A arvore de hoje (arte/mundo.py) e tres elipses preenchidas, com uma faixa de
sombra dentro de cada uma e uns pixels claros jogados por cima. Da um blob: uma
bola de brocolis num palito. Ela nao tem galho, nao tem aglomerado de folha, e
usa tres tons.

Aqui ela e construida como o Pixelblog 44 do Slynyrd ensina, e a diferenca nao e
"desenhar melhor", e de metodo:

  UMA MOITA, TRES VARIANTES. Desenha-se UM aglomerado de folha e dele saem tres
  versoes: media, escura e clara. A copa inteira e essas tres empilhadas segundo
  a direcao da luz. Nao ha copa desenhada: ha moitas arrumadas.

  A BORDA E RECORTADA, NAO REDONDA. Cada moita tem bossas de 1 e 2 px na borda.
  E o recorte que faz a silhueta ler como folhagem; borda de elipse le como
  bola, e e por isso que a copa de hoje parece cortada mesmo sem estar.

  O GALHO APARECE. Um pedaco de galho saindo da copa e o que liga o tronco a
  folhagem. Sem ele a copa flutua acima do palito, e o olho procura o corte.

  CINCO TONS, NAO TRES. Com tres, uma moita e clara ou escura. Com cinco ela
  tem volume, e volume e o que separa folhagem de mancha verde.
"""
import os
import sys

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(RAIZ, "arte"))
from base import *  # noqa

# ------------------------------------------------------------------ a rampa
# cinco tons a partir dos tres que ja existem em arte/paleta.py
F0 = (30, 72, 46)       # sombra profunda: so no vao entre moitas
F1 = FOLHA_E            # sombra
F2 = FOLHA              # base
F3 = FOLHA_C            # meio-tom claro
F4 = (156, 214, 136)    # luz, so na moita que o sol pega
CASCA = MADEIRA
CASCA_E = MADEIRA_E
CASCA_C = (168, 122, 78)

#: a luz vem de cima e da esquerda, como em todo o resto do jogo
LUZ_DX, LUZ_DY = -1, -1


def _moita(im, cx, cy, r, tom, borda=None):
    """Um aglomerado de folha: circulo com bossas, sombra em crescente embaixo
    e a direita, e um brilho pequeno em cima e a esquerda.

    O `r` e o raio grosso; a bossa some e volta de 1 px conforme o angulo, e e
    isso que da o recorte. Circulo liso le como bola de bilhar."""
    borda = borda if borda is not None else F0
    escuro = {F2: F1, F3: F2, F4: F3, F1: F0}.get(tom, F1)
    claro = {F2: F3, F3: F4, F1: F2, F4: F4}.get(tom, F3)
    for j in range(int(cy - r - 2), int(cy + r + 3)):
        for i in range(int(cx - r - 2), int(cx + r + 3)):
            dx, dy = i - cx, j - cy
            d2 = dx * dx + dy * dy
            # a bossa: o raio varia 1 px com a posicao, de um jeito estavel
            bossa = 1 if ((i * 7 + j * 5) % 5 < 2) else 0
            rr = r + bossa
            if d2 > rr * rr:
                continue
            # O crescente de sombra e uma BORDA, nao um corte reto pelo meio.
            # Cortando por meio-plano as sombras de moitas vizinhas se alinham e
            # a copa inteira vira listra diagonal -- foi o primeiro erro deste
            # esboco. Como borda, cada moita fica fechada em si, e a linha
            # escura entre duas e o que faz a folhagem ter aglomerado.
            na_borda = d2 > (rr - 1.6) ** 2
            sombreado = (dx * -LUZ_DX + dy * -LUZ_DY) > -r * 0.25
            # O brilho tambem e uma FAIXA junto da borda, do lado da luz, e so
            # nas moitas de cima. Disco claro no meio da moita le como bolha ou
            # furo, nao como folha iluminada -- foi o segundo erro deste esboco.
            # E moita de tras nao recebe brilho nenhum: quem esta atras nao
            # compete com quem esta na frente.
            faixa_clara = (rr - 3.0) ** 2 < d2 <= (rr - 0.9) ** 2
            iluminado = (dx * LUZ_DX + dy * LUZ_DY) > r * 0.30
            if na_borda and sombreado:
                px(im, i, j, escuro)
            elif faixa_clara and iluminado and tom in (F3, F4):
                px(im, i, j, claro)
            else:
                px(im, i, j, tom)


def _tronco(im, cx, base, alt, larg):
    """Tronco com listra de casca, mais largo no centro, alargando em raiz."""
    for k in range(alt):
        y = base - k
        # afina para cima, alarga na raiz
        l = larg + (2 if k < 3 else 0) - (1 if k > alt - 4 else 0)
        ret(im, cx - l // 2, y, l, 1, CASCA)
        px(im, cx - l // 2, y, CASCA_E)
        px(im, cx + l // 2 - (1 if l % 2 == 0 else 0), y, CASCA_E)
        if k % 5 == 2:
            px(im, cx - 1, y, CASCA_E)      # a listra da casca
        if k % 7 == 3:
            px(im, cx + 1, y, CASCA_C)
    ret(im, cx - larg // 2 - 2, base - 1, larg + 4, 2, CASCA_E)   # a raiz


def arvore(variante=0, larg=56, alt=72):
    """A arvore por moitas. `variante` muda o arranjo sem mudar o metodo:
    e assim que sai variedade sem desenhar arvore nova."""
    im = nova(larg, alt)
    cx = larg // 2
    chao = alt - 5

    # sombra no chao, centrada sob a arvore
    for j in range(chao - 2, chao + 4):
        for i in range(cx - 15, cx + 16):
            dx, dy = (i - cx) / 15.0, (j - (chao + 1)) / 3.0
            if dx * dx + dy * dy <= 1:
                px(im, i, j, (36, 30, 52, 60))

    topo_tronco = chao - 22
    _tronco(im, cx, chao, 24, 9)

    # o galho: sai do tronco e entra na copa. E ele que liga as duas coisas
    for k in range(7):
        px(im, cx - 3 - k, topo_tronco - k + 1, CASCA_E)
        px(im, cx - 3 - k, topo_tronco - k + 2, CASCA)
    for k in range(5):
        px(im, cx + 3 + k, topo_tronco - k + 2, CASCA_E)

    # ---------------------------------------------------------------- a copa
    # as moitas de TRAS e ESCURAS primeiro; as claras por ultimo, em cima e a
    # esquerda, que e de onde vem a luz
    cy = topo_tronco - 12
    arranjos = [
        [(-14, 4, 9, F1), (14, 4, 9, F1), (0, 10, 10, F1),
         (-8, -4, 10, F2), (9, -3, 10, F2), (0, 3, 11, F2),
         (-3, -11, 9, F3), (7, -10, 7, F3), (-11, -6, 6, F3),
         (-5, -14, 5, F4)],
        [(-15, 2, 8, F1), (13, 6, 9, F1), (2, 11, 9, F1),
         (-6, -2, 11, F2), (10, -5, 9, F2), (0, 5, 10, F2),
         (-1, -12, 8, F3), (9, -11, 6, F3), (-12, -7, 7, F3),
         (-3, -15, 4, F4), (10, -14, 3, F4)],
        [(-13, 6, 8, F1), (15, 3, 8, F1), (-2, 12, 10, F1),
         (-9, -1, 10, F2), (8, -4, 11, F2), (1, 2, 10, F2),
         (-5, -12, 8, F3), (6, -12, 7, F3), (-13, -4, 6, F3),
         (-7, -15, 4, F4)],
    ]
    for (dx, dy, r, tom) in arranjos[variante % len(arranjos)]:
        _moita(im, cx + dx, cy + dy, r, tom)

    contorno_seletivo(im, TINTA, TINTA_2)
    return im


# --------------------------------------------------------- beira de grama
# O corte reto de 16 px onde a grama encontra o caminho e a maior fonte isolada
# do aspecto "tudo cortado" -- e ele nao custa resolucao nenhuma, custa
# desenhar as bordas. Sem tile de transicao um mapa e um tabuleiro de xadrez em
# qualquer resolucao.
#
# A tecnica aqui e de SOBREPOSICAO, nao de substituicao: a beira e um tile
# quase todo transparente, desenhado POR CIMA do chao. Assim uma unica familia
# de beiras de grama serve para grama-contra-caminho, grama-contra-terra,
# grama-contra-areia e grama-contra-agua, em vez de um conjunto por par de
# terrenos. Doze desenhos cobrem tudo em vez de doze VEZES o numero de pares.

def _franja(k, semente):
    """Quanto a grama avanca para dentro na coluna/linha k.

    A profundidade anda em TUFOS de tres colunas, nao coluna a coluna. Variando
    a cada coluna a borda vira um pente: dentes regulares de cara alternada, que
    e pior que o corte reto que estamos consertando. Grama de verdade avanca em
    moitas, e tres colunas e o menor tufo que le.

    A conta e estavel de proposito: a mesma posicao da sempre a mesma franja,
    senao a borda tremeria a cada `npm run arte`."""
    return 1 + ((k // 3) * 5 + semente * 3) % 4


def beira(lados, semente=0):
    """Beira de grama de 16 x 16 para os lados pedidos ('n','s','l','o').

    O tufo escuro na ponta nao e enfeite: e a sombra que a grama joga sobre o
    terreno mais baixo. Sem ela a franja parece papel recortado colado no chao."""
    im = nova(16, 16)
    for lado in lados:
        for k in range(16):
            f = _franja(k, semente + "nslo".index(lado))
            for d in range(f):
                if lado == "n":
                    x, y = k, d
                elif lado == "s":
                    x, y = k, 15 - d
                elif lado == "o":
                    x, y = d, k
                else:
                    x, y = 15 - d, k
                # a ponta da franja em sombra, o resto em grama
                px(im, x, y, GRAMA_E if d == f - 1 else GRAMA)
            # um tufo claro de vez em quando, para a franja nao ser lisa
            if (k + semente) % 5 == 0 and f > 3:
                if lado == "n":
                    px(im, k, f - 3, GRAMA_C)
                elif lado == "s":
                    px(im, k, 15 - f + 3, GRAMA_C)
                elif lado == "o":
                    px(im, f - 3, k, GRAMA_C)
                else:
                    px(im, 15 - f + 3, k, GRAMA_C)
    return im


BEIRAS = [
    ("n",), ("s",), ("l",), ("o",),                    # os quatro lados
    ("n", "o"), ("n", "l"), ("s", "o"), ("s", "l"),    # os quatro cantos
]


def mapa_teste(com_beira, zoom=5):
    """Um retalho de mapa: caminho cercado de grama, com e sem beira.
    E a unica forma honesta de julgar tile: um tile sozinho nunca mostra o
    problema, que so aparece quando ele encosta no vizinho."""
    from PIL import Image
    P = os.path.join(RAIZ, "public", "assets")
    tileset = Image.open(os.path.join(P, "tileset.png")).convert("RGBA")

    def tile(indice):
        c, l = indice % 8, indice // 8
        return tileset.crop((c * 16, l * 16, c * 16 + 16, l * 16 + 16))

    # G grama, C caminho
    desenho = [
        "GGGGGGGGGGGG",
        "GGGGGGGGGGGG",
        "GCCCCCCCCCCG",
        "GCCCCCCCCCCG",
        "GGGGGCCGGGGG",
        "GGGGGCCGGGGG",
        "GGGGGGGGGGGG",
    ]
    L, A = len(desenho[0]), len(desenho)
    fora = Image.new("RGBA", (L * 16, A * 16), (0, 0, 0, 255))
    for j, linha in enumerate(desenho):
        for i, c in enumerate(linha):
            base = tile(0 if c == "G" else 6)
            fora.alpha_composite(base, (i * 16, j * 16))

    if com_beira:
        def eh_grama(i, j):
            return 0 <= i < L and 0 <= j < A and desenho[j][i] == "G"
        for j, linha in enumerate(desenho):
            for i, c in enumerate(linha):
                if c == "G":
                    continue
                lados = []
                if eh_grama(i, j - 1): lados.append("n")
                if eh_grama(i, j + 1): lados.append("s")
                if eh_grama(i - 1, j): lados.append("o")
                if eh_grama(i + 1, j): lados.append("l")
                if lados:
                    fora.alpha_composite(beira(tuple(lados), i + j), (i * 16, j * 16))

    # duas arvores, para ver prop e chao juntos
    for (tx, ty, v) in ((1, 4, 0), (9, 5, 2)):
        a = arvore(v)
        fora.alpha_composite(a, (tx * 16 - a.width // 2 + 8, ty * 16 + 16 - a.height))
    return fora.resize((L * 16 * zoom, A * 16 * zoom), Image.NEAREST)


def folha_de_arvores(zoom=6):
    """A de hoje contra as tres variantes novas, no mesmo tamanho fisico."""
    from PIL import Image
    P = os.path.join(RAIZ, "public", "assets", "objetos") + os.sep
    hoje = Image.open(P + "arvore.png").convert("RGBA")
    novas = [arvore(v) for v in range(3)]
    alt = max([hoje.height] + [n.height for n in novas]) + 4
    larg = hoje.width + 6 + sum(n.width + 6 for n in novas)
    fora = Image.new("RGBA", (larg, alt), (66, 128, 78, 255))
    x = 0
    fora.alpha_composite(hoje, (x, alt - hoje.height - 2)); x += hoje.width + 6
    for n in novas:
        fora.alpha_composite(n, (x, alt - n.height - 2)); x += n.width + 6
    return fora.resize((larg * zoom, alt * zoom), Image.NEAREST)


if __name__ == "__main__":
    d = os.path.join(RAIZ, "..", "..", "reino-de-aurora-jogo", "docs", "referencia")
    d = d if os.path.isdir(d) else RAIZ
    for nome, im in (("estudo-de-cenario-arvore.png", folha_de_arvores()),
                     ("estudo-de-cenario-sem-beira.png", mapa_teste(False)),
                     ("estudo-de-cenario-com-beira.png", mapa_teste(True))):
        im.save(os.path.join(d, nome))
        print("escrito:", nome)
