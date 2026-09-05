# -*- coding: utf-8 -*-
"""Ferramentas comuns de desenho. Nada de personagem aqui, so o encanamento."""
import os
import sys
from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from paleta import *  # noqa

PW, PH = 16, 32
COLUNAS = ["parado", "passo-a", "passo-b", "respira", "conjura", "tonto",
           "ataque", "machucado", "esquiva", "fuga", "derrota"]

# Oito direcoes. As quatro primeiras sao as antigas e ficaram nas mesmas linhas
# de proposito, para nao invalidar nenhum indice que ja existia. As diagonais
# vieram depois porque andar na diagonal e o que a crianca mais faz com o
# direcional: sem elas o personagem anda de lado enquanto se move na diagonal,
# e o passo nao bate com o movimento.
LINHAS = [
    "baixo", "esquerda", "direita", "cima",
    "baixo-esquerda", "baixo-direita", "cima-esquerda", "cima-direita",
]


def normalizar(direcao):
    """Transforma uma das oito direcoes em (vista, giro).

    A vista e sempre uma das quatro de sempre: baixo, esquerda, direita, cima.
    O giro e -1, 0 ou 1, e diz para que lado a cabeca esta virada.

    Uma diagonal nao e uma vista nova: e a de frente ou a de costas com o rosto
    virado. Desenhar oito vistas independentes a 16 px daria oito desenhos
    parecidos e oito chances de um sair torto. Assim toda funcao de desenho
    continua conhecendo quatro vistas, e ganha as diagonais escrevendo pouco.

    Uso, na primeira linha de quem desenha:

        direcao, giro = normalizar(direcao)
    """
    if "-" not in direcao:
        return direcao, 0
    vertical, lado = direcao.split("-")
    return vertical, (-1 if lado == "esquerda" else 1)

B = (255, 255, 255)
BS = (196, 196, 196)
BL = (255, 255, 255)
VAZIO4 = (0, 0, 0, 0)


def nova(w=PW, h=PH):
    return Image.new("RGBA", (w, h), VAZIO4)


def px(im, x, y, cor):
    x, y = int(x), int(y)
    if 0 <= x < im.width and 0 <= y < im.height:
        im.putpixel((x, y), cor if len(cor) == 4 else tuple(cor) + (255,))


def ret(im, x, y, w, h, cor):
    for j in range(int(h)):
        for i in range(int(w)):
            px(im, x + i, y + j, cor)


def pontos(im, lista, cor):
    for (x, y) in lista:
        px(im, x, y, cor)


def elipse(im, cx, cy, rx, ry, cor):
    for j in range(int(cy - ry), int(cy + ry + 1)):
        for i in range(int(cx - rx), int(cx + rx + 1)):
            if ((i - cx) / max(rx, 0.01)) ** 2 + ((j - cy) / max(ry, 0.01)) ** 2 <= 1:
                px(im, i, j, cor)


def apagar(im, x, y):
    px(im, x, y, VAZIO4)


def contorno_seletivo(im, escuro=TINTA, medio=None):
    """1 px de contorno. Escuro embaixo e nas laterais, tom medio so em cima,
    onde a luz bate. E o selout, que evita o desenho ficar chapado."""
    base = im.copy()
    for j in range(im.height):
        for i in range(im.width):
            if base.getpixel((i, j))[3]:
                continue
            vizinhos = []
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                a, b = i + dx, j + dy
                if 0 <= a < im.width and 0 <= b < im.height and base.getpixel((a, b))[3] > 200:
                    vizinhos.append((dx, dy))
            if not vizinhos:
                continue
            so_por_cima = all(dy == 1 for (_, dy) in vizinhos)
            px(im, i, j, medio if (so_por_cima and medio) else escuro)
    return im


def luz_de_cima(im, familia, cor_luz):
    """Acende 1 px na borda de cima e na borda da esquerda da silhueta.

    Isto nao e enfeite, e o que salva o personagem de tom escuro. Num sprite de
    16 px o que separa o personagem do chao e a linha em volta dele; o contorno
    escuro resolve em fundo claro, e esta linha clara resolve em fundo escuro.
    Sem ela, a pele escura em cima da grama tem razao de contraste 1,1, ou seja,
    o personagem e o chao tem o mesmo peso para o olho.

    So mexe nos pixels de `familia`, entao bota e cabelo nao sao repintados."""
    base = im.copy()
    p = base.load()
    familia = {tuple(c[:3]) for c in familia}

    def opaco(x, y):
        return 0 <= x < im.width and 0 <= y < im.height and p[x, y][3] > 200

    for y in range(im.height):
        for x in range(im.width):
            if not opaco(x, y):
                continue
            if tuple(p[x, y][:3]) not in familia:
                continue
            if not opaco(x, y - 1) or not opaco(x - 1, y):
                px(im, x, y, cor_luz)
    return im


def sombra_chao(im, largura=6, base_y=None):
    base_y = base_y if base_y is not None else im.height - 2
    for i in range(8 - largura, 8 + largura):
        for j in (base_y, base_y + 1):
            if 0 <= j < im.height and im.getpixel((i, j))[3] == 0:
                borda = abs(i - 7.5) > largura - 1.5
                if not (borda and j == base_y):
                    px(im, i, j, (36, 30, 52, 70 if j == base_y else 45))
    return im


