# -*- coding: utf-8 -*-
"""Gera a fonte de bitmap do jogo.

Por que existe: texto desenhado com fonte de sistema, mesmo sendo uma fonte de
pixel, passa pelo rasterizador do navegador e sai com meio tom nas bordas. Quando
o canvas e ampliado 3 ou 4 vezes, aquele meio tom vira borrao. Fonte de bitmap
nao tem esse problema: cada letra e um recorte de PNG, sem suavizacao nenhuma.

Saida: public/assets/fonte.png + public/assets/fonte.xml (formato BMFont, que o
Phaser le direto com this.load.bitmapFont).

A fonte base e a Silkscreen, que vem do npm em woff2. Aqui ela e rasterizada em
tamanho 8, limiarizada (todo pixel vira ligado ou desligado, nada no meio) e
empacotada num atlas. As letras saem BRANCAS de proposito, para receberem tint
com qualquer cor do jogo.
"""
import os
import sys
from PIL import Image, ImageDraw, ImageFont

RAIZ = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, RAIZ)

TAMANHO = 8          # tamanho nativo da Silkscreen, onde ela cai certinha na grade
LIMIAR = 96          # abaixo disso o pixel some, acima vira branco puro
ALTURA_LINHA = 10
ESPACO_ATLAS = 1

CARACTERES = (
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    "abcdefghijklmnopqrstuvwxyz"
    "0123456789"
    " !\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~"
    "ÁÂÃÀÉÊÍÓÔÕÚÜÇÑ"
    "áâãàéêíóôõúüçñ"
    "°ºª·"
)


def caminho_ttf():
    return os.path.join(RAIZ, "fonte", "silkscreen-400.ttf")


def glifo(fonte, ch):
    """Desenha um caractere e devolve a imagem limiarizada mais o avanco."""
    caixa = Image.new("L", (TAMANHO * 3, TAMANHO * 3), 0)
    d = ImageDraw.Draw(caixa)
    d.text((TAMANHO, TAMANHO), ch, font=fonte, fill=255)
    # limiar: nada de meio tom, e isso que tira o borrao
    dura = caixa.point(lambda v: 255 if v >= LIMIAR else 0)
    corte = dura.getbbox()
    avanco = int(round(fonte.getlength(ch)))
    if corte is None:
        return None, avanco, 0, 0
    recorte = dura.crop(corte)
    # offset em relacao a linha de base do texto
    dx = corte[0] - TAMANHO
    dy = corte[1] - TAMANHO
    branco = Image.new("RGBA", recorte.size, (255, 255, 255, 0))
    branco.putalpha(recorte)
    return branco, avanco, dx, dy


def gerar(saida, a_mao=None):
    fonte = ImageFont.truetype(caminho_ttf(), TAMANHO)
    ascent, _ = fonte.getmetrics()

    pecas = []
    for ch in CARACTERES:
        im, avanco, dx, dy = glifo(fonte, ch)
        pecas.append((ch, im, avanco, dx, dy))

    # empacota em linhas de 256 px de largura
    largura_atlas = 256
    x = y = 0
    altura_linha = 0
    posicoes = {}
    for ch, im, avanco, dx, dy in pecas:
        if im is None:
            posicoes[ch] = (0, 0, 0, 0, avanco, dx, dy)
            continue
        if x + im.width + ESPACO_ATLAS > largura_atlas:
            x = 0
            y += altura_linha + ESPACO_ATLAS
            altura_linha = 0
        posicoes[ch] = (x, y, im.width, im.height, avanco, dx, dy)
        x += im.width + ESPACO_ATLAS
        altura_linha = max(altura_linha, im.height)
    altura_atlas = y + altura_linha + ESPACO_ATLAS

    atlas = Image.new("RGBA", (largura_atlas, altura_atlas), (0, 0, 0, 0))
    for ch, im, _, _, _ in pecas:
        if im is None:
            continue
        px, py, *_ = posicoes[ch]
        atlas.paste(im, (px, py))

    pronto = (a_mao("fonte") if a_mao else None) or atlas
    pronto.save(os.path.join(saida, "fonte.png"))

    linhas = [
        '<?xml version="1.0" encoding="utf-8"?>',
        "<font>",
        f'  <info face="aurora" size="{TAMANHO}" bold="0" italic="0" charset="" unicode="1"'
        ' stretchH="100" smooth="0" aa="0" padding="0,0,0,0" spacing="1,1"/>',
        f'  <common lineHeight="{ALTURA_LINHA}" base="{ascent}" scaleW="{largura_atlas}"'
        f' scaleH="{altura_atlas}" pages="1" packed="0"/>',
        '  <pages>',
        '    <page id="0" file="fonte.png"/>',
        '  </pages>',
        f'  <chars count="{len(CARACTERES)}">',
    ]
    for ch in CARACTERES:
        px, py, w, h, avanco, dx, dy = posicoes[ch]
        # dy ja e medido a partir do topo da linha, porque o PIL desenha texto
        # ancorado no topo. Somar o ascent aqui empurraria tudo para baixo.
        yoff = dy
        linhas.append(
            f'    <char id="{ord(ch)}" x="{px}" y="{py}" width="{w}" height="{h}"'
            f' xoffset="{dx}" yoffset="{yoff}" xadvance="{avanco}" page="0" chnl="15"/>'
        )
    linhas += ["  </chars>", "</font>", ""]
    with open(os.path.join(saida, "fonte.xml"), "w", encoding="utf-8") as f:
        f.write("\n".join(linhas))

    return {"largura": largura_atlas, "altura": altura_atlas, "glifos": len(CARACTERES)}
