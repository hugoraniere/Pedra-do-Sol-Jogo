# -*- coding: utf-8 -*-
"""Personagens do jogo, 16 x 32.

A estrutura segue a do Stardew Valley, que e a referencia do projeto:

  . sprite de 16 x 32, cabeca grande, proporcao chibi
  . ciclo de caminhada de 3 quadros tocados na ordem 1, 2, 1, 3, a 5 quadros por
    segundo. Com 4 quadros diferentes a perna "pisca"; com 3 na ordem certa o passo
    fica natural e ainda economiza desenho
  . BRACO E CAMADA DE CIMA, separada do tronco. E isso que permite o personagem
    segurar arma e levantar a mao sem quebrar a roupa
  . ordem de desenho: corpo, roupa, cabelo, chapeu, braco, arma

Cada folha tem 6 colunas por 4 linhas:

  colunas: 0 parado, 1 passo A, 2 passo B, 3 respirando, 4 conjurando, 5 tonto
  linhas:  0 baixo, 1 esquerda, 2 direita, 3 cima

As camadas de roupa, cabelo e chapeu saem em BRANCO e recebem tint no jogo, entao
qualquer cor funciona sem gerar arte nova. O corpo sai em tres tons de pele porque
tint em pele fica sujo.

Tecnica, resumida em docs/08-guia-de-sprites.md:
  . tres tons por material (sombra, base, luz) com deslocamento de matiz
  . contorno seletivo: escuro embaixo e do lado da sombra, tom medio em cima
  . nada de sombra em aneis concentricos, a luz vem sempre de cima e da esquerda
"""
import os
import sys
from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from paleta import *  # noqa

PW, PH = 16, 32
COLUNAS = ["parado", "passo-a", "passo-b", "respira", "conjura", "tonto"]
LINHAS = ["baixo", "esquerda", "direita", "cima"]

B = (255, 255, 255)      # base da camada que recebe tint
BS = (196, 196, 196)     # sombra da camada que recebe tint
BL = (255, 255, 255)     # luz


def nova():
    return Image.new("RGBA", (PW, PH), (0, 0, 0, 0))


def px(im, x, y, cor):
    x, y = int(x), int(y)
    if 0 <= x < PW and 0 <= y < PH:
        im.putpixel((x, y), cor if len(cor) == 4 else tuple(cor) + (255,))


def ret(im, x, y, w, h, cor):
    for j in range(int(h)):
        for i in range(int(w)):
            px(im, x + i, y + j, cor)


def pontos(im, lista, cor):
    for (x, y) in lista:
        px(im, x, y, cor)


def contorno_seletivo(im, escuro=TINTA, medio=None):
    """Contorno de 1 px em volta do que ja foi desenhado.
    Embaixo e a direita usa o tom escuro; em cima e a esquerda, se um tom medio for
    dado, usa ele. E o 'selout': o contorno some onde a luz bate."""
    base = im.copy()
    for j in range(PH):
        for i in range(PW):
            if base.getpixel((i, j))[3]:
                continue
            vizinhos = []
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                a, b = i + dx, j + dy
                if 0 <= a < PW and 0 <= b < PH and base.getpixel((a, b))[3] > 200:
                    vizinhos.append((dx, dy))
            if not vizinhos:
                continue
            so_por_cima = all(dy == 1 for (_, dy) in vizinhos)
            px(im, i, j, medio if (so_por_cima and medio) else escuro)
    return im


def sombra_chao(im, largura=6):
    for i in range(8 - largura, 8 + largura):
        for j in (30, 31):
            if im.getpixel((i, j))[3] == 0:
                borda = abs(i - 7.5) > largura - 1.5
                if not (borda and j == 30):
                    px(im, i, j, (36, 30, 52, 70 if j == 30 else 45))
    return im


