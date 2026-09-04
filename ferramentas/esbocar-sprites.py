# -*- coding: utf-8 -*-
"""Esboco do perfil proposto em docs/estudo-de-sprites.md.

NAO e producao, e a PROVA do estudo. Nada aqui entra em public/assets: a saida
vai para docs/referencia/, ao lado das outras imagens de referencia. Quando a
proposta virar codigo, ela vira em arte/pessoa.py e este arquivo morre.

Rode com:

    python3 ferramentas/esbocar-sprites.py

Tres ideias sustentam o desenho, e as tres vieram de olhar o esboco anterior
falhar:

1. PROFUNDIDADE E TOM, NAO POSICAO. A perna de tras e o braco de tras sao
   desenhados em TINTA_2, o tom do contorno suave. Nao em tom de pele escura: a
   pele escura fica perto demais da pele clara e o olho le duas pernas irmas
   lado a lado, que e exatamente o defeito que estamos consertando. Um tom
   quase de sombra le como "isto esta atras", e ai a perna de tras pode ate
   ficar ao lado da da frente no meio da passada sem confundir ninguem.

2. A MAO E UM DEGRAU NA SILHUETA. Braco de 2 px, um pulso de 1 px em sombra, e
   a mao com 3 px. E o degrau de 1 px que faz o olho ver uma mao; sem ele o
   braco termina cego e o personagem parece ter cotos. Isso vale para as quatro
   vistas, nao so para o perfil.

3. O BRACO DA FRENTE MORA NO TRONCO. Ele nasce no ombro e desce ENCOSTADO no
   corpo, saindo no maximo 1 px na frente quando balanca. Braco desenhado solto
   na frente da barriga nao parece braco, parece bengala.
"""
import os
import sys

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(RAIZ, "arte"))
from base import *  # noqa
from pessoa import CHAO, BOTA_ALT, CABECA_ALT, TRONCO_ALT, PESCOCO

SOMBRA, PELE, LUZ = PELE_TONS[0]
#: o tom de quem esta ATRAS. e o contorno suave, nao um tom de pele
FUNDO = TINTA_2

# O esboco sai VESTIDO de proposito. Nu ele mente: braco de pele em cima de
# tronco de pele nao tem contraste nenhum, e da a impressao de que o braco
# sumiu. No jogo o tronco esta sempre coberto pela camada de roupa e o braco e
# desenhado por cima dela, entao e contra a roupa que o braco precisa aparecer.
ROUPA = VERDE
ROUPA_E = tuple(int(v * 0.7) for v in VERDE)
CALCA = (72, 66, 108)
CALCA_E = tuple(int(v * 0.75) for v in CALCA)

#: Uma tabela so para caminhada E combate. Quem desenha nao sabe se a pose e de
#: andar ou de bater: ela e sempre onde estao as duas pernas, o tronco e o braco.
#:
#:   perto/longe  x das duas pernas. "perto" e "longe" sao da CAMERA e nunca
#:                trocam: o que troca e qual das duas esta na frente na passada
#:   bob          sobe e desce do corpo. Desce quando as pernas se abrem, porque
#:                o quadril desce quando o triangulo das pernas alarga
#:   braco_x/y    onde o braco da frente esta, em relacao ao ombro
#:   arma         como a arma esta sendo segurada neste quadro
POSES = {
    "parado":   dict(perto=7, longe=6, bob=0,  braco_x=0,  braco_y=0,  arma="punho"),
    "passa":    dict(perto=7, longe=6, bob=-1, braco_x=0,  braco_y=0,  arma="punho"),
    "passo-a":  dict(perto=9, longe=4, bob=0,  braco_x=1,  braco_y=0,  arma="punho"),
    "passo-b":  dict(perto=5, longe=8, bob=0,  braco_x=-1, braco_y=0,  arma="punho"),
    # os tres quadros de combate. "prepara" e o telegrafo que o modelo de
    # combate cobra: meio segundo em que da para ver o golpe vindo
    "prepara":  dict(perto=6, longe=8, bob=0,  braco_x=-3, braco_y=-1, arma="erguida"),
    "golpe":    dict(perto=10, longe=4, bob=0, braco_x=2,  braco_y=-1, arma="estendida"),
    "guardada": dict(perto=7, longe=6, bob=0,  braco_x=-1, braco_y=0,  arma="costas"),
}
ORDEM = ["passa", "passo-a", "passa", "passo-b"]

PERNA_ALT = 5
PERNA_L = 3        # 2 px viram contorno puro depois do selout, e a perna some


