# -*- coding: utf-8 -*-
"""Esboco do heroi redondo, inspirado em Stardew Valley e Project Zomboid.

NAO e producao. Terceira tentativa -- as duas primeiras (ver
docs/referencia/estudo-de-resolucao-heroi.png, ainda no disco) foram na
direcao ERRADA: mais resolucao (48x96) e mais precisao anatomica (cotovelo na
cintura, nariz com plano de verdade) deixaram o heroi mais REALISTA, e
realista nao e o alvo -- o Hugo apontou isso direto.

    python3 ferramentas/esbocar-heroi-redondo.py

## O que a pesquisa nas duas referencias pedidas mostra

STARDEW VALLEY usa sprite de 16 x 32 -- o MESMO tamanho que o heroi de hoje
ja usa. Isso muda a conclusao da esboco anterior: **o tamanho do quadro nunca
foi o problema**. O que Stardew faz de diferente com o mesmo espaco:

  CABECA ENORME E REDONDA. Perto de metade da altura total e uma esfera, nao
  uma cunha com canto. Corpo e perna existem so o suficiente para segurar a
  cabeca em pe.

  QUASE NENHUM DETALHE INTERNO. Olho e um ponto ou dois, cabelo e um bloco de
  cor so, sem fio por fio. O carisma vem da FORMA redonda, nao do desenho por
  dentro.

  POUCA COR. Cada material tem sombra + base (as vezes so isso, sem luz
  separada) -- exatamente o oposto da rampa de 5 tons que o esboco anterior
  tentou empurrar para dentro do heroi.

PROJECT ZOMBOID, que o CLAUDE.md deste jogo ja cita como referencia de TOM
("tom seco... nao um RPG confortavel que finge ter risco"), entra aqui pela
PALETA, nao pela forma: cor mais suja, mais terrosa, menos saturada que um
heroizinho fofo -- e assim que o "seco" aparece sem precisar de anatomia
realista nenhuma.

## Onde o corpo flexiona, e onde ele NAO precisa flexionar

A pergunta certa nao e "cotovelo, joelho, quantos pontos" -- nesta escala e
neste estilo, so DOIS pontos cargam a locomocao inteira:

  OMBRO. O braco inteiro balanca como UMA peca rigida, pendurada no ombro,
  igual ponteiro de relogio. Nao existe cotovelo dobrando durante o andar.

  QUADRIL. A perna inteira balanca como UMA peca rigida, pendurada no
  quadril. Nao existe joelho dobrando durante o andar.

  COTOVELO e JOELHO so aparecem como pose ESPECIAL desenhada a mao (golpe,
  agachar, sentar) -- nunca como parte do ciclo de andar. E por isso que o
  esboco anterior, tentando fazer o braco dobrar fisicamente certo o tempo
  todo, ficou pesado: estava resolvendo um problema que este estilo de jogo
  nao tem.

Ver `docs/referencia/esboco-heroi-pivos.png` para o diagrama dos dois pivos.
"""
import os
import sys

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(RAIZ, "arte"))
from base import *  # noqa
from paleta import rampa  # noqa
import pessoa  # noqa
from PIL import Image, ImageDraw

L, A = 16, 32
CX = L // 2
CHAO = 30

# ------------------------------------------------------- paleta, poucos tons
# pele: a MESMA rampa de producao (arte/paleta.py), so 3 tons -- nao inventa
# paleta nova, usa a que o jogo ja tem.
PELE_S, PELE_B, PELE_L = rampa((236, 198, 162))

# tunica: puxada para o terroso/dessaturado (a leitura "seca" de Project
# Zomboid), nao o azul vivo de heroi de conto de fadas
TUNICA_S, TUNICA_B, TUNICA_L = rampa((122, 118, 96), forca=46)
BOTA_S, BOTA_B, _ = rampa((92, 76, 60), forca=40)
CABELO_S, CABELO_B, CABELO_L = rampa((120, 82, 52), forca=50)


def _bloco_redondo(im, x, y, w, h, cor, cantos=True):
    """Retangulo com os 4 cantos cortados -- o truque mais barato contra
    'parece caixa colada'. Board redondo, nao poligono."""
    ret(im, x, y, w, h, cor)
    if cantos and w > 2 and h > 2:
        apagar(im, x, y)
        apagar(im, x + w - 1, y)
        apagar(im, x, y + h - 1)
        apagar(im, x + w - 1, y + h - 1)


