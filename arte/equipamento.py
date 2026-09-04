# -*- coding: utf-8 -*-
"""Armas, desenhadas SOZINHAS.

Antes cada arma era desenhada dentro de um quadro de 16 x 32 junto do corpo, com
as coordenadas da mao copiadas na mao. Duas coisas davam errado nisso. A arma
ficava presa a um tamanho de corpo, entao a mesma espada precisava ser
redesenhada para o anao e para o elfo. E qualquer mexida no braco deixava a arma
flutuando ao lado da mao, sem ninguem perceber ate olhar de perto.

Agora cada arma e um desenho proprio, do tamanho que ela precisa, com um PONTO
DE PEGA: o pixel dela que fica em cima da mao. O jogo pergunta a arte onde esta
a mao naquele quadro (ver pessoa.pontos_da_raca) e encosta a pega ali. A arma
passa a acompanhar o balanco do braco de graca, serve para qualquer corpo, e
desenhar uma arma nova nao exige saber nada de anatomia.

Cada arma diz tambem se ela deve ser espelhada quando o personagem olha para a
esquerda, e se fica ATRAS do corpo quando ele anda de costas.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from base import *  # noqa

TIPOS_ARMA = ["nenhuma", "cajado", "espada", "arco", "martelo", "funda"]

#: qual arma cada classe do RPG de mesa carrega
ARMA_DA_CLASSE = {
    "cavaleiro": "espada",
    "mago": "cajado",
    "cacador": "arco",
    "amigo": "funda",
    "ferreiro": "martelo",
}


def _tela(largura, altura):
    return Image.new("RGBA", (largura, altura), VAZIO4)


def cajado():
    """Cajado do Mago da Torre: cabo de madeira com cristal roxo na ponta.

    O tamanho nao e gosto, e conta. Na pose de conjurar a mao sobe ate a altura
    da cabeca, e no elfo, que e o mais alto, a cabeca comeca na linha 3 do
    quadro. Um cajado que suba mais de 11 px acima da mao perde a ponta pela
    borda de cima justamente no quadro em que ele importa."""
    im = _tela(3, 17)
    for y in range(3, 17):
        px(im, 1, y, MADEIRA if (y - 3) % 4 else MADEIRA_E)
    px(im, 0, 9, MADEIRA_E)                  # o nozinho do cabo
    px(im, 2, 9, MADEIRA_E)
    ret(im, 0, 0, 3, 3, ROXO)                # o cristal
    px(im, 1, 0, ROXO_C)
    px(im, 1, 1, ROXO_C)
    px(im, 0, 2, TINTA_2)
    px(im, 2, 2, TINTA_2)
    return contorno_seletivo(im, TINTA), (1, 11)


def espada():
    """Espada curta do Cavaleiro: lamina, guarda dourada e punho de couro."""
    im = _tela(3, 15)
    for y in range(1, 10):
        px(im, 1, y, PEDRA_C)
        px(im, 0, y, PEDRA)
    px(im, 1, 0, PAPEL)                      # o brilho da ponta
    ret(im, 0, 10, 3, 1, OURO)               # guarda
    px(im, 0, 11, OURO_E)
    px(im, 2, 11, OURO_E)
    ret(im, 1, 11, 1, 3, MADEIRA_E)          # punho
    px(im, 1, 14, OURO)                      # pomo
    return contorno_seletivo(im, TINTA), (1, 12)


def arco():
    """Arco do Cacador: braco curvo de madeira e corda esticada.

    Curto de proposito. O anao tem o braco mais baixo de todos, e um arco mais
    comprido que este passa do pe dele e sai pela borda de baixo do quadro."""
    im = _tela(5, 14)
    curva = [(2, 0), (3, 1), (3, 2), (4, 3), (4, 4), (4, 5), (4, 6), (4, 7), (4, 8),
             (4, 9), (3, 10), (3, 11), (2, 12)]
    for (x, y) in curva:
        px(im, x, y, MADEIRA)
    px(im, 2, 0, MADEIRA_E)
    px(im, 2, 12, MADEIRA_E)
    for y in range(1, 12):                   # a corda, reta de ponta a ponta
        px(im, 2, y, PAPEL_2)
    ret(im, 3, 5, 2, 4, MADEIRA_E)           # a empunhadura, no meio da barriga
    return contorno_seletivo(im, TINTA), (3, 8)


def martelo():
    """Martelo do Ferreiro Andarilho: cabeca de pedra e cabo grosso."""
    im = _tela(5, 16)
    ret(im, 0, 1, 5, 4, PEDRA)
    ret(im, 0, 1, 5, 1, PEDRA_C)
    ret(im, 0, 4, 5, 1, PEDRA_E)
    px(im, 0, 1, VAZIO4)
    px(im, 4, 1, VAZIO4)
    for y in range(5, 16):
        px(im, 2, y, MADEIRA if (y - 5) % 3 else MADEIRA_E)
    px(im, 2, 15, TERRA_E)
    return contorno_seletivo(im, TINTA), (2, 12)


def funda():
    """Funda do Amigo dos Bichos: cabinho de couro e a pedrinha na bolsa."""
    im = _tela(3, 10)
    for y in range(0, 6):
        px(im, 1, y, MADEIRA_E)
    px(im, 1, 6, TERRA)
    ret(im, 0, 7, 3, 2, TERRA_C)             # a bolsa
    px(im, 1, 8, TERRA_E)
    return contorno_seletivo(im, TINTA), (1, 4)


DESENHOS = {
    "cajado": cajado,
    "espada": espada,
    "arco": arco,
    "martelo": martelo,
    "funda": funda,
}

#: Como cada arma se comporta.
#:   espelha: vira ao contrario quando o personagem olha para a esquerda. So faz
#:            sentido em arma assimetrica: uma espada reta espelhada fica igual,
#:            mas um arco espelhado passa a apontar para o lado certo.
#:   atras:   fica ATRAS do corpo quando o personagem anda de costas, senao
#:            parece que ele carrega a arma na frente da barriga estando de costas
COMPORTAMENTO = {
    "cajado": dict(espelha=False, atras=True),
    "espada": dict(espelha=False, atras=True),
    "arco": dict(espelha=True, atras=True),
    "martelo": dict(espelha=True, atras=True),
    "funda": dict(espelha=True, atras=True),
}


def conferir(pontos_por_raca, largura_quadro=16, altura_quadro=32):
    """Toda arma cabe no quadro, em toda raca, em todo quadro?

    Isso nao e paranoia. O NPC e achatado numa folha so, entao o que passar da
    borda do quadro dele some, e some SO em algumas poses: a ponta do arco
    aparece parada e desaparece quando ele respira. E o tipo de defeito que
    ninguem acha olhando, porque nao esta errado o tempo todo. Aqui a conta e
    feita uma vez, na geracao, e quem estourar aparece com nome e sobrenome."""
    fora = []
    for nome, desenhar in DESENHOS.items():
        im, pega = desenhar()
        for raca, pontos in pontos_por_raca.items():
            for i, (mx, my) in enumerate(pontos["mao"]):
                esq, topo = mx - pega[0], my - pega[1]
                if esq < 0 or topo < 0 or esq + im.width > largura_quadro or topo + im.height > altura_quadro:
                    fora.append(f"{nome} em {raca}, quadro {i}")
    return fora


def gerar(saida, guardar):
    """Salva um PNG por arma e devolve a ficha que o jogo le."""
    ficha = {}
    for nome, desenhar in DESENHOS.items():
        im, pega = desenhar()
        guardar(f"arma-{nome}", im)
        ficha[nome] = {
            "largura": im.width,
            "altura": im.height,
            "pega": list(pega),
            **COMPORTAMENTO[nome],
        }
    return ficha