def _perna_de_longe(im, x, topo):
    """A perna de tras: uma silhueta escura, sem detalhe. Ela nao compete com a
    da frente, so diz que existe uma segunda perna, e atras."""
    ret(im, x, topo, PERNA_L, PERNA_ALT, FUNDO)
    ret(im, x - 1, topo + PERNA_ALT, PERNA_L + 1, BOTA_ALT - 1, FUNDO)


def _perna_de_perto(im, x, topo):
    """A perna da frente, com calca, sombra, e o pe apontando para onde ele anda."""
    ret(im, x, topo, PERNA_L, PERNA_ALT, CALCA)
    ret(im, x + PERNA_L - 1, topo, 1, PERNA_ALT, CALCA_E)
    y = topo + PERNA_ALT
    ret(im, x - 1, y, PERNA_L + 2, BOTA_ALT, MADEIRA_E)   # o pe, comprido no eixo
    ret(im, x - 1, y, PERNA_L + 2, 1, MADEIRA)
    ret(im, x - 1, y + BOTA_ALT - 1, PERNA_L + 2, 1, TINTA_2)


def _braco_de_perto(im, x, topo):
    """Braco de 2 px, pulso de 1 px, mao de 3 px. Devolve onde a mao fecha."""
    ret(im, x, topo, 2, 4, PELE)
    ret(im, x + 1, topo, 1, 4, SOMBRA)             # a borda da frente, na sombra
    ret(im, x, topo + 4, 2, 1, SOMBRA)             # o pulso: o vinco antes da mao
    ret(im, x, topo + 5, 3, 2, PELE)               # a mao, 1 px mais larga que o braco
    ret(im, x, topo + 5, 3, 1, LUZ)
    px(im, x + 2, topo + 6, SOMBRA)                # o polegar dobrado por baixo
    return (x + 1, topo + 6)


def perfil(fase, com_arma=True):
    """Perfil olhando para a DIREITA. A esquerda e este espelhado, e e so por
    isso que a arma nunca troca de mao: existe UM desenho."""
    p = POSES[fase]
    perto, longe, bob = p["perto"], p["longe"], p["bob"]
    bal, sobe_braco, jeito = p["braco_x"], p["braco_y"], p["arma"]
    im = nova()

    bota_topo = CHAO - BOTA_ALT + 1
    perna_topo = bota_topo - PERNA_ALT + bob
    tronco_topo = perna_topo - TRONCO_ALT
    cabeca_topo = tronco_topo - PESCOCO - CABECA_ALT

    # tudo que esta ATRAS vai primeiro, e vai em FUNDO
    if com_arma and jeito == "costas":
        # a espada guardada e uma peca de TRAS: de perfil ela fica atras do
        # tronco, e so o punho aparece acima do ombro e a ponta abaixo do
        # quadril. Desenhada depois do corpo ela atravessa o peito e o rosto
        linha(im, 1, tronco_topo + 9, 4, tronco_topo + 1, PEDRA_C)
        ret(im, 3, tronco_topo, 3, 1, MADEIRA_E)           # a guarda
        px(im, 4, tronco_topo - 1, MADEIRA)                # o punho
    _perna_de_longe(im, longe, perna_topo)
    # o braco de tras so espia 1 px atras do tronco. Desenhado inteiro ele vira
    # uma coluna escura nas costas, e a 16 px isso nao le como braco: le como
    # mochila. O que precisa ficar claro e que existe um segundo braco, so isso
    if bal < 0:
        ret(im, 4, tronco_topo + 2, 2, 5, FUNDO)

    _perna_de_perto(im, perto, perna_topo)

    # ----------------------------------------------------------------- tronco
    # 6 px em vez de 8: de perfil os ombros somem e o peito vira uma faixa fina
    tr_x, tr_l = 5, 6
    ret(im, tr_x, tronco_topo, tr_l, TRONCO_ALT, PELE)
    ret(im, tr_x, tronco_topo, 1, TRONCO_ALT, SOMBRA)      # as costas, na sombra
    apagar(im, tr_x, tronco_topo)
    ret(im, 8, tronco_topo - 1, 2, 1, SOMBRA)              # o pescoco, a frente

    # ----------------------------------------------------------------- cabeca
    # nuca reta atras, rosto avancando na frente. 8 px, nao 10
    for i, (x0, larg) in enumerate(
        [(5, 6), (4, 8), (4, 8), (4, 8), (4, 8), (4, 8), (4, 8), (4, 8), (5, 7), (6, 5)]
    ):
        ret(im, x0, cabeca_topo + i, larg, 1, PELE)
    ret(im, 4, cabeca_topo + 1, 1, 7, SOMBRA)              # a nuca
    ret(im, 5, cabeca_topo, 6, 1, LUZ)
    ret(im, 6, cabeca_topo + 9, 5, 1, SOMBRA)              # o queixo, na sombra

    # ------------------------------------------------------------------ roupa
    # tunica curta, ate o quadril. no jogo ela e uma camada a parte, encaixada
    # pelo ponto do tronco; aqui e pintada junto so para o esboco nao mentir
    ret(im, tr_x, tronco_topo + 1, tr_l, TRONCO_ALT + 1, ROUPA)
    ret(im, tr_x, tronco_topo + 1, 1, TRONCO_ALT + 1, ROUPA_E)
    ret(im, tr_x, tronco_topo + TRONCO_ALT, tr_l + 1, 2, ROUPA)   # a barra
    ret(im, tr_x, tronco_topo + TRONCO_ALT + 1, tr_l + 1, 1, ROUPA_E)

    olho_y = cabeca_topo + 4
    ret(im, 9, olho_y, 2, 1, TINTA)                        # cilio
    ret(im, 9, olho_y + 1, 2, 2, BRANCO)
    ret(im, 10, olho_y + 1, 1, 2, TINTA)                   # pupila, a frente
    px(im, 12, olho_y + 1, PELE)                           # nariz, na altura do olho
    px(im, 12, olho_y + 2, SOMBRA)
    px(im, 11, cabeca_topo + 7, SOMBRA)                    # a boca
    px(im, 4, olho_y + 2, PELE)                            # UMA orelha, atras
    px(im, 3, olho_y + 2, SOMBRA)

    # ------------------------------------------------------- braco da frente
    # encostado no tronco, saindo 1 px na frente so quando balanca para a frente
    mao = _braco_de_perto(im, 8 + bal, tronco_topo + sobe_braco)

    if com_arma and jeito != "costas":
        _espada(im, jeito, mao, tronco_topo)

    luz_de_cima(im, [PELE, SOMBRA], LUZ)
    contorno_seletivo(im, TINTA, TINTA_2)
    sombra_chao(im, 6, CHAO)
    return im