# ------------------------------------------------------------- movimento
def deslocamento(coluna):
    """Devolve (balanco das pernas, sobe e desce do corpo, balanco do braco).

    O corpo sobe 1 px no meio do passo. E o detalhe que separa um boneco andando
    de um boneco deslizando pela tela."""
    if coluna == "passo-a":
        return 1, -1, 1
    if coluna == "passo-b":
        return -1, -1, -1
    if coluna == "respira":
        return 0, 1, 0
    return 0, 0, 0


# ------------------------------------------------------------------ corpo
def corpo(direcao, coluna, tom=0, orelha_pontuda=True):
    """Cabeca, tronco, pernas e botas. Sem braco: braco e camada de cima."""
    im = nova()
    sombra_pele, pele, luz_pele = PELE_TONS[tom]
    perna, sobe, _ = deslocamento(coluna)
    tonto = coluna == "tonto"

    topo = 3 + sobe + (1 if tonto else 0)

    # ------ cabeca. os cantos sao cortados: silhueta arredondada le muito melhor
    # que um retangulo, e a 16 px a silhueta e quase tudo que o jogador enxerga
    ret(im, 3, topo, 10, 13, pele)
    for (cx, cy) in [(3, topo), (12, topo), (3, topo + 12), (12, topo + 12)]:
        px(im, cx, cy, (0, 0, 0, 0))
    ret(im, 4, topo, 8, 1, luz_pele)          # luz no alto
    ret(im, 3, topo + 11, 10, 2, sombra_pele)  # queixo na sombra
    ret(im, 12, topo + 2, 1, 10, sombra_pele)  # lado direito na sombra

    # orelhas
    if direcao != "cima":
        if orelha_pontuda:
            pontos(im, [(2, topo + 5), (2, topo + 6), (1, topo + 4),
                        (13, topo + 5), (13, topo + 6), (14, topo + 4)], pele)
            pontos(im, [(2, topo + 7), (13, topo + 7)], sombra_pele)
        else:
            pontos(im, [(2, topo + 6), (13, topo + 6)], pele)

    # ------ rosto
    olho_y = topo + 6
    if tonto:
        # olhinho em X, sem cara de dor
        pontos(im, [(5, olho_y), (6, olho_y + 1), (5, olho_y + 2), (6, olho_y),
                    (9, olho_y), (10, olho_y + 1), (9, olho_y + 2), (10, olho_y)], TINTA)
    elif direcao == "baixo":
        ret(im, 5, olho_y, 2, 3, PAPEL)
        ret(im, 9, olho_y, 2, 3, PAPEL)
        px(im, 6, olho_y + 1, TINTA); px(im, 6, olho_y + 2, TINTA)
        px(im, 10, olho_y + 1, TINTA); px(im, 10, olho_y + 2, TINTA)
        pontos(im, [(5, olho_y - 1), (6, olho_y - 1), (9, olho_y - 1), (10, olho_y - 1)], TINTA_2)
        ret(im, 7, topo + 10, 2, 1, sombra_pele)
        pontos(im, [(4, topo + 9), (11, topo + 9)], (216, 148, 138))
    elif direcao in ("esquerda", "direita"):
        # de perfil o rosto e estreito: olho grande, nariz saindo e boca curta
        esq = direcao == "esquerda"
        ox = 4 if esq else 9
        ret(im, ox, olho_y, 3, 3, PAPEL)
        ret(im, ox if esq else ox + 2, olho_y + 1, 1, 2, TINTA)
        pontos(im, [(ox, olho_y - 1), (ox + 1, olho_y - 1), (ox + 2, olho_y - 1)], TINTA_2)
        nx = 2 if esq else 13
        px(im, nx, olho_y + 3, pele)
        px(im, nx, olho_y + 4, sombra_pele)
        ret(im, 3 if esq else 11, topo + 10, 2, 1, sombra_pele)
        px(im, 4 if esq else 11, topo + 8, (216, 148, 138))

    # ------ pescoco e tronco (a roupa cobre, aqui e so o volume)
    ret(im, 6, topo + 13, 4, 1, sombra_pele)
    ret(im, 4, topo + 14, 8, 9, pele)
    ret(im, 11, topo + 14, 1, 9, sombra_pele)
    px(im, 4, topo + 14, (0, 0, 0, 0))
    px(im, 11, topo + 14, (0, 0, 0, 0))

    # ------ pernas
    base_perna = 25 + sobe
    ret(im, 5, base_perna, 2, 3 + perna, pele)
    ret(im, 9, base_perna, 2, 3 - perna, pele)
    ret(im, 6, base_perna, 1, 3 + perna, sombra_pele)
    ret(im, 10, base_perna, 1, 3 - perna, sombra_pele)

    # ------ botas
    for (bx, alt) in ((4, perna), (8, -perna)):
        y = base_perna + 3 + alt
        ret(im, bx, y, 4, 2, MADEIRA_E)
        ret(im, bx, y, 4, 1, MADEIRA)
        ret(im, bx, y + 1, 4, 1, TINTA_2)

    contorno_seletivo(im, TINTA, TINTA_2)
    sombra_chao(im)
    return im