def _esfera(im, cx, cy, rx, ry, escuro, base, claro):
    """Esfera sombreada em 3 bandas diagonais -- luz vindo de cima-esquerda.
    E o jeito mais barato de ficar redondo E parecer volumoso ao mesmo tempo."""
    for y in range(cy - ry, cy + ry + 1):
        for x in range(cx - rx, cx + rx + 1):
            ndx = (x - cx) / max(rx, 0.01)
            ndy = (y - cy) / max(ry, 0.01)
            if ndx * ndx + ndy * ndy <= 1.0:
                if ndx + ndy > 0.5:
                    cor = escuro
                elif ndx + ndy < -0.65:
                    cor = claro
                else:
                    cor = base
                px(im, x, y, cor)


def heroi16(direcao, coluna="parado"):
    im = nova(L, A)
    perfil = direcao in ("esquerda", "direita")
    lado = -1 if direcao == "esquerda" else 1
    bal, sobe, braco_bal = deslocamento(coluna)

    # --------------------------------------------------------------- pernas
    # UM pivo (quadril): a perna inteira desloca em bloco, sem segmento de
    # joelho -- e assim que o andar de Stardew funciona com 3 quadros so.
    perna_y = CHAO - 6
    for lx, d in ((-2, bal), (2, -bal)):
        dx = d if not perfil else (d if lx == lado * 2 or not perfil else d // 2)
        px_x = CX + lx + dx - 1
        _bloco_redondo(im, px_x, perna_y + sobe, 3, 5, PELE_B, cantos=False)
        _bloco_redondo(im, px_x, perna_y + 4 + sobe, 3, 2, BOTA_B)
        px(im, px_x, perna_y + 4 + sobe, BOTA_S)

    # --------------------------------------------------------------- tronco
    tronco_y = perna_y - 9 + sobe
    _bloco_redondo(im, CX - 5, tronco_y, 10, 9, TUNICA_B)
    ret(im, CX - 5, tronco_y, 10 - (2 if perfil else 0), 1, TUNICA_L)
    ret(im, CX - 5, tronco_y + 7, 10, 2, TUNICA_S)   # a base da tunica, na sombra

    # ---------------------------------------------------------------- bracos
    # UM pivo (ombro): o braco inteiro balanca como ponteiro, sem cotovelo.
    for lx, bb in ((-6, braco_bal), (6, -braco_bal)):
        by = tronco_y + 1 + (bb if abs(bb) == 1 else 0)
        _bloco_redondo(im, CX + lx, by, 3, 6, PELE_S if lx < 0 and perfil else PELE_B, cantos=False)

    # --------------------------------------------------------------- cabeca
    cab_y = tronco_y - 6
    _esfera(im, CX, cab_y, 6, 6, PELE_S, PELE_B, PELE_L)
    # cabelo: uma calota so, sem fio -- carisma vem da forma, nao do detalhe
    for y in range(cab_y - 6, cab_y - 6 + 3):
        larg = 13 - (y - (cab_y - 6)) * 2
        ret(im, CX - larg // 2, y, larg, 1, CABELO_B)
    ret(im, CX - 5, cab_y - 6, 3, 1, CABELO_L)

    if direcao != "cima" and coluna != "derrota":
        if perfil:
            px(im, CX + lado * 5, cab_y, TINTA)                  # UM olho, um pixel
            px(im, CX + lado * 6, cab_y + 1, PELE_S)              # nariz, um degrau so
        else:
            px(im, CX - 3, cab_y, TINTA)
            px(im, CX + 2, cab_y, TINTA)
        ret(im, CX - 2, cab_y + 3, 4, 1, (200, 130, 118))          # bochecha, nao boca --
        # mais barato que desenhar boca em 1 px e ainda da calor a cara

    luz_de_cima(im, [PELE_B, PELE_S, TUNICA_B, TUNICA_S], PELE_L)
    contorno_seletivo(im, TINTA, TINTA_2)

    for i in range(CX - 6, CX + 6):
        if 0 <= CHAO + 1 < A and im.getpixel((i, CHAO + 1))[3] == 0:
            px(im, i, CHAO + 1, (36, 30, 52, 60))
    return im


def comparacao(zoom=10):
    direcoes = ["baixo", "esquerda"]
    larg_col = L + 3
    fora = Image.new("RGBA", (larg_col * len(direcoes), A * 2 + 4), (86, 122, 92, 255))
    for i, direcao in enumerate(direcoes):
        corpo_im = pessoa.corpo(direcao, "parado", tom=0, raca="vale")
        bracos_im = pessoa.bracos(direcao, "parado", tom=0, raca="vale")
        hoje = Image.new("RGBA", (16, 32), (0, 0, 0, 0))
        hoje.alpha_composite(corpo_im)
        hoje.alpha_composite(bracos_im)
        fora.alpha_composite(hoje, (i * larg_col, 0))
        fora.alpha_composite(heroi16(direcao), (i * larg_col, A + 4))
    return fora.resize((fora.width * zoom, fora.height * zoom), Image.NEAREST)


def diagrama_pivos():
    """Nao e pixel art -- e diagrama tecnico, com texto, para mostrar onde o
    corpo de fato flexiona neste estilo (so 2 pontos) contra onde um
    personagem realista flexionaria (6 pontos) e por que a diferenca importa."""
    W, H = 700, 460
    im = Image.new("RGBA", (W, H), (245, 242, 235, 255))
    d = ImageDraw.Draw(im)

    def boneco(x0, pivos_ativos, titulo):
        cor_osso = (60, 60, 80)
        cor_ativo = (46, 140, 90)
        cor_opcional = (190, 150, 40)
        ombro = (x0, 120)
        quadril = (x0, 230)
        cotovelo = (x0 - 35, 175)
        pulso = (x0 - 55, 225)
        joelho = (x0 - 15, 300)
        tornozelo = (x0 - 15, 370)
        outro_ombro = (x0 + 10, 120)
        outro_quadril = (x0 + 10, 230)
        d.ellipse([x0 - 30, 40, x0 + 40, 110], outline=cor_osso, width=3)
        d.line([ombro, outro_ombro], fill=cor_osso, width=3)
        d.line([ombro, quadril], fill=cor_osso, width=3)
        d.line([quadril, outro_quadril], fill=cor_osso, width=3)
        d.line([ombro, cotovelo], fill=cor_osso, width=5)
        d.line([cotovelo, pulso], fill=cor_osso, width=5)
        d.line([quadril, joelho], fill=cor_osso, width=6)
        d.line([joelho, tornozelo], fill=cor_osso, width=6)

        def ponto(p, ativo, label):
            cor = cor_ativo if ativo else cor_opcional
            r = 9
            d.ellipse([p[0] - r, p[1] - r, p[0] + r, p[1] + r], fill=cor)
            d.text((p[0] + 12, p[1] - 8), label, fill=(20, 20, 20))

        ponto(ombro, "ombro" in pivos_ativos, "ombro" if "ombro" in pivos_ativos else "ombro (fixo)")
        ponto(quadril, "quadril" in pivos_ativos, "quadril" if "quadril" in pivos_ativos else "quadril (fixo)")
        ponto(cotovelo, "cotovelo" in pivos_ativos, "cotovelo (so pose especial)")
        ponto(joelho, "joelho" in pivos_ativos, "joelho (so pose especial)")
        d.text((x0 - 45, 400), titulo, fill=(20, 20, 20))

    boneco(200, {"ombro", "quadril"}, "ANDAR / IDLE -- so 2 pivos, o resto e peca rigida")
    boneco(500, {"ombro", "quadril", "cotovelo", "joelho"}, "GOLPE / AGACHAR -- pose especial, desenhada a mao")

    d.text((30, 20), "Verde = pivo que MOVE nesta acao.  Amarelo = existe, mas fica parado.", fill=(20, 20, 20))
    return im


if __name__ == "__main__":
    d1 = os.path.join(RAIZ, "docs", "referencia", "estudo-de-resolucao-heroi-redondo.png")
    comparacao().save(d1)
    print("escrito: docs/referencia/estudo-de-resolucao-heroi-redondo.png")
    d2 = os.path.join(RAIZ, "docs", "referencia", "esboco-heroi-pivos.png")
    diagrama_pivos().save(d2)
    print("escrito: docs/referencia/esboco-heroi-pivos.png")