def _espada(im, jeito, mao, tronco_topo):
    """A espada, nos quatro jeitos em que ela pode estar num quadro.

    A pega esta SEMPRE na mesma mao. O que muda de um jeito para o outro e para
    onde a lamina aponta, e no caso de "costas" a arma nem esta na mao: esta
    pendurada num segundo ponto de encaixe, o das costas."""
    mx, my = mao
    if jeito == "erguida":
        # o telegrafo. A lamina arma para TRAS e para baixo, nao por cima da
        # cabeca: num quadro de 16 px a lamina erguida passa por dentro do rosto
        # e o quadro deixa de ler. Para tras ela fica sozinha contra o fundo, que
        # e o que o telegrafo precisa
        ret(im, mx - 1, my, 3, 1, MADEIRA_E)
        linha(im, mx - 2, my - 1, mx - 6, my - 4, PEDRA_C)
        return
    if jeito == "estendida":
        # o golpe: a lamina sai na horizontal, na frente, exatamente onde a area
        # de impacto do modelo de combate vai ser desenhada no chao
        ret(im, mx, my - 1, 1, 3, MADEIRA_E)
        ret(im, mx + 1, my, 6, 1, PEDRA_C)
        px(im, mx + 6, my - 1, PEDRA_C)
        return
    # em punho, parado: apontada para baixo, como quem carrega andando
    ret(im, mx - 1, my + 1, 3, 1, MADEIRA_E)
    ret(im, mx, my + 2, 1, 6, PEDRA_C)