# ------------------------------------------------------------------ braco
def bracos(direcao, coluna, tom=0):
    """Camada de cima. Fica por cima da roupa, igual ao Stardew."""
    im = nova()
    sombra_pele, pele, _ = PELE_TONS[tom]
    _, sobe, balanco = deslocamento(coluna)
    topo = 3 + sobe
    ombro = topo + 15

    if coluna == "conjura":
        # um braco levantado, o outro em guarda. serve para magia e para acenar
        ret(im, 12, topo + 4, 2, 8, pele)
        ret(im, 13, topo + 4, 1, 8, sombra_pele)
        ret(im, 2, ombro + 1, 2, 6, pele)
        ret(im, 3, ombro + 1, 1, 6, sombra_pele)
    elif direcao == "esquerda":
        ret(im, 3, ombro + balanco, 3, 7, pele)
        ret(im, 5, ombro + balanco, 1, 7, sombra_pele)
    elif direcao == "direita":
        ret(im, 10, ombro - balanco, 3, 7, pele)
        ret(im, 12, ombro - balanco, 1, 7, sombra_pele)
    else:
        ret(im, 2, ombro + balanco, 2, 7, pele)
        ret(im, 12, ombro - balanco, 2, 7, pele)
        ret(im, 3, ombro + balanco, 1, 7, sombra_pele)
        ret(im, 13, ombro - balanco, 1, 7, sombra_pele)

    contorno_seletivo(im, TINTA, TINTA_2)
    return im


# ----------------------------------------------------------------- cabelo
ESTILOS_CABELO = ["curto", "comprido", "cacheado", "rabo", "moicano"]


