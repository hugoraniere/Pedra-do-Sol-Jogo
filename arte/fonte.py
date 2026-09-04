# -*- coding: utf-8 -*-
"""A fonte do Reino de Aurora, desenhada pixel por pixel aqui dentro.

Por que ela e desenhada, e nao rasterizada de um .ttf:

A fonte anterior era a Silkscreen, rasterizada em 8 px. Ela tem dois defeitos que
nao davam para consertar de fora. Primeiro, ela NAO TEM MINUSCULA: "a" e "A" sao o
mesmo desenho, entao toda frase do jogo saia gritada, e frase gritada e mais lenta
de ler porque some a silhueta da palavra. Segundo, ela e monoespacada e larga
(4 px de tinta e 2 px de ar por letra), entao um titulo curto atravessava a tela
inteira e ainda parecia esparramado.

Esta fonte tem minuscula de verdade, com haste alta e perna que desce, e e
proporcional: o "i" ocupa 2 px e o "m" ocupa 6. A mesma frase fica cerca de um
terco mais curta e bem mais rapida de ler.

A grade, contada a partir do topo da linha:

    linha 1        acento de maiuscula (Á, Ê, Õ)
    linhas 2 a 7   altura de maiuscula, 6 px
    linhas 4 a 7   altura de minuscula, 4 px
    linha 7        ultima linha em cima da base
    linhas 8 e 9   perna que desce (g, p, y) e cedilha
    altura de linha 10

A tinta ocupa a linha inteira DE PROPOSITO, centrada nos 10 px: com a maiuscula
em cima e a perna do "g" embaixo, o meio da caixa e o meio optico do texto. Foi
o que deixou o jogo apagar a correcao de centro que a fonte anterior exigia, e
com ela o rotulo de botao deixou de empurrar a propria caixa para fora da linha.

Saida: public/assets/fonte.png + public/assets/fonte.xml, no formato BMFont, que
o Phaser le direto com this.load.bitmapFont. As letras saem BRANCAS de proposito,
para receberem tint com qualquer cor da paleta.

Para conferir o desenho a olho:  python3 ferramentas/amostra-da-fonte.py
"""
import os

from PIL import Image

TAMANHO = 8  # o "size" que o jogo pede em texto(): 8 e o tamanho nativo
BASE = 8  # linhas acima da linha de base
ALTURA_LINHA = 10
ESPACO_ATLAS = 1
ESPACO_LETRA = 1  # ar entre uma letra e a proxima
LARGURA_ESPACO = 3  # o avanco da barra de espaco

MAIUSCULA = 2  # linha em que comeca a maiuscula
MINUSCULA = 4  # linha em que comeca a minuscula
DESCE = 8  # primeira linha abaixo da base

