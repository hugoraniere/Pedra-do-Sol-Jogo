# -*- coding: utf-8 -*-
"""Monta uma folha com as 25 combinacoes de raca e classe, para olhar de uma vez.

Nao e teste, e olho. A conferencia automatica (npm run conferir) garante que
nenhuma peca esta faltando, mas nao tem como ela dizer se o chapeu ficou feio ou
se a espada ficou na altura errada. Para isso serve esta folha.

Rode com:  npm run folha
Saida:     ferramentas/telas/personagens.png
"""
import os
import sys

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(RAIZ, "arte"))

from PIL import Image
from base import folha, pintar, VAZIO4, PW, PH, COLUNAS, LINHAS
from paleta import CABELO_TONS, MADEIRA, PEDRA, ROXO, VERDE, OURO, TELHA, AZUL, TINTA
import pessoa
import gente

CLASSES = [
    # classe,      cabelo,      chapeu,     cor da roupa, cor do chapeu
    ("cavaleiro", "curto", "elmo", PEDRA, PEDRA),
    ("mago", "comprido", "pontudo", ROXO, AZUL),
    ("cacador", "rabo", "capuz", VERDE, MADEIRA),
    ("amigo", "cacheado", "nenhum", OURO, MADEIRA),
    ("ferreiro", "moicano", "boina", MADEIRA, TELHA),
]

#: quais quadros mostrar de cada personagem: de frente parado, andando de lado,
#: de costas, e conjurando. sao os quatro que mais mostram erro de encaixe
QUADROS = [("baixo", "parado"), ("esquerda", "passo-a"), ("cima", "parado"), ("baixo", "conjura")]

ESCALA = 4
MARGEM = 3


def montar(raca, classe, cabelo, chapeu, cor_roupa, cor_chapeu):
    dy = pessoa.desloque(pessoa.RACAS[raca]["altura"])
    base = folha(pessoa.corpo, raca=raca, tom=0)
    saida = Image.new("RGBA", base.size, VAZIO4)
    saida.alpha_composite(base)
    gente.vestir(raca, {}, gente.ROUPA_DA_CLASSE[classe], cor_roupa, None, saida)
    from base import descer
    import cabelo as cabelo_arte
    saida.alpha_composite(
        pintar(descer(folha(cabelo_arte.cabelo, estilo=cabelo), dy), CABELO_TONS["castanho"])
    )
    if chapeu != "nenhum":
        saida.alpha_composite(
            pintar(descer(folha(cabelo_arte.chapeu, tipo=chapeu), dy), cor_chapeu)
        )
    saida.alpha_composite(folha(pessoa.bracos, raca=raca, tom=0))
    gente.vestir(raca, {}, None, None, gente.ARMA_DA_CLASSE[classe], saida)
    return saida


def main():
    largura_celula = PW * len(QUADROS)
    largura = largura_celula * len(CLASSES) + MARGEM * (len(CLASSES) + 1)
    altura = PH * len(pessoa.ORDEM_RACAS) + MARGEM * (len(pessoa.ORDEM_RACAS) + 1)
    grade = Image.new("RGBA", (largura, altura), tuple(TINTA) + (255,))

    for li, raca in enumerate(pessoa.ORDEM_RACAS):
        for ci, (classe, cab, cha, cor_r, cor_c) in enumerate(CLASSES):
            pronto = montar(raca, classe, cab, cha, cor_r, cor_c)
            for k, (direcao, coluna) in enumerate(QUADROS):
                x = COLUNAS.index(coluna) * PW
                y = LINHAS.index(direcao) * PH
                q = pronto.crop((x, y, x + PW, y + PH))
                grade.paste(q, (MARGEM + ci * (largura_celula + MARGEM) + k * PW,
                                MARGEM + li * (PH + MARGEM)), q)

    destino = os.path.join(RAIZ, "ferramentas", "telas", "personagens.png")
    os.makedirs(os.path.dirname(destino), exist_ok=True)
    grade.resize((grade.width * ESCALA, grade.height * ESCALA), Image.NEAREST).save(destino)
    print("linhas: ", ", ".join(pessoa.ORDEM_RACAS))
    print("colunas:", ", ".join(c[0] for c in CLASSES))
    print("quadros por personagem:", ", ".join(f"{d} {c}" for d, c in QUADROS))
    print("salvo em", os.path.relpath(destino, RAIZ))


if __name__ == "__main__":
    main()