def cabelo(direcao, coluna, estilo="curto"):
    im = nova()
    _, sobe, _ = deslocamento(coluna)
    topo = 3 + sobe + (1 if coluna == "tonto" else 0)
    de_costas = direcao == "cima"

    if de_costas:
        ret(im, 3, topo, 10, 12, B)
        px(im, 3, topo, (0, 0, 0, 0))
        px(im, 12, topo, (0, 0, 0, 0))
        ret(im, 4, topo, 8, 1, BL)
        ret(im, 7, topo + 2, 2, 8, BS)   # risca da nuca, senao as costas viram bloco
        if estilo in ("comprido", "rabo"):
            ret(im, 3, topo + 12, 10, 4, BS)
        return contorno_seletivo(im, TINTA, TINTA_2)

    # franja, comum a todos
    ret(im, 3, topo, 10, 3, B)
    px(im, 3, topo, (0, 0, 0, 0))
    px(im, 12, topo, (0, 0, 0, 0))
    ret(im, 4, topo - 1, 8, 1, B)
    ret(im, 4, topo, 6, 1, BL)

    perfil = direcao in ("esquerda", "direita")
    # de perfil a nuca fica do lado oposto ao que o personagem olha
    nuca_x = 9 if direcao == "esquerda" else 3
    nuca_l = 4

    if estilo == "curto":
        if perfil:
            ret(im, nuca_x, topo, nuca_l, 8, B)
            ret(im, nuca_x, topo + 6, nuca_l, 2, BS)
        else:
            ret(im, 3, topo + 3, 1, 4, B)
            ret(im, 12, topo + 3, 1, 4, B)
            px(im, 12, topo + 6, BS)
    elif estilo == "comprido":
        if perfil:
            ret(im, nuca_x, topo, nuca_l, 14, B)
            ret(im, nuca_x + (2 if direcao == "esquerda" else 0), topo + 6, 2, 8, BS)
        else:
            ret(im, 2, topo + 2, 2, 12, B)
            ret(im, 12, topo + 2, 2, 12, B)
            ret(im, 13, topo + 8, 1, 6, BS)
            ret(im, 2, topo + 12, 2, 2, BS)
    elif estilo == "cacheado":
        if perfil:
            ret(im, nuca_x, topo, nuca_l, 9, B)
            for k in range(3):
                ret(im, nuca_x + (nuca_l - 1 if direcao == "esquerda" else -1), topo + 1 + k * 3, 2, 2, B)
            ret(im, nuca_x, topo + 7, nuca_l, 2, BS)
        else:
            for (x, y) in [(2, topo + 2), (2, topo + 5), (13, topo + 2), (13, topo + 5),
                           (3, topo - 1), (11, topo - 1), (7, topo - 2)]:
                ret(im, x, y, 2, 2, B)
            ret(im, 3, topo + 3, 1, 4, B)
            ret(im, 12, topo + 3, 1, 4, B)
    elif estilo == "rabo":
        if perfil:
            ret(im, nuca_x, topo, nuca_l, 7, B)
            x = 13 if direcao == "direita" else 1
            ret(im, x - (1 if direcao == "direita" else 0), topo + 3, 2, 9, B)
            ret(im, x, topo + 7, 1, 5, BS)
        else:
            ret(im, 3, topo + 3, 1, 3, B)
            ret(im, 12, topo + 3, 1, 3, B)
            ret(im, 13, topo + 2, 2, 9, B)
            ret(im, 14, topo + 6, 1, 5, BS)
    elif estilo == "moicano":
        ret(im, 6, topo - 3, 4, 4, B)
        ret(im, 7, topo - 4, 2, 2, B)
        if perfil:
            ret(im, nuca_x, topo, nuca_l, 4, BS)
        else:
            ret(im, 3, topo + 3, 1, 2, BS)
            ret(im, 12, topo + 3, 1, 2, BS)

    return contorno_seletivo(im, TINTA, TINTA_2)


# ------------------------------------------------------------------ roupa
ESTILOS_ROUPA = ["tunica", "folhas", "capa"]


def roupa(direcao, coluna, estilo="tunica"):
    im = nova()
    _, sobe, _ = deslocamento(coluna)
    topo = 3 + sobe
    peito = topo + 14

    if estilo == "capa":
        # a capa aparece atras dos ombros, entao e mais larga que o tronco
        ret(im, 3, peito - 1, 10, 11, BS)
        ret(im, 4, peito, 8, 9, B)
        ret(im, 5, peito, 2, 4, BL)
        ret(im, 4, peito + 9, 8, 2, BS)
        return contorno_seletivo(im, TINTA, TINTA_2)

    ret(im, 4, peito, 8, 9, B)
    px(im, 4, peito, (0, 0, 0, 0))   # ombro arredondado
    px(im, 11, peito, (0, 0, 0, 0))
    ret(im, 5, peito, 2, 4, BL)     # luz no peito, vem de cima e da esquerda
    ret(im, 11, peito, 1, 9, BS)    # lado direito na sombra
    ret(im, 4, peito + 8, 8, 1, BS)

    if estilo == "folhas":
        # barra recortada, a tunica de folha do Elfo
        for x in range(4, 12, 2):
            px(im, x, peito + 9, B)
            px(im, x + 1, peito + 9, BS)
        ret(im, 5, peito - 1, 6, 1, B)   # gola de folhas
        px(im, 7, peito + 4, BS); px(im, 8, peito + 4, BS)
    else:
        ret(im, 4, peito + 5, 8, 1, BS)  # cinto

    return contorno_seletivo(im, TINTA, TINTA_2)


