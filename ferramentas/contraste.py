# -*- coding: utf-8 -*-
"""Mede o contraste do jogo em vez de opinar sobre ele.

Contraste tem numero. A razao de contraste entre duas cores vai de 1 (iguais)
a 21 (preto e branco puros), e e a mesma conta que a web usa para acessibilidade.
Os limites que adotamos aqui:

  texto:      4.5 no minimo. abaixo disso uma crianca de 7 anos le com esforco
  contorno:   3.0 no minimo contra TODO chao. Esta e a regra que mais importa,
              e demorou a ficar clara: num sprite de 16 px quem separa o
              personagem do fundo nao e a cor de dentro dele, e a linha preta
              em volta. Se o contorno some, o personagem some, por mais forte
              que seja a cor da roupa
  personagem: 2.0 contra a grama, que e o chao onde o jogo se passa. Exigir o
              mesmo contra a terra clara e contra a grama escura ao mesmo tempo
              e impossivel: um personagem de tom medio sempre vai encostar num
              dos dois. Por isso a grama manda, e o contorno cobre o resto
  cenario:    o rio e o caminho precisam saltar da grama, senao a crianca nao
              ve para onde ir nem onde nao pode entrar

Rode com:  npm run contraste
Sai com codigo 1 se algum par ficar abaixo do limite dele.
"""
import os
import sys

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(RAIZ, "arte"))

from paleta import *  # noqa


def _canal(v):
    v = v / 255
    return v / 12.92 if v <= 0.03928 else ((v + 0.055) / 1.055) ** 2.4


def luminancia(cor):
    r, g, b = cor[:3]
    return 0.2126 * _canal(r) + 0.7152 * _canal(g) + 0.0722 * _canal(b)


def razao(a, b):
    la, lb = luminancia(a), luminancia(b)
    claro, escuro = max(la, lb), min(la, lb)
    return (claro + 0.05) / (escuro + 0.05)


#: (o que, sobre o que, limite, por que importa)
PARES = [
    ("texto escuro", TINTA, "painel creme", PAPEL, 4.5,
     "todo texto de menu e de fala"),
    ("texto secundario", TINTA_2, "painel creme", PAPEL, 4.5,
     "as explicacoes e os rotulos das telas de criacao"),
    ("texto claro", PAPEL, "painel escuro", TINTA, 4.5,
     "os numeros de coracao e moeda no topo"),
    ("texto ouro", OURO, "painel escuro", TINTA, 4.5,
     "o nome do heroi no topo"),

    ("contorno", TINTA, "grama", GRAMA, 3.0,
     "o contorno e o que separa qualquer coisa do chao"),
    ("contorno", TINTA, "grama clara", GRAMA_C, 3.0, "idem, no tufo claro"),
    ("contorno", TINTA, "terra", TERRA, 3.0, "idem, no caminho"),
    ("contorno", TINTA, "areia", TERRA_C, 3.0, "idem, na areia"),
    ("contorno", TINTA, "agua", AGUA, 3.0, "idem, dentro do rio"),
    ("contorno", TINTA, "chao de caverna", PEDRA_E, 3.0, "idem, na caverna"),
    ("contorno", TINTA, "parede de caverna", PEDRA, 3.0, "idem, na parede"),

    # Medimos a LINHA DE LUZ do personagem, nao a cor de dentro dele.
    # Foi o que a primeira rodada de medicao ensinou: a pele escura em cima da
    # grama da 1,1 de razao e nao existe cor de pele escura que resolva isso
    # sem deixar de ser escura. Quem separa e a borda: contorno escuro contra
    # fundo claro, linha de luz contra fundo escuro. Ver base.luz_de_cima.
    ("luz da pele clara", PELE_TONS[0][2], "grama", GRAMA, 2.0,
     "o heroi tem que saltar do chao"),
    ("luz da pele media", PELE_TONS[1][2], "grama", GRAMA, 2.0, "idem"),
    ("luz da pele escura", PELE_TONS[2][2], "grama", GRAMA, 2.0,
     "este e o caso que quase nao passa, e o que justifica a linha de luz"),
    ("luz da escama verde", ESCAMA_TONS[0][2], "grama", GRAMA, 2.0,
     "a Cria de Dragao verde em cima de grama verde e o pior caso do jogo"),
    ("luz do goblin", GOBLIN_C, "grama", GRAMA, 2.0, "goblin verde em grama verde"),

    ("agua", AGUA, "grama", GRAMA, 2.0,
     "a beira do rio precisa ser obvia, o Lele nao sabe nadar"),
    ("caminho", TERRA, "grama", GRAMA, 1.6,
     "o caminho e a pista de para onde ir"),
]


def medir():
    linhas = []
    for nome_a, a, nome_b, b, limite, porque in PARES:
        r = razao(a, b)
        linhas.append((r >= limite, r, limite, nome_a, nome_b, porque))
    return linhas


def main():
    linhas = medir()
    ruins = [l for l in linhas if not l[0]]
    largura = max(len(f"{a} sobre {b}") for _, _, _, a, b, _ in linhas)
    print("razao de contraste, do pior para o melhor\n")
    for ok, r, limite, a, b, porque in sorted(linhas, key=lambda l: l[1]):
        marca = "  " if ok else "->"
        print(f"{marca} {f'{a} sobre {b}':<{largura}}  {r:5.2f}  minimo {limite}")
        if not ok:
            print(f"   {'':<{largura}}  {porque}")
    print()
    if ruins:
        print(f"{len(ruins)} par(es) abaixo do minimo.")
    else:
        print("todos os pares passam.")
    return 1 if ruins else 0


if __name__ == "__main__":
    raise SystemExit(main())
