# -*- coding: utf-8 -*-
"""Folha de prova da fonte do jogo.

Escreve o alfabeto inteiro e umas frases de verdade, em tamanho 1x e ampliado,
para dar para olhar o desenho de perto antes de dizer que esta bom.

    python3 ferramentas/amostra-da-fonte.py
    ferramentas/telas/fonte.png
"""
import os
import sys

from PIL import Image

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(RAIZ, "arte"))

import fonte as f  # noqa: E402

PAPEL = (255, 248, 234)
TINTA = (44, 36, 64)
SUAVE = (74, 62, 100)

LINHAS = [
    ("Escolha sua raca", 2),
    ("Elfo da Folha  .  Anao da Fornalha", 1),
    ("Olhos de Coruja: voce enxerga no escuro e de bem longe.", 1),
    ("ABCDEFGHIJKLMNOPQRSTUVWXYZ", 1),
    ("abcdefghijklmnopqrstuvwxyz", 1),
    ("0123456789  +1 FORCA  3 coracoes  5 moedas", 1),
    ("Acao, magia, pocao, coracao, irmao, avo, luz!", 1),
    ("!?.,:;'\"()[]{}<>+-=/\\|@#$%&*_~ ÁÊÕÇ áêõç ºª", 1),
    ("O jogo pode simplificar, mas nao deve contradizer.", 1),
]


def escrever(destino, texto, x, y, escala, cor):
    glifos = f.desenhos()
    caneta = x
    for ch in texto:
        if ch not in glifos:
            ch = "?"
        topo, linhas = glifos[ch]
        for ly, linha in enumerate(linhas):
            for lx, c in enumerate(linha):
                if c != "#":
                    continue
                px = caneta + lx * escala
                py = y + (topo + ly) * escala
                for dy in range(escala):
                    for dx in range(escala):
                        destino.putpixel((px + dx, py + dy), cor)
        avanco = f.LARGURA_ESPACO if ch == " " else f.largura(linhas) + f.ESPACO_LETRA
        caneta += avanco * escala
    return caneta


def medir(texto):
    glifos = f.desenhos()
    total = 0
    for ch in texto:
        _, linhas = glifos.get(ch, glifos["?"])
        total += f.LARGURA_ESPACO if ch == " " else f.largura(linhas) + f.ESPACO_LETRA
    return total


def main():
    escala = 3
    margem = 8
    larg = max(medir(t) * e for t, e in LINHAS) * escala + margem * 2
    alt = margem * 2 + sum((f.ALTURA_LINHA * e + 4) * escala for t, e in LINHAS)
    im = Image.new("RGB", (larg, alt), PAPEL)
    y = margem
    for texto, tamanho in LINHAS:
        escrever(im, texto, margem, y, escala * tamanho, TINTA if tamanho > 1 else SUAVE)
        y += (f.ALTURA_LINHA * tamanho + 4) * escala
    saida = os.path.join(RAIZ, "ferramentas", "telas")
    os.makedirs(saida, exist_ok=True)
    caminho = os.path.join(saida, "fonte.png")
    im.save(caminho)
    print(caminho, im.size)


if __name__ == "__main__":
    main()
