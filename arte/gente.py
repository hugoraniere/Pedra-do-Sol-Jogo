# -*- coding: utf-8 -*-
"""Todos os seres do jogo, montados e salvos em PNG.

Este arquivo nao desenha nada. Ele so junta o que os outros desenham:

  arte/base.py          ferramentas de desenho e a folha de 6 x 4
  arte/pessoa.py        corpo e bracos por raca, e os pontos de encaixe
  arte/roupa.py         as roupas, desenhadas fora do corpo
  arte/cabelo.py        cortes de cabelo e chapeus
  arte/equipamento.py   as armas, desenhadas sozinhas
  arte/goblin.py        os quatro goblins
  arte/aranha.py        as quatro aranhas da teia doce

Cada folha de personagem tem 6 colunas por 4 linhas de 16 x 32:

  colunas: 0 parado, 1 passo A, 2 passo B, 3 respirando, 4 conjurando, 5 tonto
  linhas:  0 baixo, 1 esquerda, 2 direita, 3 cima

POR QUE O HEROI VEM EM CAMADAS. Sao 5 racas e 5 classes, ou seja 25
personagens. Desenhar 25 folhas seria burrice: o corpo vem da raca, a roupa vem
da classe e o jogo empilha as duas na hora.

E POR QUE ROUPA E ARMA NAO SAO FOLHAS. Elas nao sao desenhadas dentro do quadro
do corpo. Sao pecas proprias, e a arte publica em encaixes.json onde fica o
tronco e onde fica a mao em cada um dos 24 quadros. O jogo pendura a peca no
ponto. Duas coisas melhoram com isso: a peca acompanha o balanco do braco sem
ninguem copiar coordenada na mao, e a mesma espada serve para o anao e para o
elfo, que tem o braco em alturas diferentes.

Sobra ainda uma folha por LARGURA DE TRONCO para a roupa (magro, normal,
gordinho), porque tecido nao estica: uma tunica de anao em cima de um elfo
ficaria larga. Cabelo e chapeu continuam folhas de 24 quadros, com uma folha so
para todas as racas, porque a cabeca tem o mesmo tamanho em todas de proposito.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from base import *  # noqa
import pessoa
import roupa as roupa_arte
import cabelo as cabelo_arte
import equipamento
import goblin as goblin_arte
import aranha as aranha_arte

from pessoa import ORDEM_RACAS
from roupa import ESTILOS_ROUPA, ROUPA_DA_CLASSE
from cabelo import ESTILOS as ESTILOS_CABELO, TIPOS_CHAPEU
from equipamento import TIPOS_ARMA, ARMA_DA_CLASSE

#: as tres larguras de tronco que a roupa precisa conhecer
TIPOS_CORPO = ["magro", "normal", "gordinho"]

#: coluna da folha do corpo -> linha da folha de roupa
LINHA_DA_ROUPA = {"parado": 0, "passo-a": 1, "passo-b": 2,
                  "respira": 0, "conjura": 0, "tonto": 0}
#: direcao -> coluna da folha de roupa
VISTA_DA_DIRECAO = {"baixo": 0, "esquerda": 1, "direita": 2, "cima": 3}


# ------------------------------------------------------------------- npcs
# A vila fica sem graca se todo mundo tiver o mesmo tamanho. Cada NPC tem raca,
# corpo e altura proprios, e alguns sao criancas.
NPCS = [
    ("vovo", dict(raca="vale", tom=1, tipo="gordinho", altura="baixo",
                  cabelo="coque", cor_cabelo="branco",
                  roupa="tunica", cor_roupa=ROXO, chapeu="nenhum")),
    ("ferreiro", dict(raca="anao", tom=1, cabelo="curto", cor_cabelo="castanho",
                      roupa="ferreiro", cor_roupa=(150, 96, 60), chapeu="nenhum",
                      arma="martelo")),
    ("menina", dict(raca="vale", tom=0, altura="crianca", tipo="magro",
                    cabelo="rabo", cor_cabelo="loiro",
                    roupa="tunica", cor_roupa=ROSA, chapeu="nenhum")),
    ("pescador", dict(raca="vale", tom=1, tipo="magro", cabelo="curto",
                      cor_cabelo="branco", barba="branco",
                      roupa="tunica", cor_roupa=AZUL, chapeu="palha")),
    ("mercador", dict(raca="vale", tom=2, tipo="gordinho", cabelo="cacheado",
                      cor_cabelo="preto", roupa="cacador", cor_roupa=VERDE,
                      chapeu="pontudo")),
    ("menino", dict(raca="pequenino", tom=0, cabelo="curto", cor_cabelo="ruivo",
                    roupa="amigo", cor_roupa=OURO, chapeu="nenhum", arma="funda")),
    ("guarda", dict(raca="vale", tom=1, tipo="gordinho", cabelo="curto",
                    cor_cabelo="preto", barba="preto",
                    roupa="cavaleiro", cor_roupa=PEDRA, chapeu="elmo", arma="espada")),
    ("padeira", dict(raca="vale", tom=2, cabelo="chanel", cor_cabelo="castanho",
                     roupa="ferreiro", cor_roupa=PAPEL_2, chapeu="nenhum")),
    ("elfa", dict(raca="elfo", tom=0, cabelo="comprido", cor_cabelo="verde",
                  roupa="folhas", cor_roupa=VERDE, chapeu="nenhum", arma="arco")),
    ("bruxo", dict(raca="elfo", tom=0, cabelo="comprido", cor_cabelo="azul",
                   roupa="mago", cor_roupa=ROXO, chapeu="pontudo", arma="cajado")),
]


def _colar(destino, peca_im, quadro, x, y):
    """Cola uma peca dentro de um quadro da folha, cortando o que passar dele.

    O corte importa: sem ele o cabo de um cajado desenhado baixo demais escorre
    para dentro do quadro de baixo, e a arma pisca no meio da caminhada."""
    li, ci = divmod(quadro, len(COLUNAS))
    li, ci = quadro // len(COLUNAS), quadro % len(COLUNAS)
    base_x, base_y = ci * PW, li * PH
    recorte = Image.new("RGBA", (PW, PH), VAZIO4)
    recorte.alpha_composite(peca_im, (x, y)) if False else None
    temp = Image.new("RGBA", (PW * 3, PH * 3), VAZIO4)
    temp.alpha_composite(peca_im, (x + PW, y + PH))
    recorte.alpha_composite(temp.crop((PW, PH, PW * 2, PH * 2)))
    destino.alpha_composite(recorte, (base_x, base_y))


def vestir(raca, tracos_extra, estilo_roupa, cor_roupa, arma, folha_base):
    """Pendura roupa e arma numa folha de corpo, quadro a quadro, usando os
    pontos de encaixe. E exatamente o que o jogo faz em tempo real: se o
    resultado aqui e no jogo divergir, um dos dois esta lendo o ponto errado."""
    saida = folha_base
    tipo = pessoa.tracos(raca, **tracos_extra)["tipo"]
    folha_roupa = roupa_arte.folha_de_roupa(estilo_roupa, tipo) if estilo_roupa else None
    folha_roupa = pintar(folha_roupa, cor_roupa) if folha_roupa and cor_roupa else folha_roupa
    desenho_arma = equipamento.DESENHOS[arma]() if arma and arma != "nenhuma" else None

    for li, direcao in enumerate(LINHAS):
        for ci, coluna in enumerate(COLUNAS):
            quadro = li * len(COLUNAS) + ci
            g = pessoa.geometria(direcao, coluna, raca, **tracos_extra)
            if folha_roupa is not None:
                vx = VISTA_DA_DIRECAO[direcao] * roupa_arte.LARGURA_PECA
                vy = LINHA_DA_ROUPA[coluna] * roupa_arte.ALTURA_PECA
                peca = folha_roupa.crop(
                    (vx, vy, vx + roupa_arte.LARGURA_PECA, vy + roupa_arte.ALTURA_PECA)
                )
                _colar(saida, peca, quadro, 0, g["tronco"][1])
            if desenho_arma is not None:
                im_arma, pega = desenho_arma
                mx, my = g["mao"]
                _colar(saida, im_arma, quadro, mx - pega[0], my - pega[1])
    return saida


def npc_pronto(**kw):
    """Um NPC ja achatado numa folha so, porque NPC nao troca de roupa em runtime.

    O cabelo e o chapeu descem o tanto que a altura dele pedir, como o jogo faz
    com o heroi. A roupa e a arma nao precisam disso: elas vao pelo ponto de
    encaixe, que ja sai na altura certa."""
    raca = kw.get("raca", "vale")
    extra = {k: kw.get(k) for k in ("tipo", "altura", "barba") if kw.get(k) is not None}
    t = pessoa.tracos(raca, **extra)
    tom = kw.get("tom", 0)
    dy = pessoa.desloque(t["altura"])

    base = folha(pessoa.corpo, tom=tom, raca=raca, **extra)
    saida = Image.new("RGBA", base.size, VAZIO4)
    saida.alpha_composite(base)

    # corpo, roupa, cabelo, chapeu, bracos, arma. o braco por cima da roupa e o
    # que deixa a manga funcionar; a arma por cima do braco e o que a poe na mao
    vestir(raca, extra, kw.get("roupa", "tunica"), kw.get("cor_roupa", VERDE), None, saida)
    saida.alpha_composite(
        pintar(descer(folha(cabelo_arte.cabelo, estilo=kw.get("cabelo", "curto")), dy),
               CABELO_TONS[kw.get("cor_cabelo", "castanho")])
    )
    if kw.get("chapeu", "nenhum") != "nenhum":
        saida.alpha_composite(
            pintar(descer(folha(cabelo_arte.chapeu, tipo=kw["chapeu"]), dy),
                   kw.get("cor_chapeu", MADEIRA))
        )
    saida.alpha_composite(folha(pessoa.bracos, tom=tom, raca=raca, **extra))
    vestir(raca, extra, None, None, kw.get("arma", "nenhuma"), saida)
    return saida


# ------------------------------------------------------------------ saida
def gerar(saida, a_mao=None):
    def guardar(nome, im):
        ((a_mao(nome) if a_mao else None) or im).save(os.path.join(saida, nome + ".png"))

    # ------ corpo e bracos: uma folha por raca e por tom
    for raca in ORDEM_RACAS:
        for i in range(len(TONS_POR_RACA.get(raca, PELE_TONS))):
            guardar(f"heroi-corpo-{raca}-{i}", folha(pessoa.corpo, tom=i, raca=raca))
            guardar(f"heroi-bracos-{raca}-{i}", folha(pessoa.bracos, tom=i, raca=raca))

    # ------ roupa: peca propria, uma folha por largura de tronco
    for tipo in TIPOS_CORPO:
        for estilo in ESTILOS_ROUPA:
            guardar(f"roupa-{tipo}-{estilo}", roupa_arte.folha_de_roupa(estilo, tipo))

    # ------ cabelo e chapeu: uma folha para todas as racas
    for estilo in ESTILOS_CABELO:
        if estilo == "careca":
            continue
        guardar(f"heroi-cabelo-{estilo}", folha(cabelo_arte.cabelo, estilo=estilo))
    for tipo in TIPOS_CHAPEU[1:]:
        guardar(f"heroi-chapeu-{tipo}", folha(cabelo_arte.chapeu, tipo=tipo))

    # ------ armas: um desenho cada, com o ponto de pega
    ficha_armas = equipamento.gerar(saida, guardar)
    pontos = {r: pessoa.pontos_da_raca(r) for r in ORDEM_RACAS}
    fora = equipamento.conferir(pontos)
    if fora:
        raise SystemExit(
            "arma saindo do quadro (encurte o desenho ou mude o ponto de pega):\n  "
            + "\n  ".join(fora)
        )

    # ------ npcs, goblins e aranhas, ja prontos, um por folha
    for nome, kw in NPCS:
        guardar(f"npc-{nome}", npc_pronto(**kw))
    for tipo in goblin_arte.TIPOS:
        guardar(f"goblin-{tipo}", folha(goblin_arte.goblin, tipo=tipo))
    guardar("goblin", folha(goblin_arte.goblin, tipo="magricela"))
    for tipo in aranha_arte.TIPOS:
        guardar(f"aranha-{tipo}", folha(aranha_arte.aranha, tipo=tipo))

    encaixes = {
        "colunas": COLUNAS,
        "linhas": LINHAS,
        "pontos": pontos,
        "armas": ficha_armas,
        "roupa": {
            "largura": roupa_arte.LARGURA_PECA,
            "altura": roupa_arte.ALTURA_PECA,
            "vistas": roupa_arte.VISTAS,
            "vistaDaDirecao": VISTA_DA_DIRECAO,
            "linhaDoQuadro": [LINHA_DA_ROUPA[c] for c in COLUNAS],
        },
    }

    indice = {
        "colunas": COLUNAS,
        "linhas": LINHAS,
        "racas": ORDEM_RACAS,
        "tipos_corpo": TIPOS_CORPO,
        "tons": {r: len(TONS_POR_RACA.get(r, PELE_TONS)) for r in ORDEM_RACAS},
        "desloque": {r: pessoa.desloque(pessoa.RACAS[r]["altura"]) for r in ORDEM_RACAS},
        "cabelos": [e for e in ESTILOS_CABELO if e != "careca"],
        "roupas": ESTILOS_ROUPA,
        "roupa_da_classe": ROUPA_DA_CLASSE,
        "arma_da_classe": ARMA_DA_CLASSE,
        "chapeus": TIPOS_CHAPEU,
        "armas": TIPOS_ARMA,
        "npcs": [n for n, _ in NPCS],
        "goblins": list(goblin_arte.TIPOS),
        "aranhas": list(aranha_arte.TIPOS),
    }
    return indice, encaixes
