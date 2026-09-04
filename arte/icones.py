# -*- coding: utf-8 -*-
"""Icones do combate: retratos para a trilha de turnos, acoes para a barra, e as
seis faces do dado.

POR QUE UMA FOLHA NOVA, e nao mais icones em ui.py: ui.py pertence ao ambiente
`sprites`. Uma folha separada (public/assets/icones.png) nao encosta nele, e o
jogo carrega as duas do mesmo jeito. Ver AMBIENTE.md.

COMO OS DESENHOS SAO ESCRITOS: cada icone e um bloco de 16 linhas de 16 letras,
e a LEGENDA diz que cor e cada letra. Desenhar com putpixel e coordenada na mao
seria ilegivel e impossivel de corrigir; assim da para editar o desenho olhando
para ele. E a mesma ideia dos mapas em texto de src/dados/mapas.ts.

Toda cor sai de paleta.py. Nenhuma cor solta.
"""
import hashlib
import json
import os
import sys

from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from paleta import *  # noqa

U = 16

LEGENDA = {
    ".": VAZIO,
    "k": TINTA,
    "K": TINTA_2,
    "w": PAPEL,
    "W": BRANCO,
    "o": OURO,
    "O": OURO_E,
    "r": VERMELHO,
    "b": AZUL,
    "c": AGUA_C,
    "C": AGUA,
    "D": AGUA_E,
    "v": VERDE,
    "g": GOBLIN,
    "G": GOBLIN_C,
    "E": GOBLIN_E,
    "p": ROXO,
    "P": ROXO_C,
    "m": MADEIRA,
    "M": MADEIRA_C,
    "f": BRASA,
    "F": OURO,
    "s": PELE,
    "S": PELE_C,
    "e": PELE_E,
}

# ------------------------------------------------------------- os retratos
# Retrato e rosto, nao corpo inteiro: em 16 px, corpo inteiro vira mancha. O que
# tem que dar para reconhecer a 14 px na trilha de turnos e a SILHUETA da cabeca.

HEROI = [
    "........k.......",
    ".......kpk......",
    "......kpppk.....",
    ".....kppppPk....",
    "....kpppppPk....",
    "...kkkkkkkkkk...",
    "..k.kvvvvvvk.k..",
    "..kkvssssssvkk..",
    "...kvsWksWsvk...",
    "...kvssssssvk...",
    "....ksseessk....",
    "....ksssssk.....",
    ".....kkkkk......",
    "................",
    "................",
    "................",
]

# magricela: cabeca estreita e orelha comprida
# magricela, o batedor: cabeca alta e fina, um espigao so no topo (nao duas
# orelhas), olhos apertados e um dente torto pra fora. O dente e o que mais
# ajuda a distinguir a 16px: silhueta de boca muda, nao so a cor.
GOBLIN_MAGRICELA = [
    "................",
    ".......k........",
    "......kkkk......",
    "....kkkGGGkk....",
    "....kkkGGGkk....",
    "....kGGGGGGk....",
    "...kkGGGGGGkk...",
    "...kGkkGGkkGk...",
    "...kGGGGGGGGk...",
    "....kGggWggk....",
    "....kGkkkkGk....",
    ".....kGGGGk.....",
    "......kkkk......",
    "................",
    "................",
    "................",
]

# gorducho, o brutamontes: cabeca larga e duas presas para fora do maxilar,
# pendurando abaixo da mandibula. As presas sao a peca que nenhum outro
# goblin tem, entao a silhueta muda mesmo com o rosto parado.
GOBLIN_GORDUCHO = [
    "................",
    ".k............k.",
    ".kk..kkkkkk..kk.",
    "..kkkGGGGGGkkk..",
    "..kGGGGGGGGGGk..",
    ".kGGGGGGGGGGGGk.",
    ".kGGWkGGGGkWGGk.",
    ".kGGGGGGGGGGGGk.",
    ".kGgggggggggggk.",
    ".kGgkkkkkkkkggk.",
    "..kGgggggggggk..",
    "..kkGGGGGGGGkk..",
    "....kkkkkkkk....",
    "....W......W....",
    "................",
    "................",
]

# moleque, o pirralho: cabeca pequena e uma crista laranja, cor que nenhum
# outro goblin usa. Cor por cima de silhueta: a 16px a cor acende primeiro
# que a forma, e e a mesma licao do resto da interface (ver
# docs/interface-de-combate.md, secao 5).
GOBLIN_MOLEQUE = [
    "................",
    "........f.......",
    ".......fff......",
    "....k.fffff.k...",
    "....kffffffk....",
    "....kGGGGGGk....",
    "...kkGGGGGGkk...",
    "...kGWkGGkWGk...",
    "...kGGGGGGGGk...",
    "....kGgggggk....",
    "....kkGGGGkk....",
    ".....kkkkkk.....",
    "................",
    "................",
    "................",
    "................",
]

