# -*- coding: utf-8 -*-
"""Monta a folha do bestiario: as nove criaturas, lado a lado, com a ficha.

Nao e teste, e olho. A conferencia automatica garante que a folha existe e que
a grade bate; nao tem como ela dizer se a Serpente ficou parecendo um verme ou
se o Cavaleiro virou robo de lata. Para isso serve esta folha.

Como cada criatura tem o quadro do TAMANHO dela (16 x 32 ate 48 x 48), a folha
alinha todo mundo pelo PE. E assim que se ve a escala real: o goblin ao lado do
troll ao lado do dragao, na mesma linha de chao.

Rode com:  npm run bestiario
Saida:     ferramentas/telas/bestiario.png
"""
import os
import re
import sys

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(RAIZ, "arte"))

from PIL import Image, ImageDraw
from base import COLUNAS as COLUNAS_DA_FOLHA

ASSETS = os.path.join(RAIZ, "public", "assets")
SAIDA = os.path.join(RAIZ, "ferramentas", "telas", "bestiario.png")

PORTES = {"pequeno": (16, 32), "medio": (16, 32), "grande": (24, 40), "enorme": (48, 48)}
#: os quadros que mais mostram erro: de frente parado, andando de lado, e o
#: quadro de acao, que e onde cada criatura mostra o que ela tem de proprio
QUADROS = [("baixo", "parado"), ("baixo", "respira"), ("esquerda", "passo-a"),
           ("direita", "passo-a"), ("cima", "parado"), ("baixo", "conjura"),
           ("baixo", "tonto")]
LINHAS = ["baixo", "esquerda", "direita", "cima",
          "baixo-esquerda", "baixo-direita", "cima-esquerda", "cima-direita"]
COLUNAS = ["parado", "passo-a", "passo-b", "respira", "conjura", "tonto"]

ESCALA = 3
MARGEM = 8
FUNDO = (44, 36, 64)
TEXTO = (255, 248, 234)
APAGADO = (150, 140, 175)


def ler_bestiario():
    """Le a ficha direto de conteudo.ts. Repetir a lista aqui seria criar uma
    segunda fonte da verdade, e ela ia divergir na primeira criatura nova."""
    texto = open(os.path.join(RAIZ, "src", "dados", "conteudo.ts"), encoding="utf-8").read()
    bloco = texto[texto.index("export const BESTIARIO"):texto.index("// ---", texto.index("export const BESTIARIO"))]
    fichas = []
    for corpo in re.findall(r"\{(.*?)\n  \}", bloco, re.S):
        campo = lambda n: (re.search(n + r':\s*"([^"]*)"', corpo) or [None, ""])[1]
        num = lambda n: int((re.search(n + r":\s*(\d+)", corpo) or [0, 0])[1])
        if not campo("id"):
            continue
        fichas.append(dict(
            id=campo("id"), nome=campo("nome"), sprite=campo("sprite"),
            porte=campo("porte"), comportamento=campo("comportamento"),
            fraqueza=campo("fraqueza"), coracoes=num("coracoes"),
            velocidade=num("velocidade"),
        ))
    return fichas


def quadro(folha_im, larg, alt, direcao, coluna):
    li, ci = LINHAS.index(direcao), COLUNAS.index(coluna)
    return folha_im.crop((ci * larg, li * alt, (ci + 1) * larg, (li + 1) * alt))


def main():
    fichas = ler_bestiario()
    # o quadro de cada criatura sai do tamanho real do PNG, nao de PORTES: o
    # goblin e "pequeno" na ficha mas desenha em 48x96, resolucao propria dele.
    # `escala` reproduz `escalaDoSprite()` (config.ts): sem ela o goblin
    # apareceria do tamanho do dragao aqui, quando no mundo ele ocupa o
    # mesmo chao que qualquer criatura pequena.
    for f in fichas:
        sprite = "goblin-magricela" if f["sprite"] == "goblin" else f["sprite"]
        caminho = os.path.join(ASSETS, sprite + ".png")
        f["sprite_real"] = sprite
        f["escala"] = 16 / 48 if sprite.startswith("goblin-") else 1
        if os.path.exists(caminho):
            larg_folha, alt_folha = Image.open(caminho).size
            f["lg"], f["at"] = larg_folha // len(COLUNAS_DA_FOLHA), alt_folha // len(LINHAS)
        else:
            f["lg"], f["at"] = PORTES[f["porte"]]
    larg_max = max(f["lg"] * f["escala"] for f in fichas)
    alt_max = max(f["at"] * f["escala"] for f in fichas)
    celula_l = round((larg_max + 4) * ESCALA)
    celula_a = round((alt_max + 4) * ESCALA)
    rotulo = 46

    largura = MARGEM * 2 + 150 + celula_l * len(QUADROS)
    altura = MARGEM * 2 + (celula_a + 6) * len(fichas)
    folha = Image.new("RGBA", (largura, altura), FUNDO)
    desenho = ImageDraw.Draw(folha)

    for i, f in enumerate(fichas):
        caminho = os.path.join(ASSETS, f["sprite_real"] + ".png")
        if not os.path.exists(caminho):
            desenho.text((MARGEM, MARGEM + i * (celula_a + 6)), "FALTA " + f["sprite"], fill=(226, 72, 61))
            continue
        im = Image.open(caminho).convert("RGBA")
        lg, at, escala = f["lg"], f["at"], f["escala"]
        topo = MARGEM + i * (celula_a + 6)
        # a ficha, a esquerda
        desenho.text((MARGEM, topo + 4), f["nome"], fill=TEXTO)
        desenho.text((MARGEM, topo + 18), "%s  %s coracoes" % (f["porte"], f["coracoes"]), fill=APAGADO)
        desenho.text((MARGEM, topo + 30), "%s, %s px/s" % (f["comportamento"], f["velocidade"]), fill=APAGADO)
        desenho.text((MARGEM, topo + 42), "fraco a: " + f["fraqueza"][:28], fill=(245, 182, 43))
        for j, (direcao, coluna) in enumerate(QUADROS):
            q = quadro(im, lg, at, direcao, coluna).resize(
                (round(lg * escala * ESCALA), round(at * escala * ESCALA)), Image.NEAREST
            )
            x = MARGEM + 150 + j * celula_l + (celula_l - q.width) // 2
            # alinhado pelo PE, e nao pelo topo: e assim que a escala aparece
            y = topo + celula_a - q.height - 2
            folha.alpha_composite(q, (x, y))
        # a linha do chao, para comparar altura entre criaturas
        y = topo + celula_a - 2
        desenho.line([(MARGEM + 150, y), (largura - MARGEM, y)], fill=(74, 62, 100))

    os.makedirs(os.path.dirname(SAIDA), exist_ok=True)
    folha.save(SAIDA)
    print("bestiario: %d criaturas -> %s" % (len(fichas), os.path.relpath(SAIDA, RAIZ)))


if __name__ == "__main__":
    main()
