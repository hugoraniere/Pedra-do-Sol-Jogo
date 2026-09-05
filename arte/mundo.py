# -*- coding: utf-8 -*-
"""Objetos do mundo desenhados como pecas inteiras, nao como tiles soltos.

Foi essa a mudanca que tirou o jogo da cara de "quadradinho repetido": uma casa e
UMA imagem de 48x64 com telhado, porta, janela e chamine, nao seis tiles colados.
Arvore, poste do sino, barraca, cerca e poco seguem a mesma ideia.
"""
import os
import sys
from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from paleta import *  # noqa
from desenho import nova, px, ret, linha_h, linha_v, contorno_alfa, sombra
import floresta


# ------------------------------------------------------------------ casas
def telhado(im, x, y, w, h, base, claro, escuro):
    """Telhado de duas aguas com fileiras de telha."""
    for j in range(h):
        recuo = max(0, (h - 1 - j) // 2)
        largura = w - recuo * 2
        ret(im, x + recuo, y + j, largura, 1, base)
        if j % 3 == 0:
            ret(im, x + recuo, y + j, largura, 1, escuro)
        elif j % 3 == 1:
            for i in range(x + recuo + (j // 3) % 2, x + recuo + largura, 3):
                px(im, i, y + j, claro)
    # beiral
    ret(im, x - 1, y + h - 1, w + 2, 2, escuro)
    ret(im, x - 1, y + h - 1, w + 2, 1, claro)


def parede(im, x, y, w, h, base, claro, escuro):
    ret(im, x, y, w, h, base)
    for i in range(x, x + w, 4):
        linha_v(im, i, y, h, escuro)
    for i in range(x + 2, x + w, 4):
        linha_v(im, i, y, h, claro)
    ret(im, x, y + h - 2, w, 2, escuro)


def janela(im, x, y, w=8, h=7):
    ret(im, x, y, w, h, AGUA_E)
    ret(im, x, y, w, 2, AGUA)
    linha_v(im, x + w // 2, y, h, MADEIRA_C)
    linha_h(im, x, y + h // 2, w, MADEIRA_C)
    for i in range(w):
        px(im, x + i, y - 1, MADEIRA_E)
        px(im, x + i, y + h, MADEIRA_E)
    for j in range(h):
        px(im, x - 1, y + j, MADEIRA_E)
        px(im, x + w, y + j, MADEIRA_E)
    px(im, x + 1, y + 1, PAPEL)


def porta(im, x, y, w=10, h=14, cor=MADEIRA_E):
    ret(im, x, y, w, h, cor)
    for i in range(x + 1, x + w, 3):
        linha_v(im, i, y + 1, h - 1, MADEIRA)
    ret(im, x, y, w, 2, MADEIRA)
    px(im, x + w - 3, y + h // 2, OURO)
    px(im, x + w - 3, y + h // 2 + 1, OURO_E)
    for j in range(h):
        px(im, x - 1, y + j, TINTA)
        px(im, x + w, y + j, TINTA)
    for i in range(w):
        px(im, x + i, y - 1, TINTA)


def casa(w_tiles=3, h_px=64, cor_telha=(TELHA, TELHA_C, TELHA_E), com_chamine=True, cor_parede=None):
    w = w_tiles * 16
    im = nova(w, h_px)
    sombra(im, w / 2 - 1, 4, w / 2, h_px - 4)
    alt_telhado = 22
    topo = h_px - 4 - 34 - alt_telhado
    # cor_parede=None e a MESMA parede creme de sempre - so o Hospital (abaixo)
    # pede outra, pra parede tambem contar na hora de reconhecer o predio, nao
    # so o telhado.
    parede(im, 3, topo + alt_telhado, w - 6, 34, *(cor_parede or (CR_PAREDE, CR_PAREDE_C, CR_PAREDE_E)))
    porta(im, w // 2 - 5, topo + alt_telhado + 20)
    janela(im, 8, topo + alt_telhado + 6)
    if w >= 48:
        janela(im, w - 16, topo + alt_telhado + 6)
    telhado(im, 1, topo, w - 2, alt_telhado, *cor_telha)
    if com_chamine:
        ret(im, w - 16, topo - 8, 7, 12, PEDRA)
        ret(im, w - 16, topo - 8, 7, 2, PEDRA_C)
        for j in range(9):
            linha_h(im, w - 16, topo - 8 + j, 7, PEDRA if j % 2 else PEDRA_E)
        ret(im, w - 17, topo - 9, 9, 2, PEDRA_E)
    contorno_alfa(im)
    return im


CR_PAREDE = (232, 214, 178)
CR_PAREDE_C = (246, 234, 206)
CR_PAREDE_E = (196, 172, 134)


def casa_pequena():
    return casa(3, 60, (TELHA, TELHA_C, TELHA_E))


def casa_grande():
    return casa(4, 68, (TELHA, TELHA_C, TELHA_E))


def ferraria():
    im = casa(4, 68, (PEDRA, PEDRA_C, PEDRA_E), com_chamine=True)
    # bigorna do lado de fora
    ret(im, 6, im.height - 14, 12, 4, PEDRA_E)
    ret(im, 9, im.height - 10, 6, 4, PEDRA_E)
    ret(im, 5, im.height - 8, 14, 4, PEDRA)
    contorno_alfa(im)
    return im


def _ramo_ervas(im, x, y):
    """Maco de ervas secando, pendurado por um barbante. E o detalhe que marca
    uma casa como casa de curandeira sem precisar de porta nova nem cartaz:
    quem ja viu erva secando pendurada reconhece na hora."""
    px(im, x + 1, y, MADEIRA_E)
    linha_v(im, x + 1, y + 1, 3, TINTA_2)
    for (dx, dy, cor) in [
        (0, 4, FOLHA_E), (1, 4, FOLHA), (2, 4, FOLHA_E),
        (0, 5, FOLHA), (1, 5, FOLHA_C), (2, 5, FOLHA),
        (0, 6, FOLHA_E), (1, 6, FOLHA), (2, 6, FOLHA_E),
        (1, 7, FOLHA_E),
    ]:
        px(im, x + dx, y + dy, cor)
    px(im, x, y + 4, ROXO_C)
    px(im, x + 2, y + 6, ROSA)


def _vaso_erva(im, x, y):
    """Vasinho de erva no parapeito da janela."""
    ret(im, x, y, 5, 3, TERRA)
    ret(im, x, y, 5, 1, TERRA_C)
    ret(im, x, y + 2, 5, 1, TERRA_E)
    for (dx, dy, cor) in [(1, -2, FOLHA), (2, -3, FOLHA_C), (3, -2, FOLHA)]:
        px(im, x + dx, y + dy, cor)


def casa_vovo():
    """A Casa de Cura: casa da Vovo Aurora, com o detalhe de curandeira que a
    distingue das outras por fora. Ver docs/14-casa-de-cura.md -- o interior
    ainda nao existe, entao por enquanto a casa so PARECE o que e."""
    im = casa(4, 68, (ROXO, ROXO_C, (86, 60, 148)))
    w, h = im.width, im.height
    topo_parede = h - 4 - 34  # mesma conta de `casa()`, que nao devolve as posicoes
    _ramo_ervas(im, w // 2 + 7, topo_parede + 1)
    _vaso_erva(im, w - 16 + 1, topo_parede + 6 + 7 + 1)
    contorno_alfa(im)
    return im


def hospital():
    """Fase 13, docs/plano-de-implementacao.md - CLAUDE.md, "Divergencia
    deliberada": onde o heroi acorda depois de uma derrota. Parede branca (a
    unica casa da vila que nao e creme) e uma cruz vermelha na fachada, pra
    reconhecer de longe sem precisar de placa - a mesma logica de silhueta
    que ja separa magricela/gorducho/moleque a 16px."""
    im = casa(4, 68, (PEDRA, PEDRA_C, PEDRA_E), com_chamine=False,
              cor_parede=(PAPEL, PAPEL_2, PEDRA_C))
    # a cruz mora na unica tira de parede que a casa() generica deixa livre:
    # entre o pe das janelas e o topo da porta.
    cx = im.width // 2
    ret(im, cx - 1, 44, 3, 6, TELHA)
    ret(im, cx - 3, 46, 7, 2, TELHA)
    contorno_alfa(im)
    return im


# ---------------------------------------------------------------- arvores
# ------------------------------------------------------------------ arvores
# A arvore anterior era tres elipses preenchidas, com uma faixa de sombra dentro
# de cada uma e uns pixels claros por cima. Isso da um blob: uma bola de
# brocolis num palito, sem galho, sem aglomerado de folha, em tres tons.
#
# Aqui ela e construida por MOITAS, que e o metodo do Pixelblog 44 do Slynyrd:
# desenha-se UM aglomerado de folha, dele saem tres variantes de tom, e a copa
# e essas variantes empilhadas segundo a direcao da luz. Nao ha copa desenhada:
# ha moitas arrumadas. Quatro coisas mudam por causa disso, e nenhuma delas e
# "desenhar melhor":
#
#   BORDA RECORTADA. Cada moita tem bossa de 1 px. E o recorte que faz a
#   silhueta ler como folhagem; borda de elipse le como bola, e e por isso que
#   a copa antiga parecia cortada mesmo sem estar.
#
#   SOMBRA NA BORDA, NAO NO MEIO. O crescente escuro de cada moita segue a
#   BORDA dela. Cortando por meio-plano, as sombras de moitas vizinhas se
#   alinham e a copa inteira vira listra diagonal.
#
#   BRILHO SO NAS MOITAS DE CIMA, e tambem junto da borda. Disco claro no meio
#   le como bolha ou furo. Moita de tras nao recebe brilho: quem esta atras nao
#   compete com quem esta na frente.
#
#   CINCO TONS, NAO TRES. Com tres, uma moita e clara ou escura. Com cinco ela
#   tem volume, e volume e o que separa folhagem de mancha verde.

#: cinco tons de folha, a partir dos tres que ja existem na paleta
FOLHA_0 = (30, 72, 46)
FOLHA_4 = (156, 214, 136)
#: a luz vem de cima e da esquerda, como em todo o resto do jogo
_LUZ = (-1, -1)


def _moita(im, cx, cy, r, tom, rampa):
    """Um aglomerado de folha: disco com bossas, sombra na borda do lado escuro
    e brilho na borda do lado da luz."""
    f0, f1, f2, f3, f4 = rampa
    escuro = {f2: f1, f3: f2, f4: f3, f1: f0}.get(tom, f1)
    claro = {f2: f3, f3: f4, f1: f2, f4: f4}.get(tom, f3)
    lx, ly = _LUZ
    for j in range(int(cy - r - 2), int(cy + r + 3)):
        for i in range(int(cx - r - 2), int(cx + r + 3)):
            dx, dy = i - cx, j - cy
            d2 = dx * dx + dy * dy
            bossa = 1 if ((i * 7 + j * 5) % 5 < 2) else 0
            rr = r + bossa
            if d2 > rr * rr:
                continue
            na_borda = d2 > (rr - 1.6) ** 2
            sombreado = (dx * -lx + dy * -ly) > -r * 0.25
            faixa_clara = (rr - 3.0) ** 2 < d2 <= (rr - 0.9) ** 2
            iluminado = (dx * lx + dy * ly) > r * 0.30
            if na_borda and sombreado:
                px(im, i, j, escuro)
            elif faixa_clara and iluminado and tom in (f3, f4):
                px(im, i, j, claro)
            else:
                px(im, i, j, tom)


def _tronco_arvore(im, cx, base, alt, larg):
    """Tronco com listra de casca, afinando para cima e alargando em raiz."""
    for k in range(alt):
        y = base - k
        l = larg + (2 if k < 3 else 0) - (1 if k > alt - 4 else 0)
        ret(im, cx - l // 2, y, l, 1, MADEIRA)
        px(im, cx - l // 2, y, MADEIRA_E)
        px(im, cx + l // 2 - (1 if l % 2 == 0 else 0), y, MADEIRA_E)
        if k % 5 == 2:
            px(im, cx - 1, y, MADEIRA_E)
        if k % 7 == 3:
            px(im, cx + 1, y, MADEIRA_C)
    ret(im, cx - larg // 2 - 2, base - 1, larg + 4, 2, MADEIRA_E)


#: os arranjos de moita. Trocar de arranjo e o que da VARIEDADE sem desenhar
#: arvore nova: mesmo metodo, mesma rampa, floresta que nao se repete
_ARRANJOS = [
    [(-14, 4, 9, 1), (14, 4, 9, 1), (0, 10, 10, 1),
     (-8, -4, 10, 2), (9, -3, 10, 2), (0, 3, 11, 2),
     (-3, -11, 9, 3), (7, -10, 7, 3), (-11, -6, 6, 3), (-5, -14, 5, 4)],
    [(-15, 2, 8, 1), (13, 6, 9, 1), (2, 11, 9, 1),
     (-6, -2, 11, 2), (10, -5, 9, 2), (0, 5, 10, 2),
     (-1, -12, 8, 3), (9, -11, 6, 3), (-12, -7, 7, 3),
     (-3, -15, 4, 4), (10, -14, 3, 4)],
    [(-13, 6, 8, 1), (15, 3, 8, 1), (-2, 12, 10, 1),
     (-9, -1, 10, 2), (8, -4, 11, 2), (1, 2, 10, 2),
     (-5, -12, 8, 3), (6, -12, 7, 3), (-13, -4, 6, 3), (-7, -15, 4, 4)],
]


def arvore(variante=0, rampa=None, larg=56, alt=72):
    """Arvore de folha larga, por moitas."""
    rampa = rampa or (FOLHA_0, FOLHA_E, FOLHA, FOLHA_C, FOLHA_4)
    im = nova(larg, alt)
    cx = larg // 2
    chao = alt - 5
    for j in range(chao - 2, chao + 4):
        for i in range(cx - 15, cx + 16):
            dx, dy = (i - cx) / 15.0, (j - (chao + 1)) / 3.0
            if dx * dx + dy * dy <= 1:
                px(im, i, j, (36, 30, 52, 60))

    topo = chao - 22
    _tronco_arvore(im, cx, chao, 24, 9)
    # o galho ligando tronco e copa: sem ele a copa flutua acima do palito e o
    # olho procura o corte
    for k in range(7):
        px(im, cx - 3 - k, topo - k + 1, MADEIRA_E)
        px(im, cx - 3 - k, topo - k + 2, MADEIRA)
    for k in range(5):
        px(im, cx + 3 + k, topo - k + 2, MADEIRA_E)

    cy = topo - 12
    for (dx, dy, r, nivel) in _ARRANJOS[variante % len(_ARRANJOS)]:
        _moita(im, cx + dx, cy + dy, r, rampa[nivel], rampa)
    contorno_alfa(im)
    return im


def arvore_escura(variante=1):
    """A mesma arvore com a rampa puxada para o escuro. E o que faz uma mata
    ter fundo: as escuras vao atras, as claras na frente."""
    return arvore(variante, rampa=((22, 56, 38), (34, 78, 50), (52, 106, 66),
                                   (78, 146, 88), (116, 180, 110)))


def arbusto_obj():
    im = nova(20, 18)
    sombra(im, 8, 3, 10, 15)
    for (bx, by, rx, ry) in [(10, 9, 9, 6), (6, 11, 5, 4), (14, 11, 5, 4)]:
        for j in range(int(by - ry), int(by + ry + 1)):
            for i in range(int(bx - rx), int(bx + rx + 1)):
                if ((i - bx) / rx) ** 2 + ((j - by) / ry) ** 2 <= 1:
                    px(im, i, j, FOLHA)
    for i in range(3, 17):
        for j in range(11, 15):
            if im.getpixel((i, j))[3]:
                px(im, i, j, FOLHA_E)
    for (x, y) in [(7, 5), (12, 6), (9, 7)]:
        px(im, x, y, FOLHA_C)
    contorno_alfa(im)
    return im


# ------------------------------------------------------- moveis e cenario
def poste_sino(com_sino=False):
    im = nova(20, 46)
    sombra(im, 7, 3, 10, 43)
    ret(im, 8, 6, 4, 36, MADEIRA)
    linha_v(im, 8, 6, 36, MADEIRA_E)
    linha_v(im, 11, 6, 36, MADEIRA_C)
    ret(im, 5, 41, 10, 3, MADEIRA_E)
    # braco
    ret(im, 8, 6, 8, 3, MADEIRA)
    linha_h(im, 8, 6, 8, MADEIRA_C)
    if com_sino:
        ret(im, 12, 11, 6, 7, OURO)
        ret(im, 11, 17, 8, 2, OURO_E)
        ret(im, 10, 19, 10, 2, OURO)
        px(im, 14, 21, OURO_E); px(im, 15, 21, OURO_E)
        for j in range(11, 18):
            px(im, 12, j, OURO_E)
    else:
        # so a corda cortada balancando
        for j, x in enumerate([15, 15, 16, 16, 15]):
            px(im, x, 9 + j, TERRA_C)
            px(im, x, 9 + j, TERRA if j % 2 else TERRA_C)
    contorno_alfa(im)
    return im


def pedra_solta():
    """Placeholder: um monte pequeno de pedrinhas soltas. Existe so para
    OBJETOS ter uma fabrica caso arte/sprites/pedra-solta.png suma -- o
    desenho de producao vem de la (ver LEIA.md)."""
    im = nova(16, 12)
    sombra(im, 7, 3, 8, 11)
    for (x, y, w, h, cor) in [
        (3, 6, 5, 4, PEDRA), (7, 7, 5, 4, PEDRA_C), (2, 8, 4, 3, PEDRA_E),
    ]:
        ret(im, x, y, w, h, cor)
    return im


def poco():
    im = nova(28, 30)
    sombra(im, 12, 4, 14, 27)
    ret(im, 4, 14, 20, 12, PEDRA)
    for j in range(14, 26, 4):
        for i in range(4 + ((j // 4) % 2) * 3, 24, 6):
            ret(im, i, j, 5, 3, PEDRA_E)
    ret(im, 4, 12, 20, 3, PEDRA_C)
    ret(im, 8, 13, 12, 3, TINTA_2)
    ret(im, 5, 4, 2, 10, MADEIRA)
    ret(im, 21, 4, 2, 10, MADEIRA)
    ret(im, 3, 0, 22, 5, TELHA)
    ret(im, 3, 4, 22, 1, TELHA_E)
    contorno_alfa(im)
    return im


def barraca_feira():
    im = nova(44, 34)
    sombra(im, 20, 4, 22, 31)
    ret(im, 4, 16, 36, 12, MADEIRA)
    ret(im, 4, 16, 36, 2, MADEIRA_C)
    ret(im, 4, 26, 36, 4, MADEIRA_E)
    for i, cor in enumerate([VERMELHO, PAPEL, VERDE, PAPEL, OURO, PAPEL, AZUL, PAPEL]):
        ret(im, 2 + i * 5, 4, 5, 9, cor)
    ret(im, 2, 12, 40, 2, TINTA_2)
    ret(im, 2, 2, 40, 3, MADEIRA_E)
    for (x, cor) in [(9, VERMELHO), (15, OURO), (21, VERDE), (27, ROSA), (33, ROXO_C)]:
        ret(im, x, 19, 4, 4, cor)
        px(im, x + 1, 18, FOLHA_E)
    contorno_alfa(im)
    return im


def cerca(vertical=False):
    im = nova(16, 20) if not vertical else nova(16, 20)
    sombra(im, 7, 2, 8, 18)
    if vertical:
        ret(im, 6, 2, 4, 16, MADEIRA)
        linha_v(im, 6, 2, 16, MADEIRA_E)
        ret(im, 2, 6, 12, 2, MADEIRA_C)
        ret(im, 2, 12, 12, 2, MADEIRA_C)
    else:
        for x in (2, 10):
            ret(im, x, 4, 4, 14, MADEIRA)
            linha_v(im, x, 4, 14, MADEIRA_E)
        ret(im, 0, 7, 16, 2, MADEIRA_C)
        ret(im, 0, 13, 16, 2, MADEIRA_C)
    contorno_alfa(im)
    return im


def fogueira(variante=0):
    """4 quadros da mesma fogueira, so a chama muda (topo, altura, desvio) --
    o jogo passa os 4 num `anims.create()` pra chama tremeluzir de verdade em
    vez de ficar parada. A lenha embaixo nunca muda, so o fogo em cima dela."""
    topo, altura, desvio = [(2, 9, 0), (3, 8, -1), (1, 10, 1), (4, 7, 0)][variante % 4]
    im = nova(20, 18)
    sombra(im, 9, 3, 10, 15)
    ret(im, 3, 10, 14, 4, MADEIRA_E)
    ret(im, 5, 12, 10, 3, MADEIRA)
    for j in range(topo, 11):
        largura = max(1, altura - abs(j - (topo + (altura + 1) // 2)))
        ret(im, 10 + desvio - largura // 2, j, largura, 1, BRASA)
    for j in range(topo + 3, 11):
        largura = max(1, altura - 4 - abs(j - (topo + 6)))
        ret(im, 10 + desvio - largura // 2, j, largura, 1, OURO)
    for j in range(topo + 5, 11):
        px(im, 10 + desvio, j, PAPEL)
    contorno_alfa(im)
    return im


def bau():
    im = nova(20, 18)
    sombra(im, 9, 3, 10, 16)
    ret(im, 3, 7, 14, 9, MADEIRA)
    for i in range(4, 17, 4):
        linha_v(im, i, 7, 9, MADEIRA_E)
    ret(im, 3, 3, 14, 5, MADEIRA_C)
    ret(im, 3, 8, 14, 2, OURO_E)
    ret(im, 8, 8, 4, 5, OURO)
    px(im, 10, 10, TINTA)
    contorno_alfa(im)
    return im


def placa():
    im = nova(20, 22)
    sombra(im, 7, 2, 10, 20)
    ret(im, 9, 10, 3, 10, MADEIRA_E)
    ret(im, 2, 2, 16, 9, MADEIRA_C)
    ret(im, 2, 9, 16, 2, MADEIRA)
    for (x, y, w) in [(5, 5, 10), (5, 7, 7)]:
        ret(im, x, y, w, 1, MADEIRA_E)
    contorno_alfa(im)
    return im


def varal():
    im = nova(48, 26)
    sombra(im, 21, 2, 24, 24)
    for x in (3, 43):
        ret(im, x, 6, 3, 18, MADEIRA)
        linha_v(im, x, 6, 18, MADEIRA_E)
    ret(im, 3, 6, 42, 1, TINTA_2)
    roupas = [(9, AZUL), (18, VERDE), (27, OURO), (36, PEDRA)]
    for (x, cor) in roupas:
        ret(im, x, 7, 7, 10, cor)
        ret(im, x, 7, 7, 2, PAPEL if cor != PEDRA else PEDRA_C)
        px(im, x + 3, 6, TINTA)
    contorno_alfa(im)
    return im


def navio():
    """O navio que trouxe o heroi ate a Praia de Chegada. Encostado na agua,
    puro cenario -- ninguem interage com ele direto, so com o marinheiro do
    lado. Casco em cunha (largo no convés, estreito na quilha), mastro e vela
    unica, dobrada de lado (o navio esta atracado, nao navegando)."""
    im = nova(70, 70)
    sombra(im, 54, 6, 35, 68)
    # mastro
    ret(im, 33, 6, 3, 40, MADEIRA_E)
    # bandeirola no topo do mastro
    ret(im, 36, 5, 6, 2, VERMELHO)
    ret(im, 36, 7, 3, 2, VERMELHO)
    # vela, presa ao mastro, alargando pra baixo -- dobrada (atracado, sem vento)
    for j in range(30):
        y = 10 + j
        largura = 3 + (j * 22) // 30
        ret(im, 36, y, largura, 1, PAPEL)
        if j % 5 == 0:
            ret(im, 36, y, largura, 1, PAPEL_2)
    # casco: convés largo em cima, afunilando ate a quilha embaixo
    for j in range(20):
        y = 44 + j
        largura = max(14, 56 - j * 2)
        x = 35 - largura // 2
        ret(im, x, y, largura, 1, MADEIRA)
        if j % 3 == 1:
            ret(im, x, y, largura, 1, MADEIRA_C)
    ret(im, 7, 43, 56, 2, MADEIRA_C)
    # vigias ao longo do casco
    for x in (18, 30, 42, 54):
        px(im, x, 50, AGUA_E)
        px(im, x, 51, AGUA_E)
    contorno_alfa(im)
    return im


# --------------------------------------------------- a Casa de Cura, por dentro
# O comodo da Vovo Aurora. Ver docs/14-casa-de-cura.md: um comodo so, pequeno de
# proposito, sem cama pro heroi deitar (a fogueira continua o unico lugar que
# revive de verdade -- ver a decisao la no doc, "risco de verdade").
def cama():
    """A cama da Vovo, ou do paciente. Nunca do heroi."""
    im = nova(28, 20)
    sombra(im, 13, 3, 14, 18)
    ret(im, 2, 6, 24, 12, MADEIRA)
    ret(im, 2, 6, 24, 2, MADEIRA_C)
    ret(im, 2, 16, 24, 2, MADEIRA_E)
    ret(im, 4, 9, 20, 6, ROXO)
    ret(im, 4, 9, 20, 1, ROXO_C)
    ret(im, 5, 7, 7, 4, PAPEL)
    ret(im, 5, 7, 7, 1, BRANCO)
    contorno_alfa(im)
    return im


def prateleira_pocoes():
    """Montada na parede -- sem sombra de chao, porque nao toca o chao."""
    im = nova(24, 16)
    ret(im, 1, 13, 2, 3, MADEIRA_E)
    ret(im, 21, 13, 2, 3, MADEIRA_E)
    ret(im, 0, 10, 24, 3, MADEIRA)
    ret(im, 0, 10, 24, 1, MADEIRA_C)
    ret(im, 0, 12, 24, 1, MADEIRA_E)
    for i, cor in enumerate([ROXO_C, VERDE, VERMELHO, OURO]):
        x = 2 + i * 5
        ret(im, x, 4, 3, 6, cor)
        ret(im, x, 4, 3, 1, BRANCO)
        px(im, x + 1, 2, MADEIRA_E)
    contorno_alfa(im)
    return im


def caldeirao():
    im = nova(20, 20)
    sombra(im, 9, 3, 10, 18)
    for dx in (-6, 0, 6):
        ret(im, 9 + dx, 12, 2, 6, TINTA_2)
    ret(im, 2, 5, 16, 2, TINTA_2)
    ret(im, 3, 6, 14, 8, TINTA)
    ret(im, 3, 6, 14, 2, TINTA_2)
    ret(im, 5, 6, 10, 2, VERDE)
    px(im, 7, 5, VERDE)
    px(im, 12, 5, ROXO_C)
    contorno_alfa(im)
    return im


# ------------------------------------------ as outras casas da Vila, por dentro
# Reusa parede-interior e madeira-chao/chao-caverna (arte/tiles.py) -- so a
# mobilia muda de casa pra casa. Pensada pra reuso: mesa/tapete/armario/banco
# servem qualquer comodo, o resto e tematico (ferraria, casa-grande, padaria).
def mesa():
    im = nova(30, 20)
    sombra(im, 13, 4, 15, 18)
    ret(im, 3, 6, 24, 3, MADEIRA_C)
    ret(im, 3, 6, 24, 1, PAPEL_2)
    ret(im, 3, 9, 24, 2, MADEIRA)
    for x in (5, 22):
        ret(im, x, 11, 3, 7, MADEIRA_E)
    contorno_alfa(im)
    return im


def tapete():
    """So decoracao de chao -- sem sombra, sem colisao, como samambaia."""
    im = nova(32, 20)
    ret(im, 2, 2, 28, 16, VERMELHO)
    ret(im, 2, 2, 28, 2, ROXO_C)
    ret(im, 2, 16, 28, 2, ROXO_C)
    ret(im, 5, 5, 22, 10, ROXO)
    contorno_alfa(im)
    return im


def armario():
    im = nova(22, 34)
    sombra(im, 10, 3, 11, 32)
    ret(im, 2, 4, 18, 28, MADEIRA)
    ret(im, 2, 4, 18, 3, MADEIRA_C)
    linha_v(im, 11, 4, 28, MADEIRA_E)
    for x in (6, 16):
        px(im, x, 18, OURO)
    contorno_alfa(im)
    return im


def banco():
    im = nova(20, 14)
    sombra(im, 9, 3, 10, 12)
    ret(im, 3, 6, 14, 3, MADEIRA)
    for x in (4, 15):
        ret(im, x, 9, 2, 4, MADEIRA_E)
    contorno_alfa(im)
    return im


def forja():
    """A forja da Ferraria: brasa de verdade, mesma familia da fogueira."""
    im = nova(28, 30)
    sombra(im, 12, 4, 14, 28)
    ret(im, 2, 6, 24, 22, PEDRA_E)
    ret(im, 2, 6, 24, 3, PEDRA)
    ret(im, 8, 14, 12, 10, TINTA)
    for j in range(16, 23):
        largura = max(1, 7 - abs(j - 19))
        ret(im, 14 - largura // 2, j, largura, 1, BRASA)
    for j in range(18, 23):
        largura = max(1, 4 - abs(j - 20))
        ret(im, 14 - largura // 2, j, largura, 1, OURO)
    contorno_alfa(im)
    return im


def bigorna():
    im = nova(22, 18)
    sombra(im, 10, 3, 11, 16)
    ret(im, 6, 12, 10, 4, MADEIRA_E)
    ret(im, 3, 6, 16, 5, PEDRA_E)
    ret(im, 3, 6, 16, 1, PEDRA_C)
    ret(im, 8, 4, 6, 3, PEDRA_E)
    contorno_alfa(im)
    return im


def suporte_armas():
    """Montado na parede, igual prateleira-pocoes: sem sombra de chao. Duas
    espadas penduradas de ponta-cabeca -- lamina pra cima encostada na barra,
    guarda no meio, cabo embaixo -- em vez de so duas barras coloridas, que
    lia como cabo solto e nao como arma."""
    im = nova(26, 20)
    ret(im, 2, 2, 22, 2, MADEIRA_E)
    for x, cor in ((7, PEDRA_C), (17, OURO)):
        ret(im, x, 4, 2, 11, cor)
        ret(im, x - 3, 12, 8, 2, MADEIRA_E)
        ret(im, x - 1, 14, 4, 3, MADEIRA)
    contorno_alfa(im)
    return im


def estante_livros():
    im = nova(26, 18)
    ret(im, 1, 14, 2, 3, MADEIRA_E)
    ret(im, 23, 14, 2, 3, MADEIRA_E)
    ret(im, 0, 11, 26, 3, MADEIRA)
    ret(im, 0, 13, 26, 1, MADEIRA_E)
    ret(im, 0, 0, 26, 3, MADEIRA)
    ret(im, 0, 2, 26, 1, MADEIRA_E)
    for i, cor in enumerate([VERMELHO, AZUL, VERDE, OURO, ROXO]):
        x = 2 + i * 5
        ret(im, x, 4, 3, 7, cor)
        px(im, x + 1, 3, PAPEL)
    contorno_alfa(im)
    return im


def forno_padaria():
    im = nova(26, 26)
    sombra(im, 11, 4, 13, 24)
    ret(im, 2, 4, 22, 20, TERRA)
    ret(im, 2, 4, 22, 3, TERRA_C)
    ret(im, 7, 12, 12, 10, TINTA)
    ret(im, 8, 13, 10, 8, TINTA_2)
    for j in range(14, 20):
        largura = max(1, 6 - abs(j - 17))
        ret(im, 13 - largura // 2, j, largura, 1, BRASA)
    contorno_alfa(im)
    return im


def prateleira_pao():
    im = nova(24, 16)
    ret(im, 1, 13, 2, 3, MADEIRA_E)
    ret(im, 21, 13, 2, 3, MADEIRA_E)
    ret(im, 0, 10, 24, 3, MADEIRA)
    ret(im, 0, 12, 24, 1, MADEIRA_E)
    for i in range(4):
        x = 3 + i * 5
        ret(im, x, 5, 4, 4, TERRA_C)
        ret(im, x, 5, 4, 1, PAPEL_2)
    contorno_alfa(im)
    return im


OBJETOS = [
    ("casa-pequena", casa_pequena, (0.10, 0.55)),
    ("casa-grande", casa_grande, (0.10, 0.55)),
    ("ferraria", ferraria, (0.10, 0.55)),
    ("casa-vovo", casa_vovo, (0.10, 0.55)),
    ("hospital", hospital, (0.10, 0.55)),
    ("arvore", lambda: arvore(0), (0.22, 0.10)),
    ("arvore-2", lambda: arvore(1), (0.22, 0.10)),
    ("arvore-3", lambda: arvore(2), (0.22, 0.10)),
    ("arvore-escura", lambda: arvore_escura(1), (0.22, 0.10)),
    ("arvore-escura-2", lambda: arvore_escura(2), (0.22, 0.10)),
    ("arbusto", arbusto_obj, (0.40, 0.45)),
    ("poste-sino", lambda: poste_sino(False), (0.25, 0.14)),
    ("poste-com-sino", lambda: poste_sino(True), (0.25, 0.14)),
    ("poco", poco, (0.40, 0.45)),
    ("pedra-solta", pedra_solta, (0.45, 0.40)),
    ("barraca", barraca_feira, (0.45, 0.40)),
    ("cerca", cerca, (0.50, 0.40)),
    ("fogueira", fogueira, (0.40, 0.40)),
    # os outros 3 quadros da chama tremeluzindo -- nunca plantados num mapa
    # sozinhos, so usados junto com "fogueira" numa animacao (ver Mundo.ts)
    ("fogueira-2", lambda: fogueira(1), (0.40, 0.40)),
    ("fogueira-3", lambda: fogueira(2), (0.40, 0.40)),
    ("fogueira-4", lambda: fogueira(3), (0.40, 0.40)),
    ("bau", bau, (0.45, 0.45)),
    ("placa", placa, (0.30, 0.25)),
    ("varal", varal, (0.50, 0.30)),
    ("navio", navio, (0.75, 0.30)),
    # a Floresta dos Sussurros. O desenho mora em arte/floresta.py; os nomes
    # ficam aqui em literal porque e desta lista que o verificar.mjs confere o
    # espelho com OBJETOS de src/dados/config.ts.
    ("pinheiro", floresta.pinheiro, (0.24, 0.11)),
    ("pinheiro-baixo", floresta.pinheiro_baixo, (0.24, 0.12)),
    ("grande-ouvinte", floresta.grande_ouvinte, (0.22, 0.09)),
    ("arvore-raio", floresta.arvore_raio, (0.24, 0.10)),
    ("tronco-caido", floresta.tronco_caido, (0, 0)),
    ("toco", floresta.toco, (0.40, 0.40)),
    ("samambaia", floresta.samambaia, (0, 0)),
    ("cogumelo", floresta.cogumelo, (0, 0)),
    ("cogumelo-azul", floresta.cogumelo_azul, (0, 0)),
    ("pedra-musgo", floresta.pedra_musgo, (0.45, 0.40)),
    ("teia", floresta.teia, (0, 0)),
    ("raizes", floresta.raizes, (0.40, 0.20)),
    # a Casa de Cura, por dentro
    ("cama", cama, (0.60, 0.45)),
    ("prateleira-pocoes", prateleira_pocoes, (0.10, 0.15)),
    ("caldeirao", caldeirao, (0.45, 0.40)),
    # as outras casas da Vila, por dentro
    ("mesa", mesa, (0.35, 0.35)),
    ("tapete", tapete, (0, 0)),
    ("armario", armario, (0.35, 0.12)),
    ("banco", banco, (0.35, 0.35)),
    ("forja", forja, (0.35, 0.35)),
    ("bigorna", bigorna, (0.35, 0.35)),
    ("suporte-armas", suporte_armas, (0.10, 0.15)),
    ("estante-livros", estante_livros, (0.10, 0.15)),
    ("forno-padaria", forno_padaria, (0.35, 0.35)),
    ("prateleira-pao", prateleira_pao, (0.10, 0.15)),
]


def gerar(saida, a_mao=None):
    """Salva cada objeto num PNG proprio e devolve o tamanho e a caixa de colisao."""
    pasta = os.path.join(saida, "objetos")
    os.makedirs(pasta, exist_ok=True)
    ficha = {}
    for nome, fabrica, (fw, fh) in OBJETOS:
        im = (a_mao(nome) if a_mao else None) or fabrica()
        im.save(os.path.join(pasta, nome + ".png"))
        ficha[nome] = {
            "w": im.width,
            "h": im.height,
            # caixa de colisao proporcional, ancorada nos pes do objeto
            "cw": round(im.width * fw * 2),
            "ch": round(im.height * fh),
        }
    return ficha