def frente():
    """A vista de frente, so o suficiente para julgar A MAO.

    De frente a mao nao pode ser mais larga que o braco para os dois lados,
    senao o boneco fica com luva de boxe. O degrau e para FORA: a mao avanca 1
    px na direcao contraria ao corpo, e o pulso em sombra faz o corte."""
    im = nova()
    bota_topo = CHAO - BOTA_ALT + 1
    perna_topo = bota_topo - 5
    tronco_topo = perna_topo - TRONCO_ALT
    cabeca_topo = tronco_topo - PESCOCO - CABECA_ALT

    for x in (5, 9):                                        # as duas pernas
        ret(im, x, perna_topo, 2, 5, CALCA)
        ret(im, x + 1, perna_topo, 1, 5, CALCA_E)
        ret(im, x - 1, perna_topo + 5, 3, BOTA_ALT, MADEIRA_E)
        ret(im, x - 1, perna_topo + 5, 3, 1, MADEIRA)

    ret(im, 4, tronco_topo, 8, TRONCO_ALT, PELE)            # tronco
    ret(im, 7, tronco_topo - 1, 2, 1, SOMBRA)               # pescoco

    for i, larg in enumerate([10, 10, 10, 10, 10, 10, 10, 10, 8, 6]):
        ret(im, (16 - larg) // 2, cabeca_topo + i, larg, 1, PELE)
    ret(im, 4, cabeca_topo, 8, 1, LUZ)
    ret(im, 4, cabeca_topo + 8, 8, 2, SOMBRA)
    olho_y = cabeca_topo + 4
    for ex in (4, 9):
        ret(im, ex, olho_y, 2, 1, TINTA)
        ret(im, ex, olho_y + 1, 2, 2, BRANCO)
        ret(im, ex + 1, olho_y + 1, 1, 2, TINTA)
    ret(im, 7, cabeca_topo + 7, 2, 1, SOMBRA)               # a boca

    ret(im, 4, tronco_topo + 1, 8, TRONCO_ALT + 1, ROUPA)   # a tunica
    ret(im, 4, tronco_topo + TRONCO_ALT, 8, 2, ROUPA)
    ret(im, 4, tronco_topo + TRONCO_ALT + 1, 8, 1, ROUPA_E)

    # os bracos, com mao. o degrau de 1 px aponta para FORA do corpo
    for x, fora in ((2, -1), (12, 1)):
        ret(im, x, tronco_topo, 2, 4, PELE)
        ret(im, x + (1 if fora > 0 else 0), tronco_topo, 1, 4, SOMBRA)
        ret(im, x, tronco_topo + 4, 2, 1, SOMBRA)           # o pulso
        mx = x + (fora if fora < 0 else 0)
        ret(im, mx, tronco_topo + 5, 3, 2, PELE)            # a mao
        ret(im, mx, tronco_topo + 5, 3, 1, LUZ)

    luz_de_cima(im, [PELE, SOMBRA], LUZ)
    contorno_seletivo(im, TINTA, TINTA_2)
    sombra_chao(im, 6, CHAO)
    return im


def _corpo_reto(im, de_costas):
    """O tronco, as pernas e a cabeca das vistas de frente e de costas.
    Uma funcao so para as duas, porque de costas o corpo humano E o de frente:
    o que muda e o rosto virar nuca."""
    bota_topo = CHAO - BOTA_ALT + 1
    perna_topo = bota_topo - 5
    tronco_topo = perna_topo - TRONCO_ALT
    cabeca_topo = tronco_topo - PESCOCO - CABECA_ALT

    for x in (5, 9):
        ret(im, x, perna_topo, 2, 5, CALCA)
        ret(im, x + 1, perna_topo, 1, 5, CALCA_E)
        ret(im, x - 1, perna_topo + 5, 3, BOTA_ALT, MADEIRA_E)
        ret(im, x - 1, perna_topo + 5, 3, 1, MADEIRA)

    ret(im, 4, tronco_topo, 8, TRONCO_ALT, PELE)
    ret(im, 7, tronco_topo - 1, 2, 1, SOMBRA)

    for i, larg in enumerate([10, 10, 10, 10, 10, 10, 10, 10, 8, 6]):
        ret(im, (16 - larg) // 2, cabeca_topo + i, larg, 1, PELE)
    ret(im, 4, cabeca_topo, 8, 1, LUZ)
    if de_costas:
        # de costas o que da forma e a nuca: a sombra na base do craneo
        ret(im, 4, cabeca_topo + CABECA_ALT - 3, 8, 1, SOMBRA)
        pontos(im, [(2, cabeca_topo + 5), (13, cabeca_topo + 5)], PELE)
    else:
        ret(im, 5, cabeca_topo + 9, 6, 1, SOMBRA)
        olho_y = cabeca_topo + 4
        for ex in (4, 9):
            ret(im, ex, olho_y, 2, 1, TINTA)
            ret(im, ex, olho_y + 1, 2, 2, BRANCO)
            ret(im, ex + 1, olho_y + 1, 1, 2, TINTA)
        ret(im, 7, cabeca_topo + 7, 2, 1, SOMBRA)
        pontos(im, [(2, cabeca_topo + 5), (13, cabeca_topo + 5)], PELE)

    ret(im, 4, tronco_topo + 1, 8, TRONCO_ALT + 1, ROUPA)
    ret(im, 4, tronco_topo + TRONCO_ALT, 8, 2, ROUPA)
    ret(im, 4, tronco_topo + TRONCO_ALT + 1, 8, 1, ROUPA_E)

    for x, fora in ((2, -1), (12, 1)):
        ret(im, x, tronco_topo, 2, 4, PELE)
        ret(im, x + (1 if fora > 0 else 0), tronco_topo, 1, 4, SOMBRA)
        ret(im, x, tronco_topo + 4, 2, 1, SOMBRA)
        mx = x + (fora if fora < 0 else 0)
        ret(im, mx, tronco_topo + 5, 3, 2, PELE)
        ret(im, mx, tronco_topo + 5, 3, 1, LUZ)
    return tronco_topo


def reto(de_costas=False, arma_nas_costas=False):
    """Vista de frente ou de costas, com a espada guardada nas costas.

    A mesma arma guardada le diferente nas duas vistas, e e de graca:

      de frente  as costas estao LONGE da camera. So o punho aparece, espiando
                 por cima do ombro. A arma vai ATRAS do corpo.
      de costas  as costas estao NA camera. A arma aparece inteira, na diagonal.
                 Ela vai NA FRENTE do corpo.

    Isso e o contrario da regra que o jogo usa hoje para a arma na mao (`atras`
    em arte/equipamento.py), e tem que ser: a mao e a arma guardada moram em
    lados opostos do corpo."""
    im = nova()
    tronco_topo = _corpo_reto(im, de_costas)
    if arma_nas_costas:
        t = tronco_topo
        if de_costas:
            # as costas estao NA camera: a arma aparece inteira, na diagonal,
            # POR CIMA do corpo
            linha(im, 4, t + 8, 11, t + 1, PEDRA_C)
        # o punho fica na ALTURA DO OMBRO, ao lado do tronco, nunca acima dele.
        # Acima do ombro ele bate na cabeca, e num quadro de 16 px a cabeca tem
        # 10 dos 16: nao sobra ceu para um punho ali
        ret(im, 12, t, 2, 2, MADEIRA_E)          # o punho
        px(im, 12, t - 1, MADEIRA)
        px(im, 13, t + 2, MADEIRA)

    luz_de_cima(im, [PELE, SOMBRA], LUZ)
    contorno_seletivo(im, TINTA, TINTA_2)
    sombra_chao(im, 6, CHAO)
    return im


def folha_de_combate(zoom=20):
    """Andar, preparar, golpear, e a arma guardada. Os quadros que o combate
    cobra e que a folha de hoje nao tem."""
    from PIL import Image
    quadros = [perfil(f) for f in ("parado", "prepara", "golpe", "guardada")]
    larg = (PW + 3) * len(quadros)
    fora = Image.new("RGBA", (larg, PH), (90, 130, 70, 255))
    for i, q in enumerate(quadros):
        fora.alpha_composite(q, (i * (PW + 3), 0))
    return fora.resize((larg * zoom, PH * zoom), Image.NEAREST)


def folha_das_armas(zoom=20):
    """A mesma espada guardada, nas tres vistas. De frente so o punho espia."""
    from PIL import Image
    quadros = [reto(False, True), reto(True, True), perfil("guardada"),
               perfil("parado")]
    larg = (PW + 3) * len(quadros)
    fora = Image.new("RGBA", (larg, PH), (90, 130, 70, 255))
    for i, q in enumerate(quadros):
        fora.alpha_composite(q, (i * (PW + 3), 0))
    return fora.resize((larg * zoom, PH * zoom), Image.NEAREST)


def folha_das_maos(zoom=22):
    """De frente e de perfil, lado a lado. E aqui que se julga a mao."""
    from PIL import Image
    P = os.path.join(RAIZ, "public", "assets") + os.sep
    hoje = Image.alpha_composite(
        Image.open(P + "heroi-corpo-vale-0.png").convert("RGBA"),
        Image.open(P + "heroi-bracos-vale-0.png").convert("RGBA"))
    quadros = [hoje.crop((0, 0, PW, PH)), frente(),
               hoje.crop((0, 2 * PH, PW, 3 * PH)), perfil("passa", com_arma=False)]
    larg = (PW + 3) * len(quadros)
    fora = Image.new("RGBA", (larg, PH), (90, 130, 70, 255))
    for i, q in enumerate(quadros):
        fora.alpha_composite(q, (i * (PW + 3), 0))
    return fora.resize((larg * zoom, PH * zoom), Image.NEAREST)


# ---------------------------------------------------------------------- armas
# As cinco armas de hoje sao barras verticais de 3 a 5 px. Duas leem (o martelo
# pela cabeca, o cajado pelo cristal) e tres nao (espada, arco, funda), porque a
# silhueta delas e a mesma: um pauzinho. Estes esbocos atacam so a SILHUETA.

def espada_nova():
    """5 x 15. O que faltava era a CRUZ: guarda larga e macaneta.

    A espada de hoje tem a guarda com a mesma largura da lamina, entao a
    silhueta e um retangulo. A cruz e o unico desenho que ninguem confunde com
    um cajado a 2 px de escala."""
    im = Image.new("RGBA", (5, 15), VAZIO4)
    ret(im, 2, 1, 1, 9, PEDRA_C)                  # lamina
    px(im, 2, 0, PEDRA_C)                         # a ponta
    ret(im, 0, 10, 5, 1, OURO)                    # a guarda: 5 px, o traco novo
    ret(im, 2, 11, 1, 3, MADEIRA_E)               # o cabo
    ret(im, 1, 14, 3, 1, OURO)                    # a macaneta
    return contorno_seletivo(im, TINTA), (2, 12)


def arco_novo():
    """6 x 15. O arco de hoje e uma linha reta: nao existe arco reto.

    A curva e a arma inteira. Sem ela nao ha arco nenhum, so um graveto com uma
    fita clara colada."""
    im = Image.new("RGBA", (7, 15), VAZIO4)
    import math
    for y in range(15):
        x = 6 - round(5 * math.sin(math.pi * y / 14))
        px(im, x, y, MADEIRA)
        if 5 <= y <= 9:
            px(im, x + 1, y, MADEIRA_E)           # espessura so no meio do arco
    ret(im, 6, 1, 1, 13, PAPEL_2)                 # a corda, entre as duas pontas
    return contorno_seletivo(im, TINTA), (2, 7)


def funda_nova():
    """5 x 12. Duas cordas e uma bolsa: um Y, nao um pauzinho.

    A funda de hoje e um cabo com um blob bege. O que faz uma funda ser funda e
    a bolsa pendurada em duas cordas, e isso cabe em 5 px."""
    im = Image.new("RGBA", (5, 12), VAZIO4)
    linha(im, 2, 0, 0, 6, PAPEL_2)                # corda da esquerda
    linha(im, 2, 0, 4, 6, PAPEL_2)                # corda da direita
    ret(im, 0, 7, 5, 3, MADEIRA)                  # a bolsa de couro
    ret(im, 1, 8, 3, 1, MADEIRA_C)
    ret(im, 0, 9, 5, 1, MADEIRA_E)
    apagar(im, 0, 7); apagar(im, 4, 7)
    return contorno_seletivo(im, TINTA), (2, 0)


def folha_das_armas_novas(zoom=12):
    """Hoje em cima, proposto embaixo. So espada, arco e funda: martelo e cajado
    ja leem, e o que nao esta quebrado nao entra na lista."""
    from PIL import Image as Im
    P = os.path.join(RAIZ, "public", "assets") + os.sep
    hoje = [Im.open(P + f"arma-{n}.png").convert("RGBA")
            for n in ("espada", "arco", "funda", "martelo", "cajado")]
    novas = [espada_nova()[0], arco_novo()[0], funda_nova()[0],
             Im.open(P + "arma-martelo.png").convert("RGBA"),
             Im.open(P + "arma-cajado.png").convert("RGBA")]
    larg = sum(max(a.width, b.width) + 4 for a, b in zip(hoje, novas))
    alt = max(max(a.height, b.height) for a, b in zip(hoje, novas))
    fora = Im.new("RGBA", (larg, alt * 2 + 4), (90, 130, 70, 255))
    x = 0
    for a, b in zip(hoje, novas):
        largura = max(a.width, b.width) + 4
        fora.alpha_composite(a, (x + (largura - 4 - a.width) // 2, alt - a.height))
        fora.alpha_composite(b, (x + (largura - 4 - b.width) // 2, alt + 4 + alt - b.height))
        x += largura
    return fora.resize((fora.width * zoom, fora.height * zoom), Im.NEAREST)


# -------------------------------------------------------------------- goblin
# O goblin de hoje e uma pilha de retangulos do mesmo verde: cabeca retangulo,
# tronco retangulo, braco retangulo, perna retangulo, e os quatro no mesmo tom.
# O que separa um do outro e so o contorno. Tres coisas consertam isso, e
# nenhuma delas e "desenhar melhor":
#
#   1. TOM SEPARA MEMBRO. Braco e perna saem em GOBLIN_E, o tronco em GOBLIN.
#      Sem isso o torso e os bracos sao uma mancha verde so.
#   2. NADA DE LADO RETO. Cabeca em cunha, tronco em barril, perna arqueada.
#      Organico a 16 px nao e curva suave: e cada linha ter largura diferente
#      da de cima.
#   3. O NARIZ TEM QUE FURAR A SILHUETA. Hoje ele e desenhado dentro do rosto,
#      um tom acima do resto, e some. A ponta dele tem que passar da linha do
#      queixo, com contorno em volta: e assim que se ve um nariz de frente.

GOB_CICLO = {
    "parado":  dict(perna_a=0, perna_b=0, bob=0,  braco=0),
    "passo-a": dict(perna_a=2, perna_b=-2, bob=1, braco=-1),
    "passo-b": dict(perna_a=-2, perna_b=2, bob=1, braco=1),
    "prepara": dict(perna_a=-1, perna_b=1, bob=0, braco=-4),
}

#: largura de cada linha da cabeca, de cima para baixo. Cunha: craneo largo,
#: queixo pontudo. E a cunha que faz o bicho nao ser gente
GOB_CABECA = [5, 7, 9, 9, 9, 8, 6, 4, 3]


def goblin_novo(fase="parado"):
    """16 x 32, ocupando a metade de baixo, como o goblin de hoje."""
    c = GOB_CICLO[fase]
    im = nova()
    PES = 29
    bob = c["bob"]
    perna_topo = PES - 2 - 4 + bob
    tronco_topo = perna_topo - 6
    cab_topo = tronco_topo - len(GOB_CABECA) + 1

    # ------------------------------------------------------------ pernas
    # arqueadas: saem do quadril e ABREM ate o pe. 3 px, porque com 2 o selout
    # come as duas colunas e a perna vira contorno puro
    for lado, desloc in ((-1, c["perna_a"]), (1, c["perna_b"])):
        quadril = 5 if lado < 0 else 9
        pe = quadril - 1 + desloc if lado < 0 else quadril + 1 + desloc
        for k in range(4):
            x = quadril + round((pe - quadril) * k / 3)
            ret(im, x, perna_topo + k, 2, 1, GOBLIN_E)
        ret(im, pe - 1, perna_topo + 4, 4, 2, GOBLIN_E)       # pe grande e chato
        ret(im, pe - 1, perna_topo + 4, 4, 1, GOBLIN)

    # ------------------------------------------------------------ tronco
    # barril: estreito no ombro, largo na barriga, estreito no quadril
    for k, larg in enumerate([6, 8, 8, 8, 7, 6]):
        ret(im, (16 - larg) // 2, tronco_topo + k, larg, 1, GOBLIN)
    ret(im, 5, tronco_topo + 1, 1, 4, GOBLIN_E)               # o vinco do lado

    # ------------------------------------------------------------ cabeca
    for k, larg in enumerate(GOB_CABECA):
        ret(im, (16 - larg) // 2, cab_topo + k, larg, 1, GOBLIN)
    ret(im, 4, cab_topo + 1, 8, 1, GOBLIN_C)                  # a luz no craneo
    ret(im, 3, cab_topo + 5, 1, 1, GOBLIN_E)
    ret(im, 12, cab_topo + 5, 1, 1, GOBLIN_E)

    # ----------------------------------------------------------- orelhas
    for lado in (-1, 1):
        bx = 3 if lado < 0 else 12
        for k in range(4):
            x = bx - k if lado < 0 else bx + k
            ret(im, x, cab_topo + 2 - k, 1, max(2, 5 - k), GOBLIN_C)
            px(im, x, cab_topo + 2 - k + max(2, 5 - k) - 1, GOBLIN_E)

    # ------------------------------------------------------------- rosto
    olho_y = cab_topo + 3
    for ex in (4, 9):
        ret(im, ex, olho_y, 3, 2, BRANCO)
        ret(im, ex + (2 if ex == 9 else 0), olho_y, 1, 2, TINTA)
    ret(im, 4, olho_y - 1, 3, 1, GOBLIN_E)                    # sobrancelha
    ret(im, 9, olho_y - 1, 3, 1, GOBLIN_E)

    # a boca vem ANTES do nariz: o nariz cai por cima dela, que e onde um nariz
    # de goblin cai mesmo
    by = cab_topo + 6
    ret(im, 4, by, 8, 2, TINTA_2)
    ret(im, 5, by + 1, 6, 1, (120, 66, 74))
    px(im, 4, by, PAPEL); px(im, 11, by, PAPEL)               # os dois dentes

    # o nariz: sai do meio do rosto, atravessa a boca, e a PONTA PASSA DO
    # QUEIXO. E o unico jeito de um nariz existir de frente a 16 px: dentro do
    # rosto ele vira uma mancha um tom acima e some
    for k, larg in enumerate([1, 2, 2, 3, 3]):
        ret(im, (16 - larg) // 2, olho_y + 2 + k, larg, 1, GOBLIN_C)
    ret(im, 7, olho_y + 7, 2, 1, GOBLIN)                      # a ponta, fora do queixo

    # ------------------------------------------------------------ bracos
    # em GOBLIN_E: e o TOM que separa o braco do tronco, nao o contorno.
    # compridos, passam do joelho, e balancam ao contrario da perna
    for lado in (-1, 1):
        bal = c["braco"] * lado
        ombro = 4 if lado < 0 else 10
        cotovelo = 2 if lado < 0 else 12
        for k in range(8):
            x = ombro if k < 3 else cotovelo
            ret(im, x, tronco_topo + 1 + k + bal, 2, 1, GOBLIN_E)
        ret(im, cotovelo, tronco_topo + 9 + bal, 2, 2, GOBLIN_C)   # a mao

    luz_de_cima(im, [GOBLIN, GOBLIN_E], GOBLIN_C)
    contorno_seletivo(im, TINTA, TINTA_2)
    sombra_chao(im, 5, PES + 1)
    return im


def folha_do_goblin(zoom=14):
    """Hoje em cima, proposto embaixo. Parado, os dois passos, e o telegrafo."""
    from PIL import Image as Im
    P = os.path.join(RAIZ, "public", "assets") + os.sep
    g = Im.open(P + "goblin-magricela.png").convert("RGBA")
    hoje = [g.crop((c * PW, 0, c * PW + PW, PH)) for c in (0, 1, 2, 4)]
    novo = [goblin_novo(f) for f in ("parado", "passo-a", "passo-b", "prepara")]
    larg = (PW + 3) * 4
    fora = Im.new("RGBA", (larg, PH * 2 + 4), (90, 130, 70, 255))
    for i, q in enumerate(hoje):
        fora.alpha_composite(q, (i * (PW + 3), 0))
    for i, q in enumerate(novo):
        fora.alpha_composite(q, (i * (PW + 3), PH + 4))
    return fora.resize((larg * zoom, (PH * 2 + 4) * zoom), Im.NEAREST)


def folha_de_hoje():
    """As quatro vistas como elas saem hoje, para o diagnostico da secao 1."""
    from PIL import Image
    P = os.path.join(RAIZ, "public", "assets") + os.sep
    atual = Image.alpha_composite(
        Image.open(P + "heroi-corpo-vale-0.png").convert("RGBA"),
        Image.open(P + "heroi-bracos-vale-0.png").convert("RGBA"))
    quatro = atual.crop((0, 0, atual.width, PH * 4))
    fundo = Image.new("RGBA", quatro.size, (90, 130, 70, 255))
    fundo.alpha_composite(quatro)
    return fundo.resize((quatro.width * 6, quatro.height * 6), Image.NEAREST)


def folha_comparativa(zoom=10):
    from PIL import Image
    P = os.path.join(RAIZ, "public", "assets") + os.sep
    atual = Image.alpha_composite(
        Image.open(P + "heroi-corpo-vale-0.png").convert("RGBA"),
        Image.open(P + "heroi-bracos-vale-0.png").convert("RGBA"))
    # linha 2 = direita, no ciclo que o jogo toca hoje
    de_hoje = [atual.crop((c * PW, 2 * PH, c * PW + PW, 3 * PH)) for c in (0, 1, 0, 2)]
    novo = [perfil(f) for f in ORDEM]

    larg = PW * 4
    fora = Image.new("RGBA", (larg, PH * 2 + 6), (90, 130, 70, 255))
    for i, q in enumerate(de_hoje):
        fora.alpha_composite(q, (i * PW, 0))
    for i, q in enumerate(novo):
        fora.alpha_composite(q, (i * PW, PH + 6))
    return fora.resize((larg * zoom, (PH * 2 + 6) * zoom), Image.NEAREST)


def folha_de_perto(zoom=22):
    """Os tres quadros unicos, grandes, sem arma. E aqui que se julga se a
    perna de tras, o braco e a mao estao lendo."""
    from PIL import Image
    quadros = [perfil(f, com_arma=False) for f in ("passa", "passo-a", "passo-b")]
    larg = (PW + 4) * len(quadros)
    fora = Image.new("RGBA", (larg, PH), (90, 130, 70, 255))
    for i, q in enumerate(quadros):
        fora.alpha_composite(q, (i * (PW + 4), 0))
    return fora.resize((larg * zoom, PH * zoom), Image.NEAREST)


if __name__ == "__main__":
    ref = os.path.join(RAIZ, "docs", "referencia")
    for nome, im in (("estudo-de-sprites-hoje.png", folha_de_hoje()),
                     ("estudo-de-sprites-perfil.png", folha_comparativa()),
                     ("estudo-de-sprites-de-perto.png", folha_de_perto()),
                     ("estudo-de-sprites-maos.png", folha_das_maos()),
                     ("estudo-de-animacao-combate.png", folha_de_combate()),
                     ("estudo-de-animacao-armas.png", folha_das_armas()),
                     ("estudo-de-armas-silhueta.png", folha_das_armas_novas()),
                     ("estudo-de-bichos-goblin.png", folha_do_goblin())):
        im.save(os.path.join(ref, nome))
        print("escrito: docs/referencia/" + nome)