# ----------------------------------------------------------------- chapeu
TIPOS_CHAPEU = ["nenhum", "pontudo", "palha", "capuz", "coroa"]


def chapeu(direcao, coluna, tipo="pontudo"):
    im = nova()
    if tipo == "nenhum":
        return im
    _, sobe, _ = deslocamento(coluna)
    topo = 3 + sobe + (1 if coluna == "tonto" else 0)

    if tipo == "pontudo":
        ret(im, 2, topo - 1, 12, 3, B)
        ret(im, 4, topo - 4, 8, 3, B)
        ret(im, 6, topo - 6, 4, 2, B)
        ret(im, 7, topo - 7, 2, 1, B)
        ret(im, 2, topo + 1, 12, 1, BS)
        ret(im, 4, topo - 4, 4, 1, BL)
    elif tipo == "palha":
        ret(im, 1, topo, 14, 2, B)
        ret(im, 4, topo - 3, 8, 3, B)
        ret(im, 1, topo + 1, 14, 1, BS)
        ret(im, 5, topo - 3, 4, 1, BL)
    elif tipo == "capuz":
        ret(im, 2, topo - 1, 12, 4, B)
        ret(im, 4, topo - 3, 8, 2, B)
        ret(im, 6, topo - 5, 4, 2, B)
        ret(im, 2, topo + 2, 2, 8, B)
        ret(im, 12, topo + 2, 2, 8, B)
        ret(im, 12, topo + 2, 2, 8, BS)
    elif tipo == "coroa":
        ret(im, 4, topo - 1, 8, 3, B)
        for x in (4, 7, 10):
            ret(im, x, topo - 3, 2, 2, B)
        ret(im, 4, topo + 1, 8, 1, BS)

    return contorno_seletivo(im, TINTA, TINTA_2)


# ------------------------------------------------------------------- arma
TIPOS_ARMA = ["nenhuma", "cajado", "espada", "arco", "martelo", "funda"]


def arma(direcao, coluna, tipo="cajado"):
    """Desenhada por cima do braco, na mao certa de cada angulo."""
    im = nova()
    if tipo == "nenhuma" or direcao == "cima":
        return im
    _, sobe, balanco = deslocamento(coluna)
    topo = 3 + sobe
    conjurando = coluna == "conjura"

    # a mao muda de lado conforme o angulo
    x = 14 if direcao != "esquerda" else 1
    y_mao = topo + 16 - (balanco if x > 8 else -balanco)
    if conjurando:
        x, y_mao = 14, topo + 6

    if tipo == "cajado":
        for k in range(18):
            y = y_mao - 10 + k
            px(im, x, y, MADEIRA if k % 3 else MADEIRA_E)
        px(im, x, y_mao - 11, ROXO)
        px(im, x, y_mao - 12, ROXO_C)
        px(im, x + (1 if x < 8 else -1), y_mao - 11, ROXO)
    elif tipo == "espada":
        for k in range(9):
            px(im, x, y_mao - 8 + k, PEDRA_C if k < 7 else OURO)
        px(im, x, y_mao - 9, PAPEL)
        px(im, x + (1 if x < 8 else -1), y_mao + 1, OURO)
        px(im, x - (1 if x < 8 else -1), y_mao + 1, OURO)
    elif tipo == "arco":
        for k, dx in enumerate([1, 0, 0, 0, 1]):
            d = dx if x > 8 else -dx
            px(im, x + d, y_mao - 6 + k * 3, MADEIRA)
        for k in range(13):
            px(im, x, y_mao - 6 + k, TINTA_2 if k % 6 else MADEIRA_E)
    elif tipo == "martelo":
        for k in range(10):
            px(im, x, y_mao - 6 + k, MADEIRA)
        ret(im, x - 1, y_mao - 9, 3, 3, PEDRA)
        ret(im, x - 1, y_mao - 7, 3, 1, PEDRA_E)
    elif tipo == "funda":
        for k in range(6):
            px(im, x, y_mao - 3 + k, MADEIRA_E)
        px(im, x + (1 if x < 8 else -1), y_mao + 3, TERRA_C)

    return contorno_seletivo(im, TINTA)