# ---------------------------------------------------------------- maiusculas
# Seis linhas de altura, cinco de largura na maioria. Comecam na linha 2.
MAIUSCULAS = {
    "A": [".###.", "#...#", "#...#", "#####", "#...#", "#...#"],
    "B": ["####.", "#...#", "####.", "#...#", "#...#", "####."],
    "C": [".###.", "#...#", "#....", "#....", "#...#", ".###."],
    "D": ["####.", "#...#", "#...#", "#...#", "#...#", "####."],
    "E": ["#####", "#....", "####.", "#....", "#....", "#####"],
    "F": ["#####", "#....", "####.", "#....", "#....", "#...."],
    "G": [".###.", "#...#", "#....", "#..##", "#...#", ".###."],
    "H": ["#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
    "I": ["###", ".#.", ".#.", ".#.", ".#.", "###"],
    "J": ["..##", "...#", "...#", "...#", "#..#", ".##."],
    "K": ["#...#", "#..#.", "###..", "#.#..", "#..#.", "#...#"],
    "L": ["#....", "#....", "#....", "#....", "#....", "#####"],
    "M": ["#...#", "##.##", "#.#.#", "#...#", "#...#", "#...#"],
    "N": ["#...#", "##..#", "#.#.#", "#..##", "#...#", "#...#"],
    "O": [".###.", "#...#", "#...#", "#...#", "#...#", ".###."],
    "P": ["####.", "#...#", "#...#", "####.", "#....", "#...."],
    "Q": [".###.", "#...#", "#...#", "#.#.#", "#..#.", ".##.#"],
    "R": ["####.", "#...#", "#...#", "####.", "#..#.", "#...#"],
    "S": [".####", "#....", ".###.", "....#", "#...#", ".###."],
    "T": ["#####", "..#..", "..#..", "..#..", "..#..", "..#.."],
    "U": ["#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
    "V": ["#...#", "#...#", "#...#", "#...#", ".#.#.", "..#.."],
    "W": ["#...#", "#...#", "#...#", "#.#.#", "##.##", "#...#"],
    "X": ["#...#", ".#.#.", "..#..", "..#..", ".#.#.", "#...#"],
    "Y": ["#...#", "#...#", ".#.#.", "..#..", "..#..", "..#.."],
    "Z": ["#####", "....#", "...#.", "..#..", ".#...", "#####"],
}

# Maiuscula baixinha, de cinco linhas, so para quando leva acento em cima.
# Sem isso o acento nao teria onde caber sem sair da linha.
MAIUSCULAS_BAIXAS = {
    "A": [".###.", "#...#", "#####", "#...#", "#...#"],
    "E": ["#####", "#....", "####.", "#....", "#####"],
    "I": ["###", ".#.", ".#.", ".#.", "###"],
    "O": [".###.", "#...#", "#...#", "#...#", ".###."],
    "U": ["#...#", "#...#", "#...#", "#...#", ".###."],
    "N": ["#...#", "##..#", "#.#.#", "#..##", "#...#"],
}

# ---------------------------------------------------------------- minusculas
# Quatro linhas de altura (linhas 4 a 7). Quem tem haste comeca na linha 2,
# quem tem perna desce ate a linha 9.
MINUSCULAS = {
    "a": (MINUSCULA, ["...#", ".###", "#..#", ".###"]),
    "b": (MAIUSCULA, ["#...", "#...", "###.", "#..#", "#..#", "###."]),
    "c": (MINUSCULA, [".###", "#...", "#...", ".###"]),
    "d": (MAIUSCULA, ["...#", "...#", ".###", "#..#", "#..#", ".###"]),
    "e": (MINUSCULA, [".##.", "####", "#...", ".###"]),
    "f": (MAIUSCULA, [".##", "#..", "###", "#..", "#..", "#.."]),
    "g": (MINUSCULA, [".###", "#..#", "#..#", ".###", "...#", "###."]),
    "h": (MAIUSCULA, ["#...", "#...", "###.", "#..#", "#..#", "#..#"]),
    "i": (MAIUSCULA, ["#", ".", "#", "#", "#", "#"]),
    "j": (MAIUSCULA, [".#", "..", ".#", ".#", ".#", ".#", ".#", "##"]),
    "k": (MAIUSCULA, ["#..", "#..", "#.#", "##.", "##.", "#.#"]),
    "l": (MAIUSCULA, ["#.", "#.", "#.", "#.", "#.", ".#"]),
    "m": (MINUSCULA, ["#####", "#.#.#", "#.#.#", "#.#.#"]),
    "n": (MINUSCULA, ["###.", "#..#", "#..#", "#..#"]),
    "o": (MINUSCULA, [".##.", "#..#", "#..#", ".##."]),
    "p": (MINUSCULA, ["###.", "#..#", "#..#", "###.", "#...", "#..."]),
    "q": (MINUSCULA, [".###", "#..#", "#..#", ".###", "...#", "...#"]),
    "r": (MINUSCULA, ["#.##", "##..", "#...", "#..."]),
    "s": (MINUSCULA, [".###", "##..", "..##", "###."]),
    "t": (MAIUSCULA, [".#.", "###", ".#.", ".#.", ".#.", ".##"]),
    "u": (MINUSCULA, ["#..#", "#..#", "#..#", ".###"]),
    "v": (MINUSCULA, ["#.#", "#.#", "#.#", ".#."]),
    "w": (MINUSCULA, ["#...#", "#.#.#", "#.#.#", ".#.#."]),
    "x": (MINUSCULA, ["#.#", ".#.", ".#.", "#.#"]),
    "y": (MINUSCULA, ["#..#", "#..#", "#..#", ".###", "...#", "###."]),
    "z": (MINUSCULA, ["####", "..#.", ".#..", "####"]),
}

# ------------------------------------------------------------------- numeros
# Quatro de largura, para a ficha e o placar ficarem alinhados.
NUMEROS = {
    "0": [".##.", "#..#", "#.##", "##.#", "#..#", ".##."],
    "1": [".#.", "##.", ".#.", ".#.", ".#.", "###"],
    "2": [".##.", "#..#", "...#", "..#.", ".#..", "####"],
    "3": ["###.", "...#", ".##.", "...#", "#..#", ".##."],
    "4": ["..#.", ".##.", "#.#.", "####", "..#.", "..#."],
    "5": ["####", "#...", "###.", "...#", "#..#", ".##."],
    "6": [".##.", "#...", "###.", "#..#", "#..#", ".##."],
    "7": ["####", "...#", "..#.", "..#.", ".#..", ".#.."],
    "8": [".##.", "#..#", ".##.", "#..#", "#..#", ".##."],
    "9": [".##.", "#..#", "#..#", ".###", "...#", ".##."],
}

# -------------------------------------------------------------- pontuacao
SINAIS = {
    "!": (MAIUSCULA, ["#", "#", "#", "#", ".", "#"]),
    '"': (MAIUSCULA, ["#.#", "#.#"]),
    "#": (MINUSCULA - 1, [".#.#.", "#####", ".#.#.", "#####", ".#.#."]),
    "$": (MAIUSCULA, ["..#.", ".###", "##..", "..##", "###.", ".#.."]),
    "%": (MAIUSCULA, ["##..#", "##.#.", "...#.", "..#..", ".#.##", "#..##"]),
    "&": (MAIUSCULA, [".##..", "#..#.", ".##..", "#.#.#", "#..#.", ".##.#"]),
    "'": (MAIUSCULA, ["#", "#"]),
    "(": (MAIUSCULA, [".#", "#.", "#.", "#.", "#.", ".#"]),
    ")": (MAIUSCULA, ["#.", ".#", ".#", ".#", ".#", "#."]),
    "*": (MINUSCULA - 1, ["#.#", ".#.", "#.#"]),
    "+": (MINUSCULA, [".#.", "###", ".#."]),
    ",": (DESCE - 1, [".#", "#."]),
    "-": (MINUSCULA + 1, ["###"]),
    ".": (DESCE - 1, ["#"]),
    "/": (MAIUSCULA, ["..#", "..#", ".#.", ".#.", "#..", "#.."]),
    ":": (MINUSCULA, ["#", ".", ".", "#"]),
    ";": (MINUSCULA, [".#", "..", "..", ".#", "#."]),
    "<": (MINUSCULA - 1, ["..#", ".#.", "#..", ".#.", "..#"]),
    "=": (MINUSCULA, ["###", "...", "###"]),
    ">": (MINUSCULA - 1, ["#..", ".#.", "..#", ".#.", "#.."]),
    "?": (MAIUSCULA, [".##.", "#..#", "...#", "..#.", "....", "..#."]),
    "@": (MAIUSCULA, [".###.", "#...#", "#.###", "#.#.#", "#....", ".###."]),
    "[": (MAIUSCULA, ["##", "#.", "#.", "#.", "#.", "##"]),
    "\\": (MAIUSCULA, ["#..", "#..", ".#.", ".#.", "..#", "..#"]),
    "]": (MAIUSCULA, ["##", ".#", ".#", ".#", ".#", "##"]),
    "^": (MAIUSCULA, [".#.", "#.#"]),
    "_": (DESCE, ["####"]),
    "`": (MAIUSCULA, ["#.", ".#"]),
    "{": (MAIUSCULA, [".##", ".#.", "##.", ".#.", ".#.", ".##"]),
    "|": (MAIUSCULA, ["#", "#", "#", "#", "#", "#"]),
    "}": (MAIUSCULA, ["##.", ".#.", ".##", ".#.", ".#.", "##."]),
    "~": (MINUSCULA + 1, [".##.#", "#..#."]),
    "°": (MAIUSCULA, [".#.", "#.#", ".#."]),
    "º": (MAIUSCULA, [".#.", "#.#", ".#.", "###"]),
    "ª": (MAIUSCULA, [".##", "#.#", ".##", "###"]),
    "·": (MINUSCULA + 1, ["#"]),
}

# --------------------------------------------------------------- os acentos
# Duas linhas cada, desenhados uma vez e encaixados em cima de qualquer letra.
ACENTOS = {
    "agudo": [".##", "##."],
    "grave": ["##.", ".##"],
    "circunflexo": [".#.", "#.#"],
    "til": [".##.#", "#..#."],
    "trema": ["...", "#.#"],
}

CEDILHA = [".#.", "##."]

# quem leva o que. A maiuscula acentuada usa a versao baixinha do desenho.
ACENTUADAS = {
    "Á": ("A", "agudo"), "Â": ("A", "circunflexo"), "Ã": ("A", "til"),
    "À": ("A", "grave"), "É": ("E", "agudo"), "Ê": ("E", "circunflexo"),
    "Í": ("I", "agudo"), "Ó": ("O", "agudo"), "Ô": ("O", "circunflexo"),
    "Õ": ("O", "til"), "Ú": ("U", "agudo"), "Ü": ("U", "trema"),
    "Ñ": ("N", "til"),
    "á": ("a", "agudo"), "â": ("a", "circunflexo"), "ã": ("a", "til"),
    "à": ("a", "grave"), "é": ("e", "agudo"), "ê": ("e", "circunflexo"),
    "í": ("i", "agudo"), "ó": ("o", "agudo"), "ô": ("o", "circunflexo"),
    "õ": ("o", "til"), "ú": ("u", "agudo"), "ü": ("u", "trema"),
    "ñ": ("n", "til"),
}

COM_CEDILHA = {"Ç": "C", "ç": "c"}

CARACTERES = (
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    "abcdefghijklmnopqrstuvwxyz"
    "0123456789"
    " !\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~"
    "ÁÂÃÀÉÊÍÓÔÕÚÜÇÑ"
    "áâãàéêíóôõúüçñ"
    "°ºª·"
)


# ------------------------------------------------------------------ montagem
def largura(linhas):
    return max((len(l) for l in linhas), default=0)


def centralizar(linhas, alvo):
    """Encosta um desenho estreito no meio de uma largura maior."""
    folga = (alvo - largura(linhas)) // 2
    return [" " * folga + l for l in linhas]


def juntar(cima, topo_cima, baixo, topo_baixo):
    """Empilha dois desenhos, cada um com a sua linha de inicio, num so."""
    larg = max(largura(cima), largura(baixo))
    cima = centralizar(cima, larg)
    baixo = centralizar(baixo, larg)
    topo = min(topo_cima, topo_baixo)
    fim = max(topo_cima + len(cima), topo_baixo + len(baixo))
    linhas = ["." * larg for _ in range(fim - topo)]
    for desenho, comeco in ((cima, topo_cima), (baixo, topo_baixo)):
        for i, l in enumerate(desenho):
            destino = list(linhas[comeco - topo + i])
            for x, c in enumerate(l):
                if c == "#":
                    destino[x] = "#"
            linhas[comeco - topo + i] = "".join(destino)
    return topo, linhas


def desenhos():
    """Todo o alfabeto, ja montado: char -> (linha do topo, linhas)."""
    d = {}
    for ch, linhas in MAIUSCULAS.items():
        d[ch] = (MAIUSCULA, linhas)
    for ch, linhas in NUMEROS.items():
        d[ch] = (MAIUSCULA, linhas)
    for ch, (topo, linhas) in MINUSCULAS.items():
        d[ch] = (topo, linhas)
    for ch, (topo, linhas) in SINAIS.items():
        d[ch] = (topo, linhas)

    for ch, (base, acento) in ACENTUADAS.items():
        marca = ACENTOS[acento]
        if ch.isupper():
            # a maiuscula acentuada encolhe uma linha para o acento caber
            corpo = MAIUSCULAS_BAIXAS[base]
            d[ch] = juntar(marca, MAIUSCULA - 1, corpo, MAIUSCULA + 1)
        else:
            topo, corpo = d[base]
            if base == "i":
                corpo = corpo[2:]  # o pingo sai: quem manda agora e o acento
                topo = MINUSCULA
            d[ch] = juntar(marca, MINUSCULA - 2, corpo, topo)

    for ch, base in COM_CEDILHA.items():
        topo, corpo = d[base]
        d[ch] = juntar(corpo, topo, CEDILHA, DESCE)

    d[" "] = (MAIUSCULA, [])
    return d


def imagem_do_glifo(linhas):
    """Vira o desenho em texto num PNG branco com alfa, do tamanho exato."""
    larg, alt = largura(linhas), len(linhas)
    if not larg or not alt:
        return None
    im = Image.new("RGBA", (larg, alt), (255, 255, 255, 0))
    px = im.load()
    for y, linha in enumerate(linhas):
        for x, c in enumerate(linha):
            if c == "#":
                px[x, y] = (255, 255, 255, 255)
    return im


def gerar(saida, a_mao=None):
    todos = desenhos()
    faltando = [c for c in CARACTERES if c not in todos]
    if faltando:
        raise SystemExit(f"fonte: sem desenho para {''.join(faltando)}")

    pecas = []
    for ch in CARACTERES:
        topo, linhas = todos[ch]
        im = imagem_do_glifo(linhas)
        avanco = LARGURA_ESPACO if ch == " " else largura(linhas) + ESPACO_LETRA
        pecas.append((ch, im, avanco, topo))

    # empacota em linhas de 128 px de largura
    largura_atlas = 128
    x = y = altura_linha = 0
    posicoes = {}
    for ch, im, avanco, topo in pecas:
        if im is None:
            posicoes[ch] = (0, 0, 0, 0, avanco, topo)
            continue
        if x + im.width + ESPACO_ATLAS > largura_atlas:
            x = 0
            y += altura_linha + ESPACO_ATLAS
            altura_linha = 0
        posicoes[ch] = (x, y, im.width, im.height, avanco, topo)
        x += im.width + ESPACO_ATLAS
        altura_linha = max(altura_linha, im.height)
    altura_atlas = y + altura_linha + ESPACO_ATLAS

    atlas = Image.new("RGBA", (largura_atlas, altura_atlas), (255, 255, 255, 0))
    for ch, im, _, _ in pecas:
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
        f'  <common lineHeight="{ALTURA_LINHA}" base="{BASE}" scaleW="{largura_atlas}"'
        f' scaleH="{altura_atlas}" pages="1" packed="0"/>',
        "  <pages>",
        '    <page id="0" file="fonte.png"/>',
        "  </pages>",
        f'  <chars count="{len(CARACTERES)}">',
    ]
    for ch in CARACTERES:
        px, py, w, h, avanco, topo = posicoes[ch]
        linhas.append(
            f'    <char id="{ord(ch)}" x="{px}" y="{py}" width="{w}" height="{h}"'
            f' xoffset="0" yoffset="{topo}" xadvance="{avanco}" page="0" chnl="15"/>'
        )
    linhas += ["  </chars>", "</font>", ""]
    with open(os.path.join(saida, "fonte.xml"), "w", encoding="utf-8") as f:
        f.write("\n".join(linhas))

    return {"largura": largura_atlas, "altura": altura_atlas, "glifos": len(CARACTERES)}
