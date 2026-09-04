# -*- coding: utf-8 -*-
"""O cursor do mouse, desenhado como pixel art do jogo.

Por que ele e desenhado aqui e nao e um cursor de CSS:

O canvas do jogo e ampliado por numero inteiro, 3x, 4x ou 5x, conforme a janela
(ver src/sistemas/visao.ts). Um cursor de CSS vive em pixels de tela, entao os
pixels dele teriam um quarto do tamanho dos pixels do jogo: ele pareceria ser de
outro programa boiando por cima. Acompanhar exigiria um PNG por escala, e cursor
grande e mal tratado no Safari. Desenhado aqui, ele vive na mesma grade de pixel
do resto e ainda ganha animacao e distintivo de graca.

A folha e uma so, em celulas de 16, igual a ui.png.

Contorno de 1 px em TODO quadro. Nao e enfeite: o cursor passa por cima de grama,
de painel de papel e de caverna, e o contorno e a unica coisa que faz ele se ler
nos tres. E a mesma falta que docs/13-analise-de-ui.md apontou nos 13 icones.

O ponto de pega de cada quadro sai daqui para public/assets/cursor.json, e o jogo
le de la. Nao copie nenhum destes numeros para dentro de um .ts: e a mesma regra
dos encaixes do heroi, e pela mesma razao. Um pixel a mais na cauda da seta e a
ponta ja saiu do lugar.
"""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from paleta import *  # noqa
from desenho import nova, px, contorno_alfa

U = 16  # celula, a mesma de ui.py

#: as letras dos desenhos abaixo. "." e buraco, e buraco de 1 px entre duas
#: formas vira linha de tinta na passada de contorno: e assim que dedo se separa
#: de dedo sem eu desenhar a separacao.
CORES = {
    "P": PAPEL,       # o corpo do cursor
    "O": OURO,        # o cursor inteiro, quando esta sobre algo
    "V": VERMELHO,    # o que impede
    "T": TINTA,       # tinta de dentro da forma, nao contorno
    "A": AGUA_C,      # a lente do olhar
    "M": PELE,        # a mao
    "L": PEDRA_C,     # a lamina
    "C": MADEIRA,     # o cabo
}


def pintar(grade, x0, y0, cel=U):
    """Desenha uma grade de letras numa celula, e contorna UMA vez so.

    Uma vez: contornar duas vezes desenha contorno em volta do contorno e
    engorda a silhueta em 2 px de escuro."""
    im = nova(cel, cel)
    for j, linha in enumerate(grade):
        for i, ch in enumerate(linha):
            if ch != ".":
                px(im, x0 + i, y0 + j, CORES[ch])
    return contorno_alfa(im, TINTA)


# --------------------------------------------------------------- a seta
# A diagonal cresce 1 px por linha ate a linha 7 e nao repete largura nenhuma.
# Repetir uma largura foi o primeiro erro desta folha: com duas linhas de mesmo
# tamanho o triangulo ganha fundo chato e a seta le como bandeira.
#
# A perna da esquerda afina ate 1 px de proposito. E o degrau que faz a seta
# parecer seta e nao triangulo com rabo.
SETA = [
    "P.......",
    "PP......",
    "PPP.....",
    "PPPP....",
    "PPPPP...",
    "PPPPPP..",
    "PPPPPPP.",
    "PPPPPPPP",
    "PPPP....",
    "PP.PP...",
    "P...PP..",
    ".....PP.",
]

#: onde a ponta encosta, dentro da celula. Tudo que e seta usa isto.
SETA_X, SETA_Y = 3, 1


def c_normal():
    return pintar(SETA, SETA_X, SETA_Y)


def c_sobre():
    """A seta INTEIRA fica de ouro.

    Acender so a ponta foi o segundo erro: quatro linhas douradas no topo de uma
    seta branca leem como um chapeu posto em cima dela, nao como a seta acesa.
    E ouro ja quer dizer "este e o escolhido" em todo o resto da interface, entao
    aqui ele nao inventa vocabulario novo.

    O "subir 1 px" do estado nao mora no desenho: quem levanta o cursor e a
    cena, senao o ponto de pega mentiria sobre onde o clique cai."""
    return pintar([l.replace("P", "O") for l in SETA], SETA_X, SETA_Y)


def c_clique():
    """A seta bate e encolhe: some a ponta da cauda e ela desce 1 px.

    Encolher a cauda muda a silhueta, e silhueta e a unica coisa que se percebe
    num quadro que dura 90 ms. Descer 1 px sem encolher, que era como estava, da
    dois desenhos identicos."""
    return pintar(SETA[:-2], SETA_X, SETA_Y + 1)


# ------------------------------------------------- as setas com distintivo
# Onde a precisao importa (pisar num tile, recusar um tile), a seta continua
# inteira e o significado entra como distintivo embaixo. Assim a ponta nao sai
# do lugar de um estado para o outro, e o clique cai onde o jogador ve.

BOTA = [
    ".PP..",
    ".PP..",
    ".PP..",
    ".PPP.",
    "PPPPP",
]

XIS = [
    "V...V",
    ".V.V.",
    "..V..",
    ".V.V.",
    "V...V",
]