# ---------------------------------------------------------------- montagem
def folha(desenhar, **kw):
    """Monta a folha de 6 colunas por 4 linhas chamando a funcao de desenho."""
    im = Image.new("RGBA", (PW * len(COLUNAS), PH * len(LINHAS)), (0, 0, 0, 0))
    for li, direcao in enumerate(LINHAS):
        for ci, coluna in enumerate(COLUNAS):
            im.paste(desenhar(direcao, coluna, **kw), (ci * PW, li * PH))
    return im


# ------------------------------------------------------------------- npcs
NPCS = [
    ("vovo", dict(tom=0, cabelo="comprido", cor_cabelo="branco", roupa="tunica", cor_roupa=ROXO, chapeu="nenhum", orelha=False)),
    ("ferreiro", dict(tom=1, cabelo="curto", cor_cabelo="castanho", roupa="tunica", cor_roupa=(150, 96, 60), chapeu="nenhum", orelha=False, barba=True)),
    ("menina", dict(tom=0, cabelo="rabo", cor_cabelo="loiro", roupa="tunica", cor_roupa=ROSA, chapeu="nenhum", orelha=False)),
    ("pescador", dict(tom=1, cabelo="curto", cor_cabelo="branco", roupa="tunica", cor_roupa=AZUL, chapeu="palha", orelha=False, barba=True)),
    ("mercador", dict(tom=2, cabelo="cacheado", cor_cabelo="preto", roupa="tunica", cor_roupa=VERDE, chapeu="pontudo", orelha=False)),
    ("menino", dict(tom=0, cabelo="curto", cor_cabelo="ruivo", roupa="tunica", cor_roupa=OURO, chapeu="nenhum", orelha=False)),
    ("guarda", dict(tom=1, cabelo="curto", cor_cabelo="preto", roupa="tunica", cor_roupa=PEDRA, chapeu="capuz", orelha=False, barba=True)),
    ("padeira", dict(tom=2, cabelo="comprido", cor_cabelo="castanho", roupa="tunica", cor_roupa=PAPEL_2, chapeu="nenhum", orelha=False)),
    ("elfa", dict(tom=0, cabelo="comprido", cor_cabelo="verde", roupa="folhas", cor_roupa=VERDE, chapeu="nenhum", orelha=True)),
    ("bruxo", dict(tom=0, cabelo="comprido", cor_cabelo="azul", roupa="capa", cor_roupa=ROXO, chapeu="pontudo", orelha=True)),
]


def pintar(im, cor):
    saida = im.copy()
    p = saida.load()
    for y in range(saida.height):
        for x in range(saida.width):
            r, g, b, a = p[x, y]
            if not a or (r, g, b) == TINTA or (r, g, b) == TINTA_2:
                continue
            k = r / 255
            p[x, y] = (int(cor[0] * k), int(cor[1] * k), int(cor[2] * k), a)
    return saida


def npc_pronto(**kw):
    """Um NPC ja achatado numa folha so, porque NPC nao troca de roupa em runtime."""
    tom = kw.get("tom", 0)
    base = folha(corpo, tom=tom, orelha_pontuda=kw.get("orelha", False))
    saida = Image.new("RGBA", base.size, (0, 0, 0, 0))
    saida.alpha_composite(base)
    saida.alpha_composite(pintar(folha(roupa, estilo=kw.get("roupa", "tunica")), kw.get("cor_roupa", VERDE)))
    saida.alpha_composite(
        pintar(folha(cabelo, estilo=kw.get("cabelo", "curto")), CABELO_TONS[kw.get("cor_cabelo", "castanho")])
    )
    if kw.get("chapeu", "nenhum") != "nenhum":
        saida.alpha_composite(pintar(folha(chapeu, tipo=kw["chapeu"]), kw.get("cor_chapeu", MADEIRA)))
    saida.alpha_composite(folha(bracos, tom=tom))
    return saida


