# -*- coding: utf-8 -*-
"""Roupas, desenhadas FORA do corpo.

Antes cada roupa era pintada dentro de um quadro de 16 x 32, repetindo em cada
um dos 24 quadros a mesma conta de onde ficava o tronco e o mesmo sobe e desce
da respiracao. Vinte e quatro chances de errar um pixel, e a roupa colada numa
anatomia so.

Aqui a roupa e uma peca de roupa mesmo: um desenho pequeno, que da para olhar
sozinho e reconhecer como avental ou como armadura. O jogo pergunta a arte onde
esta o tronco naquele quadro (ver pessoa.pontos_da_raca) e pendura a peca ali.
O balanco da caminhada vem do ponto, nao do desenho.

Cada folha tem 4 colunas por 2 linhas de 16 x 20:

  colunas: 0 de frente, 1 de perfil para a esquerda, 2 de perfil para a
           direita, 3 de costas
  linhas:  0 parado, 1 no passo A, 2 no passo B. Roupa curta desenha as tres
           iguais. Roupa comprida joga a barra um pixel para cada lado, que e o
           que faz uma tunica longa parecer tecido e nao uma tabua

A linha 0 do desenho e a linha de cima do tronco. A largura do tronco muda com o
tipo de corpo, entao existe uma folha por tipo, e so por isso.

Tudo sai em BRANCO e recebe a cor escolhida por tint dentro do jogo.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from base import *  # noqa
from pessoa import CORPOS, TRONCO_ALT, _lados

LARGURA_PECA = 16
ALTURA_PECA = 20
VISTAS = ["frente", "esquerda", "direita", "costas"]
#: um por linha da folha: parado, passo A, passo B
BALANCOS = [0, -1, 1]

ESTILOS_ROUPA = [
    "tunica",      # neutra, a mais simples
    "folhas",      # neutra, barra recortada
    "cavaleiro",   # peitoral de placas com ombreira
    "mago",        # tunica longa com gola e estrela
    "cacador",     # capa curta com capuz caido e correia
    "amigo",       # colete aberto com folha no peito
    "ferreiro",    # avental de couro com alca e bolso
]

#: a classe do RPG de mesa e a roupa que o jogo veste por padrao
ROUPA_DA_CLASSE = {
    "cavaleiro": "cavaleiro",
    "mago": "mago",
    "cacador": "cacador",
    "amigo": "amigo",
    "ferreiro": "ferreiro",
}


def _nova_peca():
    return Image.new("RGBA", (LARGURA_PECA, ALTURA_PECA), VAZIO4)


def peca(vista, balanco, estilo="tunica", tipo="normal"):
    """Uma peca de roupa. y = 0 e a linha de cima do tronco."""
    im = _nova_peca()
    c = CORPOS[tipo]
    costas = vista == "costas"
    perfil = vista in ("esquerda", "direita")
    # de perfil o corpo e mais estreito: o ombro some atras do outro
    largura = c["tronco"] + (2 if c["barriga"] else 0) - (2 if perfil else 0)
    x = _lados(largura)
    alt = TRONCO_ALT + (0 if c["barriga"] else 1)
    # de perfil a luz vem sempre da frente do personagem
    frente_x = x if vista == "esquerda" else x + largura - 1

    def corpo_da_roupa(ombro=0, altura_extra=0):
        ret(im, x - ombro, 0, largura + ombro * 2, alt + altura_extra, B)
        ret(im, x + largura - 1, 0, 1, alt + altura_extra, BS)
        ret(im, x + 1, 0, 2, 3, BL)
        apagar(im, x - ombro, 0)
        apagar(im, x + largura - 1 + ombro, 0)

    def gola():
        """Recorte do pescoco. So de frente e de perfil: de costas a gola nao
        aparece, e abrir um buraco atras faz o personagem parecer decotado."""
        if costas:
            ret(im, x + 1, 0, largura - 2, 1, BS)   # so a costura do ombro
        elif perfil:
            px(im, frente_x, 0, VAZIO4)
        else:
            ret(im, 7, 0, 2, 2, VAZIO4)

    if estilo == "mago":
        # tunica longa. a barra e mais larga que o tronco e balanca: e ela que
        # da o peso do tecido quando ele anda
        ret(im, x - 1, 0, largura + 2, alt + 3, B)
        ret(im, x - 2 + balanco, alt + 3, largura + 4, 4, B)
        ret(im, x + largura + balanco, alt + 3, 2, 4, BS)
        ret(im, x + 1, 0, 2, 4, BL)
        ret(im, x + largura - 1, 0, 1, alt + 3, BS)
        apagar(im, x - 1, 0)
        apagar(im, x + largura, 0)
        gola()
        if not costas:
            ex, ey = (x + 1, 3) if not perfil else (frente_x - 1, 3)
            # a estrela de quatro pontas, o sinal do Mago da Torre
            pontos(im, [(ex + 1, ey), (ex, ey + 1), (ex + 1, ey + 1),
                        (ex + 2, ey + 1), (ex + 1, ey + 2)], BL)
        else:
            ret(im, 7, 2, 2, alt, BS)               # a costura das costas

    elif estilo == "cavaleiro":
        # peitoral de placas. a ombreira alarga a silhueta em cima, e e ela que
        # identifica o Cavaleiro de longe, antes de dar para ver o desenho
        corpo_da_roupa(ombro=1)
        ret(im, x - 1, 1, 2, 2, BL)
        ret(im, x + largura - 1, 1, 2, 2, BS)
        gola()
        ret(im, x, 3, largura, 1, BS)
        ret(im, x, 5, largura, 1, BS)
        if not costas:
            ret(im, x + largura // 2, 1, 1, alt - 1, BL)   # a quilha do peito
        ret(im, x, alt - 1, largura, 1, BS)

    elif estilo == "cacador":
        # capa curta caida nas costas, capuz dobrado no pescoco e a correia da
        # aljava atravessada no peito
        ret(im, x - 2, 0, largura + 4, alt + 2 + balanco, BS)
        apagar(im, x - 2, 0)
        apagar(im, x + largura + 1, 0)
        if not costas:
            ret(im, x, 0, largura, alt, B)
            ret(im, x + 1, 0, 2, 3, BL)
            gola()
            for k in range(alt - 2):                 # a correia, na diagonal
                px(im, x + 1 + k * (largura - 3) // max(alt - 3, 1), 1 + k, BL)
        else:
            ret(im, x - 1, 0, largura + 2, 3, B)     # o capuz dobrado, visto atras
            ret(im, x, 3, largura, alt - 1, BS)

    elif estilo == "amigo":
        # colete curto e aberto, com uma folha no peito. roupa de quem anda no
        # mato e conversa com bicho: nada de metal, nada de comprido
        corpo_da_roupa()
        gola()
        if not costas:
            if not perfil:
                ret(im, 7, 1, 2, alt - 1, BS)        # a abertura do colete
            fx = (x + largura - 4) if not perfil else (frente_x - 2)
            pontos(im, [(fx + 1, 2), (fx, 3), (fx + 1, 3), (fx + 2, 3), (fx + 1, 4)], BL)
        ret(im, x, alt - 1, largura, 1, BS)

    elif estilo == "ferreiro":
        # avental de couro: alca fina no ombro, peitilho claro e bolso na frente
        corpo_da_roupa()
        gola()
        if costas:
            # atras do avental so aparecem as alcas cruzadas
            ret(im, x + 1, 0, largura - 2, alt, BS)
            for k in range(alt - 1):
                px(im, x + 1 + k * (largura - 3) // max(alt - 2, 1), k, BL)
                px(im, x + largura - 2 - k * (largura - 3) // max(alt - 2, 1), k, BL)
        else:
            ret(im, x + 1, 0, 1, 3, BS)
            ret(im, x + largura - 2, 0, 1, 3, BS)
            ret(im, x + 1, 3, largura - 2, alt - 4, BL)
            ret(im, x + 1, 3, largura - 2, 1, BS)
            ret(im, x + 2, alt - 3, largura - 4, 2, BS)    # o bolso

    elif estilo == "folhas":
        corpo_da_roupa()
        gola()
        for k in range(x, x + largura, 2):            # a barra recortada
            px(im, k + balanco, alt, B)
            px(im, k + 1 + balanco, alt, BS)
        ret(im, x + 1, 0, largura - 2, 1, B)

    else:  # tunica
        corpo_da_roupa()
        gola()
        ret(im, x, 4, largura, 1, BS)                 # o cinto

    return contorno_seletivo(im, TINTA, TINTA_2)


def folha_de_roupa(estilo="tunica", tipo="normal"):
    """4 vistas por 3 posicoes de barra, na grade que o jogo espera."""
    im = Image.new("RGBA", (LARGURA_PECA * len(VISTAS), ALTURA_PECA * len(BALANCOS)), VAZIO4)
    for linha, balanco in enumerate(BALANCOS):
        for coluna, vista in enumerate(VISTAS):
            im.paste(peca(vista, balanco, estilo, tipo),
                     (coluna * LARGURA_PECA, linha * ALTURA_PECA))
    return im
