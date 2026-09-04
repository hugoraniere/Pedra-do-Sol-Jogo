# -*- coding: utf-8 -*-
"""As pecas da Floresta dos Sussurros, desenhadas como objetos inteiros.

O pinheiro e o tijolo da mata: ele aparece centenas de vezes, plantado por
`plantarMata()` a partir da letra `T` do desenho do chao. Por isso ele foi feito
para ficar bom REPETIDO e SOBREPOSTO, com a copa mais larga que a base e o topo
assimetrico. Copa simetrica repetida vira papel de parede.

A familia de verde daqui e a da mata (PINHEIRO, MATA), mais escura e mais fria
que a da vila. Ver arte/paleta.py.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from paleta import *  # noqa
from desenho import nova, px, ret, linha_h, linha_v, contorno_alfa, sombra


def _tronco(im, cx, base, altura, largura=6):
    """Tronco com luz de um lado e sombra do outro."""
    ret(im, cx - largura // 2, base - altura, largura, altura, CASCA)
    linha_v(im, cx - largura // 2, base - altura, altura, CASCA_C)
    linha_v(im, cx + largura // 2 - 1, base - altura, altura, CASCA_E)
    # raiz alargando no pe, o que assenta a arvore no chao
    ret(im, cx - largura // 2 - 2, base - 3, largura + 4, 3, CASCA_E)


def _tufo(im, cx, cy, rx, ry, cor):
    for j in range(int(cy - ry), int(cy + ry + 1)):
        for i in range(int(cx - rx), int(cx + rx + 1)):
            if ((i - cx) / rx) ** 2 + ((j - cy) / ry) ** 2 <= 1:
                px(im, i, j, cor)


def pinheiro(alto=True):
    """Conifera de mata fechada.

    Desenhada como saia sobre saia, nao como tres triangulos soltos: cada andar
    comeca estreito e alarga ate transbordar por cima do de baixo. E o que da
    massa a silhueta. A primeira versao tinha galho fino e tronco a mostra, e
    cem delas lado a lado viravam um pinheirinho de natal repetido.

    O topo e o unico lugar simetrico. Da metade para baixo cada andar puxa para
    um lado, sorteado pela posicao, para a mata nao virar papel de parede.
    """
    import random as _r
    w, h = (30, 62) if alto else (26, 50)
    im = nova(w, h)
    cx, base = w // 2, h - 3
    sombra(im, w / 2 - 5, 3, cx, base)
    _tronco(im, cx, base, 14 if alto else 11, 5)

    topo = 4 if alto else 5
    fundo = base - (9 if alto else 7)
    passo = 11 if alto else 9
    limite = w / 2 - 1.5
    r = _r.Random(7 if alto else 11)
    desvios = [r.choice((-1, 0, 1)) for _ in range(6)]

    for y in range(topo, fundo):
        d = y - topo
        andar, dentro = d // passo, d % passo
        meia = 1.2 + andar * 2.4 + dentro * 0.62
        meia = min(meia, limite)
        # o andar de cima puxa menos que o de baixo: arvore nao balanca na ponta
        desvio = desvios[min(andar, 5)] * (0 if andar < 1 else 1)
        esq, dir_ = int(cx - meia + desvio), int(cx + meia + desvio)
        # ponta de galho saindo da silhueta, um pixel, alternando de lado
        if dentro >= passo - 3:
            if (y + andar) % 2:
                esq -= 1
            else:
                dir_ += 1
        for i in range(esq, dir_ + 1):
            # luz vem de cima e da esquerda
            if dentro < 2:
                cor = PINHEIRO_C
            elif dentro >= passo - 1:
                cor = PINHEIRO_E
            elif i < cx - meia * 0.35 + desvio:
                cor = PINHEIRO_C if dentro < passo // 2 else PINHEIRO
            else:
                cor = PINHEIRO if dentro < passo - 2 else PINHEIRO_E
            px(im, i, y, cor)
    # agulha solta no contorno, para a borda nao ficar de gelatina
    for k in range(topo + 6, fundo, 3):
        lado = -1 if (k // 3) % 2 else 1
        d = k - topo
        meia = min(1.2 + (d // passo) * 2.4 + (d % passo) * 0.62, limite)
        px(im, int(cx + lado * (meia + 1)), k, PINHEIRO_E)
    contorno_alfa(im)
    return im


def pinheiro_baixo():
    return pinheiro(False)


def grande_ouvinte():
    """A arvore-mae, o marco central do mapa. Ela precisa ser reconhecivel de
    longe por SILHUETA, porque e por ela que o jogador se orienta: tronco muito
    largo, copa em domo e dois galhos abertos que nenhuma outra arvore tem.

    O rosto na casca fica discreto. Arvore com cara de desenho animado estraga a
    escala; o que assusta e bonito e perceber o rosto depois de olhar duas vezes."""
    w, h = 84, 112
    im = nova(w, h)
    cx, base = w // 2, h - 4
    sombra(im, 30, 7, cx, base)
    # tronco largo, com estrias verticais
    ret(im, cx - 13, base - 44, 26, 44, CASCA)
    for x in (-11, -6, 0, 5, 10):
        linha_v(im, cx + x, base - 42, 40, CASCA_E if x % 3 else CASCA_C)
    ret(im, cx - 18, base - 8, 36, 8, CASCA_E)          # raizes
    for x in (-17, -12, 12, 16):
        ret(im, cx + x, base - 14, 3, 10, CASCA_E)
    # dois galhos abertos, a assinatura da silhueta
    for lado in (-1, 1):
        for k in range(14):
            px(im, cx + lado * (13 + k), base - 44 - k // 2, CASCA)
            px(im, cx + lado * (13 + k), base - 43 - k // 2, CASCA_E)
    # copa em domo, tres camadas
    _tufo(im, cx, base - 74, 38, 26, PINHEIRO)
    _tufo(im, cx - 24, base - 62, 18, 13, PINHEIRO)
    _tufo(im, cx + 24, base - 62, 18, 13, PINHEIRO)
    for (bx, by, rx, ry) in [(cx, base - 74, 38, 26), (cx - 24, base - 62, 18, 13), (cx + 24, base - 62, 18, 13)]:
        for j in range(int(by), int(by + ry + 1)):
            for i in range(int(bx - rx), int(bx + rx + 1)):
                d = ((i - bx) / rx) ** 2 + ((j - by) / ry) ** 2
                if 0.5 < d <= 1:
                    px(im, i, j, PINHEIRO_E)
    # Luz na copa: risco fino seguindo a curva, nunca bolha. A versao anterior
    # usava tufos de 4x3 e eles liam como buraco quadrado na folhagem.
    for (dx, dy, comp) in [(-20, -14, 5), (-11, -20, 7), (1, -22, 8), (12, -19, 6),
                           (20, -12, 4), (-26, -4, 4), (23, -6, 3), (-6, -9, 5)]:
        for k in range(comp):
            px(im, cx + dx + k, base - 74 + dy + (k > comp // 2), PINHEIRO_C)
    # borda de luz no alto da copa, do lado de onde vem o sol
    for i in range(-30, 6):
        j = base - 74 - int((1 - (i / 38.0) ** 2) ** 0.5 * 26) + 1
        px(im, cx + i, j, PINHEIRO_C)
        px(im, cx + i, j + 1, PINHEIRO_C if i % 3 else PINHEIRO)
    # O rosto: dois nos de madeira e uma fenda vertical entre eles. A versao
    # anterior tinha uma boca em arco e virava carinha triste, que e justamente
    # o que estraga a escala de uma arvore deste tamanho. Aqui o rosto so
    # aparece para quem olhar duas vezes.
    for (ox, oy) in ((-8, -31), (5, -31)):
        ret(im, cx + ox, base + oy, 4, 2, CASCA_E)
        px(im, cx + ox + 1, base + oy, TINTA)
        px(im, cx + ox + 2, base + oy, TINTA)
    for k in range(6):
        px(im, cx, base - 26 + k, CASCA_E)
        px(im, cx + 1, base - 26 + k, TINTA if k in (1, 2, 3) else CASCA_E)
    contorno_alfa(im)
    return im


def arvore_raio():
    """A arvore partida por um raio, marco da Clareira do Trovao. O tronco sobe,
    racha na diagonal e para. Nao tem copa: e isso que a torna inconfundivel."""
    im = nova(38, 58)
    cx, base = 19, 54
    sombra(im, 12, 4, cx, base)
    ret(im, cx - 5, base - 34, 10, 34, CASCA)
    linha_v(im, cx - 5, base - 34, 34, CASCA_C)
    linha_v(im, cx + 4, base - 34, 34, CASCA_E)
    ret(im, cx - 8, base - 4, 16, 4, CASCA_E)
    # a racha, aberta e escura
    for k in range(22):
        x = cx - 1 + k // 4
        px(im, x, base - 34 + k, TINTA)
        px(im, x + 1, base - 34 + k, CASCA_E)
    # as duas pontas quebradas, viradas para fora
    for k in range(10):
        px(im, cx - 5 - k // 2, base - 34 - k, CASCA)
        px(im, cx - 4 - k // 2, base - 34 - k, CASCA_C)
        px(im, cx + 4 + k // 3, base - 36 - k, CASCA)
        px(im, cx + 5 + k // 3, base - 36 - k, CASCA_E)
    # brasa fria ainda presa na fenda, a piscadela do Trovao
    for (x, y) in ((cx, base - 26), (cx + 1, base - 20), (cx - 1, base - 14)):
        px(im, x, y, OURO)
    contorno_alfa(im)
    return im


def tronco_caido():
    """O tronco atravessado no riacho. Nao tem colisao: e por cima dele que se
    passa. A casca descascada de um lado diz 'da para pisar' sem placa nenhuma."""
    im = nova(56, 22)
    sombra(im, 26, 4, 28, 19)
    ret(im, 2, 6, 52, 10, CASCA)
    linha_h(im, 2, 6, 52, CASCA_C)
    linha_h(im, 2, 15, 52, CASCA_E)
    # trecho descascado no meio, mais claro: o lugar de pisar
    ret(im, 18, 8, 20, 6, MADEIRA_C)
    for x in range(19, 37, 4):
        linha_v(im, x, 8, 6, MADEIRA)
    # anel do corte na ponta
    for j in range(6, 16):
        px(im, 53, j, MADEIRA_C)
    ret(im, 51, 9, 3, 4, MADEIRA)
    for (x, y) in ((8, 17), (30, 17), (44, 17)):
        px(im, x, y, MUSGO); px(im, x + 1, y, MUSGO_C)
    contorno_alfa(im)
    return im


def toco():
    im = nova(20, 16)
    sombra(im, 8, 3, 10, 14)
    ret(im, 3, 5, 14, 8, CASCA)
    linha_v(im, 3, 5, 8, CASCA_C)
    linha_v(im, 16, 5, 8, CASCA_E)
    _tufo(im, 10, 5, 7, 3, MADEIRA_C)
    _tufo(im, 10, 5, 3, 1, MADEIRA)
    for (x, y) in ((4, 4), (15, 6)):
        px(im, x, y, MUSGO)
    contorno_alfa(im)
    return im


def samambaia():
    """Folha de mata, sem colisao. Enche o chao e quebra a repeticao do tile."""
    im = nova(22, 18)
    sombra(im, 8, 2, 11, 16)
    for (ang, comp) in ((-7, 9), (-3, 11), (1, 11), (5, 9), (8, 7)):
        for k in range(comp):
            x, y = 11 + ang * (k + 3) // 7, 15 - k
            px(im, x, y, PINHEIRO if k % 2 else PINHEIRO_C)
            if k > 2:
                px(im, x - 1, y, PINHEIRO_E)
                px(im, x + 1, y, PINHEIRO_E)
    contorno_alfa(im)
    return im


def cogumelo(brilha=False):
    """Cogumelo em trio. O azul e o do Bosque das Lanternas e nao tem contorno
    escuro no chapeu, para parecer que ele mesmo e a fonte de luz."""
    cor, cor_e = (COGUMELO_A, (72, 122, 180)) if brilha else (COGUMELO, COGUMELO_E)
    im = nova(18, 14)
    sombra(im, 7, 2, 9, 12)
    for (cx, cy, r) in ((5, 7, 4), (12, 8, 3), (8, 5, 3)):
        ret(im, cx - 1, cy, 2, 12 - cy, PAPEL_2)
        _tufo(im, cx, cy, r, r - 1, cor)
        _tufo(im, cx - 1, cy - 1, r - 2, 1, PAPEL)
        for i in range(cx - r, cx + r + 1):
            px(im, i, cy + r - 2, cor_e)
    contorno_alfa(im)
    if brilha:
        for (cx, cy, r) in ((5, 7, 4), (12, 8, 3), (8, 5, 3)):
            _tufo(im, cx, cy - 1, r - 1, r - 2, COGUMELO_A)
    return im


def cogumelo_azul():
    return cogumelo(True)


def pedra_musgo():
    im = nova(28, 22)
    sombra(im, 12, 3, 14, 20)
    _tufo(im, 14, 12, 12, 8, PEDRA)
    _tufo(im, 14, 9, 10, 5, PEDRA_C)
    for j in range(14, 20):
        for i in range(3, 25):
            if im.getpixel((i, j))[3]:
                px(im, i, j, PEDRA_E)
    for (x, y, w) in ((5, 8, 6), (15, 6, 8), (20, 11, 5)):
        for k in range(w):
            px(im, x + k, y + (k % 2), MUSGO)
            px(im, x + k, y + 1 + (k % 2), MUSGO_C)
    contorno_alfa(im)
    return im


def teia():
    """A Teia Doce. Rosa clara e comestivel, nunca cinza de casa mal-assombrada.
    Sem colisao: quem passa, passa; o que a teia faz e avisar de quem mora ali."""
    im = nova(34, 30)
    cx, cy = 17, 4
    for (dx, dy) in ((-16, 26), (-8, 28), (0, 29), (8, 28), (16, 26)):
        passos = max(abs(dx), dy)
        for k in range(passos):
            px(im, cx + dx * k // passos, cy + dy * k // passos,
               TEIA if k % 3 else TEIA_E)
    for anel in (8, 15, 22):
        for i in range(-16, 17):
            j = cy + anel - abs(i) * anel // 26
            if 0 <= j < 30:
                px(im, cx + i, j, TEIA_E if anel == 22 else TEIA)
    # gotas de melado presas na teia: e o que diz "doce" sem precisar de fala
    for (x, y) in ((12, 12), (21, 16), (16, 21), (8, 18)):
        px(im, x, y, ROSA); px(im, x + 1, y, TEIA)
        px(im, x, y + 1, TEIA_E); px(im, x + 1, y + 1, TEIA_E)
    return im


def raizes():
    """A escada de raizes: o atalho que so abre do lado de cima. Ela e desenhada
    como degrau de proposito, para o jogador ler 'da para subir' de longe."""
    im = nova(24, 44)
    sombra(im, 10, 3, 12, 42)
    ret(im, 3, 2, 5, 40, CASCA)
    ret(im, 16, 2, 5, 40, CASCA)
    linha_v(im, 3, 2, 40, CASCA_C)
    linha_v(im, 20, 2, 40, CASCA_E)
    for k, y in enumerate(range(6, 40, 7)):
        recuo = (0, 1, 0, 2, 1)[k % 5]
        largura = (12, 10, 13, 11, 12)[k % 5]
        ret(im, 6 - recuo, y, largura, 3, CASCA_C)
        linha_h(im, 6 - recuo, y + 2, largura, CASCA_E)
        px(im, 6 - recuo - 1, y + 1, CASCA)
    for (x, y) in ((5, 10), (18, 24), (7, 31)):
        px(im, x, y, MUSGO); px(im, x, y + 1, MUSGO_C)
    contorno_alfa(im)
    return im


#: nome, funcao, (fator de largura da colisao, fator de altura da colisao).
#: Colisao 0 significa que da para passar por cima: tronco, teia e as folhas.
PECAS = [
    ("pinheiro", pinheiro, (0.24, 0.11)),
    ("pinheiro-baixo", pinheiro_baixo, (0.24, 0.12)),
    ("grande-ouvinte", grande_ouvinte, (0.22, 0.09)),
    ("arvore-raio", arvore_raio, (0.24, 0.10)),
    ("tronco-caido", tronco_caido, (0, 0)),
    ("toco", toco, (0.40, 0.40)),
    ("samambaia", samambaia, (0, 0)),
    ("cogumelo", cogumelo, (0, 0)),
    ("cogumelo-azul", cogumelo_azul, (0, 0)),
    ("pedra-musgo", pedra_musgo, (0.45, 0.40)),
    ("teia", teia, (0, 0)),
    ("raizes", raizes, (0.40, 0.20)),
]