# chefe: coroa de osso, e o unico com marca no rosto
GOBLIN_CHEFE = [
    "....o.o..o.o....",
    "....ooooooo.....",
    "..k.kOOOOOk.k...",
    "..kk.kkkkk.kk...",
    "...kkGGGGGGkk...",
    "..kGGGGGGGGGGk..",
    "..kGGGGGGGGGGk..",
    "..kGWkGGGGkWGk..",
    "..kGGGGGGGGGGk..",
    "..kGrrGGGGGGGk..",
    "...kGgggggggk...",
    "...kGkkkkkkGk...",
    "....kGGGGGGk....",
    ".....kkkkkk.....",
    "................",
    "................",
]

# ---------------------------------------------------------- icones de acao
# A regra dos seis: cada um tem uma SILHUETA diferente. Cor ajuda, mas cor
# sozinha nao serve, porque dois deles vao ser azuis um dia.

CAJADO = [
    "................",
    "...........cc...",
    "..........cCCc..",
    "..........cCCc..",
    "...........cc...",
    "..........mm....",
    ".........mm.....",
    "........mm......",
    ".......mm.......",
    "......mm........",
    ".....mm.........",
    "....mm..........",
    "...mm...........",
    "..mM............",
    "..M.............",
    "................",
]

PUNHO = [
    "................",
    "................",
    ".....kkkkkk.....",
    "....kSSSSSSk....",
    "...kSSSSSSSSk...",
    "...kSkSkSkSSk...",
    "...kSSSSSSSSk...",
    "...kSSSSSSSSk...",
    "...kSSSSSSSSk...",
    "....kSSSSSSk....",
    "....keSSSSek....",
    ".....keeeek.....",
    "......kkkk......",
    "................",
    "................",
    "................",
]

BOLA_DE_FOGO = [
    "................",
    "................",
    ".......f........",
    "......ff.f......",
    ".....fFffff.....",
    "....fFFFFfff....",
    "...fFFooFFFff...",
    "...fFooooFFff...",
    "..fFFoooooFFf...",
    "..fFFoooooFFf...",
    "...fFFoooFFf....",
    "...ffFFFFFff....",
    "....ffffff......",
    "................",
    "................",
    "................",
]

BAFO_GELADO = [
    "................",
    "................",
    "....c...c...c...",
    "...cCc.cCc.cCc..",
    "....c...c...c...",
    "..cc..cc..cc....",
    ".cCCccCCccCCc...",
    "cCDCCCDCCCDCc...",
    ".cCCccCCccCCc...",
    "..cc..cc..cc....",
    "....c...c...c...",
    "...cCc.cCc.cCc..",
    "....c...c...c...",
    "................",
    "................",
    "................",
]

VOZ_DE_TROVAO = [
    "................",
    "........oo......",
    ".......ooo......",
    "......ooo.......",
    ".....ooo........",
    "....oooooo......",
    "...ooooooo......",
    "......ooo.......",
    ".....ooo........",
    "....ooo.........",
    "...ooo..........",
    "..ooo...........",
    "..oo............",
    "................",
    "................",
    "................",
]

SOPRO_QUENTINHO = [
    "................",
    "................",
    "..kk............",
    ".kSSk...f.f.....",
    ".kSSSk.fFfFf....",
    "kSSSSSkfFooFf...",
    "kSSkSSkFooooFf..",
    "kSSSSSffFoooooF.",
    "kSSkSSkFooooFf..",
    "kSSSSSkfFooFf...",
    ".kSSSk.fFfFf....",
    ".kSSk...f.f.....",
    "..kk............",
    "................",
    "................",
    "................",
]

RETRATOS = [
    ("retrato-heroi", HEROI),
    ("retrato-goblin-magricela", GOBLIN_MAGRICELA),
    ("retrato-goblin-gorducho", GOBLIN_GORDUCHO),
    ("retrato-goblin-moleque", GOBLIN_MOLEQUE),
    ("retrato-goblin-chefe", GOBLIN_CHEFE),
]