def deslocamento(coluna):
    """(passada da perna, sobe e desce do corpo, balanco do braco).

    Tres decisoes moram nestes numeros, e as tres valem para TODO bicho do jogo,
    porque heroi, NPC, goblin e aranha leem esta mesma tabela.

    1. A PASSADA E POSICAO, NAO COMPRIMENTO. Antes este primeiro numero era
       somado a ALTURA da perna: uma perna crescia 1 px e a outra encolhia. Isso
       nao e um passo, e uma perna esticando. Agora ele desloca a perna no eixo
       do movimento, e quem le decide em que eixo isso cai: de perfil e X puro,
       de frente sobra pouco porque a passada vai na direcao da camera.

    2. O SOBE E DESCE FICOU COMO ESTAVA, E ISSO E UMA DIVIDA. Anatomicamente o
       corpo deveria DESCER quando as pernas se abrem: o triangulo que elas
       formam fica mais largo e mais baixo. Tentamos, e nao da para fazer aqui.
       Este numero nao levanta o quadril: ele levanta o personagem INTEIRO, pe
       e tudo. Empurrar os quadros de passo para baixo afunda o pe no chao e
       joga a arma para fora do quadro nas racas mais baixas -- a geracao de
       arte reclama, com razao.

       Consertar de verdade exige separar a pose de PASSAGEM (pernas juntas no
       meio da passada, corpo no alto) da pose de PARAR, que hoje sao a mesma
       coluna `parado`. Isso e uma coluna nova na folha, nao um numero nesta
       tabela. Ate la, os -1 abaixo ficam.

    3. O BRACO VAI AO CONTRARIO DA PERNA. Repare que o terceiro numero tem o
       sinal trocado em relacao ao primeiro. E o que separa "andar" de "marchar
       como boneco de corda".
    """
    if coluna == "passo-a":
        return 2, -1, -1
    if coluna == "passo-b":
        return -2, -1, 1
    if coluna == "respira":
        return 0, 1, 0
    return 0, 0, 0


def folha(desenhar, **kw):
    im = Image.new("RGBA", (PW * len(COLUNAS), PH * len(LINHAS)), VAZIO4)
    for li, direcao in enumerate(LINHAS):
        for ci, coluna in enumerate(COLUNAS):
            im.paste(desenhar(direcao, coluna, **kw), (ci * PW, li * PH))
    return im


def folha_de(desenhar, largura, altura, **kw):
    """Como folha(), mas com quadro de outro tamanho.

    Nem toda criatura cabe em 16 x 32. A Serpente e comprida, o Cavaleiro e
    alto, Brasanegra e um dragao. Espremer os tres na grade do heroi daria tres
    desenhos ruins; a grade e do tamanho do bicho, e o jogo le o tamanho da
    ficha em vez de supor."""
    im = Image.new("RGBA", (largura * len(COLUNAS), altura * len(LINHAS)), VAZIO4)
    for li, direcao in enumerate(LINHAS):
        for ci, coluna in enumerate(COLUNAS):
            im.paste(desenhar(direcao, coluna, **kw), (ci * largura, li * altura))
    return im


def descer(folha_im, dy):
    """Desce o conteudo dy pixels DENTRO DE CADA QUADRO.

    Nao da para deslocar a folha inteira de uma vez: ela e uma grade de quadros
    de 32 px colados, e mover tudo junto empurra o pe de um quadro para dentro
    da cabeca do quadro de baixo. O erro nao aparece parado, so quando a
    animacao roda, e ai o personagem pisca com pedacos de outro quadro."""
    if dy == 0:
        return folha_im
    saida = Image.new("RGBA", folha_im.size, VAZIO4)
    for topo in range(0, folha_im.height, PH):
        quadro = folha_im.crop((0, topo, folha_im.width, topo + PH))
        recorte = Image.new("RGBA", quadro.size, VAZIO4)
        if dy > 0:
            recorte.alpha_composite(quadro.crop((0, 0, quadro.width, PH - dy)), (0, dy))
        else:
            recorte.alpha_composite(quadro.crop((0, -dy, quadro.width, PH)), (0, 0))
        saida.paste(recorte, (0, topo))
    return saida


def pintar(im, cor):
    """Aplica cor nas camadas que sao desenhadas em branco. Preserva o contorno."""
    saida = im.copy()
    p = saida.load()
    for y in range(saida.height):
        for x in range(saida.width):
            r, g, b, a = p[x, y]
            if not a or (r, g, b) in (TINTA, TINTA_2):
                continue
            k = r / 255
            p[x, y] = (int(cor[0] * k), int(cor[1] * k), int(cor[2] * k), a)
    return saida


def linha(im, x0, y0, x1, y1, cor, cor2=None, passo_cor=2):
    """Linha de Bresenham. Se cor2 for dada, alterna as duas cores a cada
    passo_cor pixels, que e como sai a meia listrada das aranhas."""
    x0, y0, x1, y1 = int(x0), int(y0), int(x1), int(y1)
    dx, dy = abs(x1 - x0), -abs(y1 - y0)
    sx = 1 if x0 < x1 else -1
    sy = 1 if y0 < y1 else -1
    erro = dx + dy
    k = 0
    while True:
        px(im, x0, y0, cor2 if (cor2 and (k // passo_cor) % 2) else cor)
        if x0 == x1 and y0 == y1:
            break
        e2 = 2 * erro
        if e2 >= dy:
            erro += dy
            x0 += sx
        if e2 <= dx:
            erro += dx
            y0 += sy
        k += 1