# ----------------------------------------------------------------- goblin
def goblin_corpo(direcao, coluna):
    im = nova()
    perna, sobe, _ = deslocamento(coluna)
    topo = 4 + sobe
    ret(im, 3, topo, 10, 12, GOBLIN)
    ret(im, 4, topo, 8, 1, GOBLIN_C)
    ret(im, 3, topo + 10, 10, 2, GOBLIN_E)
    ret(im, 12, topo + 2, 1, 9, GOBLIN_E)
    if direcao != "cima":
        pontos(im, [(2, topo + 5), (1, topo + 4), (2, topo + 6),
                    (13, topo + 5), (14, topo + 4), (13, topo + 6)], GOBLIN_C)
        ret(im, 5, topo + 6, 2, 3, PAPEL)
        ret(im, 9, topo + 6, 2, 3, PAPEL)
        px(im, 6, topo + 7, TINTA); px(im, 10, topo + 7, TINTA)
        ret(im, 6, topo + 10, 4, 1, TINTA_2)
        px(im, 6, topo + 9, PAPEL); px(im, 9, topo + 9, PAPEL)
    ret(im, 4, topo + 13, 8, 8, GOBLIN_E)
    ret(im, 5, topo + 13, 2, 4, GOBLIN)
    base_perna = 25 + sobe
    ret(im, 5, base_perna, 2, 3 + perna, GOBLIN)
    ret(im, 9, base_perna, 2, 3 - perna, GOBLIN)
    ret(im, 4, base_perna + 3 + perna, 4, 2, GOBLIN_E)
    ret(im, 8, base_perna + 3 - perna, 4, 2, GOBLIN_E)
    contorno_seletivo(im, TINTA, TINTA_2)
    sombra_chao(im, 5)
    return im


def goblin_pronto():
    base = folha(goblin_corpo)
    saida = Image.new("RGBA", base.size, (0, 0, 0, 0))
    saida.alpha_composite(base)
    saida.alpha_composite(pintar(folha(chapeu, tipo="capuz"), PEDRA))
    saida.alpha_composite(folha(bracos, tom=2))
    return saida


# ------------------------------------------------------------------ saida
def gerar(saida, a_mao=None):
    def guardar(nome, im):
        ((a_mao(nome) if a_mao else None) or im).save(os.path.join(saida, nome + ".png"))

    # heroi em camadas, porque o jogador escolhe tudo
    for i in range(len(PELE_TONS)):
        guardar(f"heroi-corpo-{i}", folha(corpo, tom=i))
        guardar(f"heroi-bracos-{i}", folha(bracos, tom=i))
    for estilo in ESTILOS_CABELO:
        guardar(f"heroi-cabelo-{estilo}", folha(cabelo, estilo=estilo))
    for estilo in ESTILOS_ROUPA:
        guardar(f"heroi-roupa-{estilo}", folha(roupa, estilo=estilo))
    for tipo in TIPOS_CHAPEU[1:]:
        guardar(f"heroi-chapeu-{tipo}", folha(chapeu, tipo=tipo))
    for tipo in TIPOS_ARMA[1:]:
        guardar(f"heroi-arma-{tipo}", folha(arma, tipo=tipo))

    # npcs ja prontos, um por folha
    for nome, kw in NPCS:
        guardar(f"npc-{nome}", npc_pronto(**kw))
    guardar("goblin", goblin_pronto())

    return {
        "colunas": COLUNAS,
        "linhas": LINHAS,
        "tons_pele": len(PELE_TONS),
        "cabelos": ESTILOS_CABELO,
        "roupas": ESTILOS_ROUPA,
        "chapeus": TIPOS_CHAPEU,
        "armas": TIPOS_ARMA,
        "npcs": [n for n, _ in NPCS],
    }