ACOES = [
    ("acao-cajado", CAJADO),
    ("acao-punho", PUNHO),
    ("acao-bola-de-fogo", BOLA_DE_FOGO),
    ("acao-bafo-gelado", BAFO_GELADO),
    ("acao-voz-de-trovao", VOZ_DE_TROVAO),
    ("acao-sopro-quentinho", SOPRO_QUENTINHO),
]


def do_texto(linhas):
    """Um bloco de 16 linhas de 16 letras vira uma imagem de 16x16."""
    im = Image.new("RGBA", (U, U), (0, 0, 0, 0))
    for y, linha in enumerate(linhas[:U]):
        for x, letra in enumerate(linha[:U]):
            cor = LEGENDA.get(letra, VAZIO)
            if len(cor) == 4 and cor[3] == 0:
                continue
            im.putpixel((x, y), cor if len(cor) == 4 else cor + (255,))
    return im


# ------------------------------------------------------------- as seis faces
# O dado e desenhado, nao escrito: numero em fonte de 8 px dentro de 16 px sai
# apertado, e pinta o dado le de longe, que e o que a trilha de turnos precisa.
PIPS = {
    1: [(8, 8)],
    2: [(5, 5), (11, 11)],
    3: [(5, 5), (8, 8), (11, 11)],
    4: [(5, 5), (11, 5), (5, 11), (11, 11)],
    5: [(5, 5), (11, 5), (8, 8), (5, 11), (11, 11)],
    6: [(5, 4), (11, 4), (5, 8), (11, 8), (5, 12), (11, 12)],
}


def face_do_dado(n):
    im = Image.new("RGBA", (U, U), (0, 0, 0, 0))
    # corpo do dado: quadrado de papel com contorno de tinta e canto comido
    for y in range(1, 15):
        for x in range(1, 15):
            borda = x in (1, 14) or y in (1, 14)
            canto = (x, y) in ((1, 1), (14, 1), (1, 14), (14, 14))
            if canto:
                continue
            im.putpixel((x, y), (TINTA if borda else PAPEL) + (255,))
    for (cx, cy) in PIPS[n]:
        for dy in range(2):
            for dx in range(2):
                im.putpixel((cx + dx, cy + dy), TINTA + (255,))
    return im


def gerar(saida):
    """Monta public/assets/icones.png e devolve o indice nome -> quadro."""
    itens = [(n, do_texto(d)) for n, d in RETRATOS + ACOES]
    itens += [(f"dado-{n}", face_do_dado(n)) for n in range(1, 7)]
    folha = Image.new("RGBA", (U * len(itens), U), (0, 0, 0, 0))
    for i, (_, im) in enumerate(itens):
        folha.paste(im, (i * U, 0))
    os.makedirs(saida, exist_ok=True)
    folha.save(os.path.join(saida, "icones.png"))
    return {nome: i for i, (nome, _) in enumerate(itens)}


def anotar_no_manifesto(raiz, saida):
    """Poe icones.png no arte/manifesto.json, sem regerar o resto da arte.

    O manifesto e o detector de "arte solta": PNG em disco que nao esta nele foi
    colado na mao, e o npm run verificar acusa. Rodar `npm run arte` resolveria,
    mas regeraria public/assets inteira, e docs/12-ambientes-paralelos.md diz que
    quem faz isso e uma frente so. Entao aqui a gente atualiza APENAS a propria
    entrada, reusando o hash do manifesto para nao existirem duas contas.
    """
    import manifesto as manifesto_arte

    caminho = os.path.join(raiz, "manifesto.json")
    if not os.path.exists(caminho):
        return None
    with open(caminho, encoding="utf-8") as f:
        atual = json.load(f)

    cheio = os.path.join(saida, "icones.png")
    with open(cheio, "rb") as f:
        dados = f.read()
    ficha = {"hash": hashlib.sha256(dados).hexdigest()[:16], "bytes": len(dados)}
    tam = manifesto_arte._dimensoes(cheio)
    if tam:
        ficha["largura"], ficha["altura"] = tam

    atual["arquivos"]["icones.png"] = ficha
    atual["arquivos"] = dict(sorted(atual["arquivos"].items()))
    atual["total"] = len(atual["arquivos"])
    with open(caminho, "w", encoding="utf-8") as f:
        json.dump(atual, f, indent=2, ensure_ascii=False)
        f.write("\n")
    return ficha


if __name__ == "__main__":
    raiz = os.path.dirname(os.path.abspath(__file__))
    saida = os.path.join(raiz, "..", "public", "assets")
    indice = gerar(saida)
    anotar_no_manifesto(raiz, saida)
    print("icones:", indice)