def _seta_com(distintivo, dx, dy):
    """A seta mais um distintivo, com folga de 1 px entre os dois.

    A folga existe para o contorno passar entre as duas formas. Coladas, elas
    viram uma mancha so e o distintivo deixa de ser lido."""
    im = nova(U, U)
    for j, linha in enumerate(SETA):
        for i, ch in enumerate(linha):
            if ch != ".":
                px(im, SETA_X + i, SETA_Y + j, CORES[ch])
    for j, linha in enumerate(distintivo):
        for i, ch in enumerate(linha):
            if ch != ".":
                px(im, dx + i, dy + j, CORES[ch])
    return contorno_alfa(im, TINTA)


def c_andar():
    return _seta_com(BOTA, 10, 10)


def c_bloqueado():
    return _seta_com(XIS, 10, 10)


# ------------------------------------------------------ os cursores de simbolo
# Aqui o alvo e grande (uma pessoa, um bau), a precisao de 1 px nao importa, e o
# simbolo ocupa a celula. O ponto de pega passa a ser o meio.
#
# Nenhum destes desenha a propria borda: quem contorna e pintar(). Desenhar a
# borda aqui dentro E deixar o contorno rodar depois foi o terceiro erro desta
# folha, e o resultado era um balao com 2 px de escuro em volta.

BALAO = [
    ".PPPPPPPP.",
    "PPPPPPPPPP",
    "PPTPPTPPTP",
    "PPPPPPPPPP",
    "PPPPPPPPPP",
    ".PPPPPPPP.",
    ".PPP......",
    ".P........",
]

OLHO = [
    "..PPPPPP..",
    ".PPPPPPPP.",
    "PPPAAAAPPP",
    "PPPATTAPPP",
    "PPPAAAAPPP",
    ".PPPPPPPP.",
    "..PPPPPP..",
]

#: Dedo de 2 px com vao de 1 px. Dedo de 1 px, que era como estava, some
#: inteiro na passada de contorno e a mao vira bolota.
MAO_ABERTA = [
    ".MM.MM.MM.",
    ".MM.MM.MM.",
    "MMMMMMMMMM",
    "MMMMMMMMMM",
    "MMMMMMMMMM",
    ".MMMMMMMM.",
    "..MMMMMM..",
]

MAO_FECHADA = [
    "..MM.MM...",
    ".MMMMMMMM.",
    "MMMMMMMMMM",
    "MMMMMMMMMM",
    ".MMMMMMMM.",
    "..MMMMMM..",
]

ESPADA = [
    "......LL",
    ".....LLL",
    "....LLL.",
    "...LLL..",
    "..LLL...",
    ".CLL....",
    "CCC.....",
    "CC......",
]


def _simbolo(grade, cel=U):
    """Centra o simbolo na celula. Centrar pela conta, e nao na mao, e o que
    mantem o ponto de pega no meio quando o desenho muda de tamanho."""
    largura = max(len(l) for l in grade)
    x = (cel - largura) // 2
    y = (cel - len(grade)) // 2
    return pintar(grade, x, y, cel)


# ------------------------------------------------------------------- o anel
# Tres quadros de um anel que abre onde o dedo bateu. E o unico retorno de
# clique que existe no chao, onde nao ha botao para afundar.


def _anel(raio, espessura=1):
    im = nova(U, U)
    c = (U - 1) / 2
    for j in range(U):
        for i in range(U):
            d = ((i - c) ** 2 + (j - c) ** 2) ** 0.5
            if raio - espessura <= d <= raio:
                px(im, i, j, PAPEL)
    return contorno_alfa(im, TINTA)


#: A folha, na ordem em que o jogo le os quadros. Acrescente no FIM: o indice de
#: cada quadro e o que src/dados/cursor.ts guarda, e reordenar troca os cursores
#: uns pelos outros sem nenhum erro aparecer.
QUADROS = [
    ("normal",    c_normal(),                  (SETA_X, SETA_Y)),
    ("sobre",     c_sobre(),                   (SETA_X, SETA_Y)),
    ("clique",    c_clique(),                  (SETA_X, SETA_Y + 1)),
    ("andar",     c_andar(),                   (SETA_X, SETA_Y)),
    ("bloqueado", c_bloqueado(),               (SETA_X, SETA_Y)),
    ("falar",     _simbolo(BALAO),             (U // 2, U // 2)),
    ("olhar",     _simbolo(OLHO),              (U // 2, U // 2)),
    ("pegar",     _simbolo(MAO_ABERTA),        (U // 2, U // 2)),
    ("pegando",   _simbolo(MAO_FECHADA),       (U // 2, U // 2)),
    ("atacar",    _simbolo(ESPADA),            (U // 2, U // 2)),
    ("anel1",     _anel(3),                    (U // 2, U // 2)),
    ("anel2",     _anel(5),                    (U // 2, U // 2)),
    ("anel3",     _anel(7),                    (U // 2, U // 2)),
]


def gerar(saida):
    """Escreve cursor.png e cursor.json, e devolve o indice dos quadros."""
    folha = nova(U * len(QUADROS), U)
    for i, (_, im, _) in enumerate(QUADROS):
        folha.paste(im, (i * U, 0))
    folha.save(os.path.join(saida, "cursor.png"))

    ficha = {
        "celula": U,
        "quadros": {
            nome: {"quadro": i, "pega": {"x": pega[0], "y": pega[1]}}
            for i, (nome, _, pega) in enumerate(QUADROS)
        },
    }
    with open(os.path.join(saida, "cursor.json"), "w", encoding="utf-8") as f:
        json.dump(ficha, f, indent=2, ensure_ascii=False)

    return {nome: i for i, (nome, _, _) in enumerate(QUADROS)}
