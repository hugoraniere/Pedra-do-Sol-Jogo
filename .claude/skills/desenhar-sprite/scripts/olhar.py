#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Olhar um sprite de verdade, que e a unica forma de saber se ele esta bom.

Monta os quadros lado a lado sobre o fundo do jogo, amplia, e cola embaixo uma
tira no TAMANHO FISICO REAL. Escreve um PNG; abra ele com a ferramenta de
leitura de arquivo e olhe.

As duas tiras respondem perguntas diferentes, e as duas importam:

  a ampliada    o desenho esta certo? o contorno dobrou? o membro esta colado?
  a real        isso ainda le quando o jogo roda? a silhueta aguenta?

Exemplos:

  # a folha inteira de um personagem, quatro vistas
  olhar.py public/assets/goblin-magricela.png --linhas 0,1,2,3

  # os tres quadros da caminhada, de frente, com corpo e bracos juntos
  olhar.py public/assets/heroi-corpo-vale-0.png public/assets/heroi-bracos-vale-0.png \\
           --linha 0 --quadros 1,0,2

  # uma peca solta, sem grade
  olhar.py public/assets/arma-espada.png --zoom 16

  # hoje contra proposto, no mesmo tamanho fisico
  olhar.py public/assets/goblin-magricela.png --contra esboco.png --linha 0 --quadros 0
"""
import argparse
import os
import sys

try:
    from PIL import Image
except ImportError:
    sys.exit("Falta o Pillow. Rode: pip3 install Pillow  (ou use o mesmo python do npm run arte)")

#: Os fundos que importam. Julgar sobre transparencia mente: o que separa o
#: personagem do chao e o contorno, e sobre xadrez ele parece resolvido.
FUNDOS = {
    "grama": (90, 130, 70),
    "terra": (176, 134, 88),
    "pedra": (116, 128, 152),
    "escuro": (30, 26, 42),
    "claro": (238, 232, 214),
}
#: escala em que o jogo roda nas visoes mais distantes. E o teste duro: o que
#: nao le aqui nao le no jogo
ESCALA_REAL = 2


def _lista(txt):
    return [int(p) for p in txt.split(",") if p.strip() != ""] if txt else None


def _fatiar(im, largura, altura, linhas, quadros):
    """Recorta os quadros pedidos de uma folha. Sem linha nem quadro, devolve a
    imagem inteira: peca solta (arma, tile, objeto) nao tem grade."""
    if linhas is None and quadros is None:
        return [im]
    linhas = linhas if linhas is not None else [0]
    cols = im.width // largura
    quadros = quadros if quadros is not None else list(range(cols))
    saida = []
    for li in linhas:
        for ci in quadros:
            x, y = ci * largura, li * altura
            if x + largura > im.width or y + altura > im.height:
                print(f"  aviso: quadro (linha {li}, coluna {ci}) esta fora da folha "
                      f"de {im.width}x{im.height}", file=sys.stderr)
                continue
            saida.append(im.crop((x, y, x + largura, y + altura)))
    return saida


def _tira(quadros, fundo, vao, zoom):
    """Uma fileira de quadros sobre o fundo, ampliada."""
    if not quadros:
        return None
    larg = sum(q.width + vao for q in quadros) - vao
    alt = max(q.height for q in quadros)
    fora = Image.new("RGBA", (larg, alt), fundo + (255,))
    x = 0
    for q in quadros:
        fora.alpha_composite(q, (x, alt - q.height))
        x += q.width + vao
    return fora.resize((larg * zoom, alt * zoom), Image.NEAREST)


def main():
    p = argparse.ArgumentParser(
        description="Olhar um sprite ampliado e no tamanho real.",
        formatter_class=argparse.RawDescriptionHelpFormatter, epilog=__doc__)
    p.add_argument("png", nargs="+",
                   help="um ou mais PNG. Varios sao empilhados como camadas, na "
                        "ordem dada: corpo, roupa, bracos, arma")
    p.add_argument("--linha", type=int, help="linha da folha (direcao)")
    p.add_argument("--linhas", help="varias linhas, ex: 0,1,2,3")
    p.add_argument("--quadros", help="colunas, ex: 1,0,2. Sem isto, a linha inteira")
    p.add_argument("--quadro", default="16x32",
                   help="tamanho do quadro da folha (padrao 16x32)")
    p.add_argument("--contra", help="outro PNG para comparar, colado ao lado")
    p.add_argument("--fundo", default="grama", choices=sorted(FUNDOS))
    p.add_argument("--zoom", type=int, default=0, help="0 = escolhe sozinho")
    p.add_argument("--saida", help="para onde escrever (padrao: ao lado, -olhar.png)")
    a = p.parse_args()

    largura, altura = (int(v) for v in a.quadro.lower().split("x"))
    linhas = _lista(a.linhas) if a.linhas else ([a.linha] if a.linha is not None else None)
    quadros_idx = _lista(a.quadros)

    # camadas: a primeira manda no tamanho, as outras vao por cima
    base = Image.open(a.png[0]).convert("RGBA")
    for outro in a.png[1:]:
        camada = Image.open(outro).convert("RGBA")
        if camada.size != base.size:
            sys.exit(f"camada {outro} tem {camada.size}, esperado {base.size}")
        base = Image.alpha_composite(base, camada)

    quadros = _fatiar(base, largura, altura, linhas, quadros_idx)
    if a.contra:
        # o de comparacao e ampliado ate o mesmo tamanho FISICO. Sem isso a
        # comparacao so mostra que uma imagem e maior que a outra
        outro = Image.open(a.contra).convert("RGBA")
        cmp_q = _fatiar(outro, largura, altura, linhas, quadros_idx) or [outro]
        alvo_h = max(q.height for q in quadros)
        for q in cmp_q:
            if q.height != alvo_h:
                k = max(1, round(alvo_h / q.height))
                q = q.resize((q.width * k, q.height * k), Image.NEAREST)
            quadros.append(q)

    if not quadros:
        sys.exit("nenhum quadro para mostrar: confira --linha e --quadros")

    fundo = FUNDOS[a.fundo]
    larg_total = sum(q.width + 2 for q in quadros)
    zoom = a.zoom or max(4, min(20, 760 // max(larg_total, 1)))

    ampliada = _tira(quadros, fundo, 2, zoom)
    real = _tira(quadros, fundo, 2, ESCALA_REAL)

    vao = 10
    fora = Image.new("RGBA",
                     (max(ampliada.width, real.width), ampliada.height + vao + real.height),
                     fundo + (255,))
    fora.alpha_composite(ampliada, (0, 0))
    fora.alpha_composite(real, (0, ampliada.height + vao))

    destino = a.saida or os.path.splitext(a.png[0])[0] + "-olhar.png"
    fora.save(destino)
    print(f"escrito: {destino}")
    print(f"  em cima: {len(quadros)} quadro(s) a {zoom}x  ->  o desenho esta certo?")
    print(f"  embaixo: os mesmos a {ESCALA_REAL}x, o tamanho do jogo  ->  ainda le?")
    print("  agora ABRA o arquivo e olhe. Ler o codigo nao substitui isto.")


if __name__ == "__main__":
    main()
