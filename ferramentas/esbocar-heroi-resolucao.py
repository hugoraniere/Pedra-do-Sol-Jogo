# -*- coding: utf-8 -*-
"""Esboco do heroi em 48 x 96, com esqueleto medido e perfil de verdade.

NAO e producao. Segunda versao -- a primeira tinha o perfil quebrado (so
encolhia a largura do tronco, o que nao e como perfil funciona) e a cara
parecia envelhecida por causa da sombra pesada, nao da proporcao. Ver
docs/estudo-de-resolucao.md e docs/estudo-de-sprites.md.

    python3 ferramentas/esbocar-heroi-resolucao.py

## O esqueleto (esqueleto48()), com a conta de cada distancia

Cabeca grande em relacao ao corpo (regra de personagem de jogo: cabeca de um
terco a um quinto da altura total, nunca a proporcao realista de 1/7.5 --
isso e o que separa heroi de jogo top-down de manequim de anatomia). Aqui:
CABECA a 4,4 "cabecas" de altura total -- mais adulto que o esboco anterior
(3,5 cabecas), sem virar os 7,5 de gente de verdade.

As juntas do braco NAO sao chutadas: seguem o canone classico de desenho de
figura (cada marca abaixo e onde o braço RELAXADO cai, nao onde "parece
certo"):

  cotovelo  cai na linha da CINTURA (ponto mais estreito do tronco)
  pulso     cai na linha do QUADRIL
  ponta do dedo  cai no MEIO DA COXA

E a perna:

  joelho    e o PONTO MEDIO entre o quadril e a sola -- nao "um pouco acima
            da metade", e a metade mesmo.

## O perfil (a parte que estava "super bugada")

Perfil nao e a vista de frente encolhida -- e outra silhueta. Tres coisas que
a v1 nao tinha e fazem a diferenca:

  CABECA ASSIMETRICA. Nuca redonda que estufa para TRAS da linha central;
  rosto que projeta para a FRENTE de forma desigual -- o nariz e o ponto que
  mais projeta, a boca fica recuada atras dele (a boca "escorrega para tras"
  do nariz ate o queixo), o queixo projeta menos que o nariz. Sem essa
  assimetria a cabeca de perfil vira uma azeitona sem cara.

  PERNAS EM DUAS PROFUNDIDADES, NAO DUAS COLUNAS COLADAS. A perna de tras
  desenha PRIMEIRO, mais escura, deslocada para tras; a da frente desenha
  DEPOIS, por cima, deslocada para a frente. E o tom que diz qual esta atras,
  igual a regra ja escrita em arte/pessoa.py, so que agora com deslocamento
  de posicao real tambem, nao so achatamento.

  BRACO COM COTOVELO DE VERDADE. Braco reto de perfil parece vara. O antebraco
  quebra para a FRENTE a partir do cotovelo -- um zigue-zague de 1 dobra e ja
  basta para ler como braco relaxado, nao cabo de vassoura.

## O que mais mudou desde a v1

  CANTO ARREDONDADO. A v1 esqueceu a coisa mais simples: apagar o pixel do
  CANTO no topo da cabeca (arte/pessoa.py ja faz isso hoje, e mesmo assim o
  heroi de hoje parece quadrado -- imagine sem). Sem isso qualquer forma
  organica ainda le como caixa por causa dos 4 cantos de 90 graus.

  CARA MAIS SIMPLES, NAO MAIS SOMBREADA. O que fazia a v1 parecer "realista e
  envelhecida" nao era a proporcao, era a sobrancelha grossa colada no olho e
  a sombra pesada embaixo do nariz. Aqui o olho e maior e mais redondo, a
  sobrancelha e um traco fino e mais alto, e a bochecha ganha uma marca rosada
  -- e o mesmo truque de calor que o heroi de hoje ja usa (`(216, 148, 138)`
  em arte/pessoa.py) e que a v1 jogou fora.
"""
import os
import sys

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(RAIZ, "arte"))
from base import *  # noqa
import pessoa  # noqa
from PIL import Image

L, A = 48, 96
CX = L // 2

# ---------------------------------------------------------- rampa de 5 tons
SOMBRA_ALVO = (42, 32, 72)
LUZ_ALVO = (255, 246, 222)


def _mix(a, b, k):
    return tuple(max(0, min(255, int(a[i] + (b[i] - a[i]) * k))) for i in range(3))


P_BASE = (236, 198, 162)
P_S = _mix(P_BASE, SOMBRA_ALVO, 0.50)
P_E = _mix(P_BASE, SOMBRA_ALVO, 0.26)
P_C = _mix(P_BASE, LUZ_ALVO, 0.24)
P_L = _mix(P_BASE, LUZ_ALVO, 0.46)
P_ATRAS = _mix(P_E, (20, 16, 40), 0.35)     # membro de tras: mais escuro e mais frio ainda
BOCHECHA = (222, 140, 128)

TUNICA = (79, 118, 156)
TUNICA_E = _mix(TUNICA, (18, 18, 36), 0.4)
TUNICA_C = _mix(TUNICA, (255, 255, 255), 0.3)

ACO = (203, 211, 222)
ACO_E = (134, 145, 164)
CABO = (108, 72, 44)
CABO_E = (74, 48, 30)


# ------------------------------------------------------------- o esqueleto
def esqueleto48():
    """Toda distancia do heroi, numa conta so -- igual arte/pessoa.py faz para
    o de 16px. Mexeu num numero aqui, tudo que depende dele se ajusta sozinho."""
    chao = 90
    bota_alt = 7
    canela_alt = 13     # joelho ate o topo da bota
    coxa_alt = 19        # quadril ate o joelho -- metade do quadril-a-sola (19+13+7=39~40)
    tronco_alt = 24      # ombro ate o quadril
    pescoco = 2
    cab_alt = 19          # cabeca sozinha -- 84 / 19 = ~4,4 "cabecas" de altura total

    bota_topo = chao - bota_alt
    joelho_y = bota_topo - canela_alt
    quadril_y = joelho_y - coxa_alt
    tronco_topo = quadril_y - tronco_alt
    cab_topo = tronco_topo - pescoco - cab_alt
    ombro_y = tronco_topo + 2

    # o canone: cotovelo na cintura, pulso no quadril, dedo no meio da coxa.
    # cintura = ponto mais estreito do tronco, ~62% do tronco a partir do ombro
    cintura_y = tronco_topo + round(tronco_alt * 0.62)
    cotovelo_y = cintura_y
    pulso_y = quadril_y
    dedo_y = quadril_y + coxa_alt // 2

    return dict(
        chao=chao, cab_topo=cab_topo, cab_alt=cab_alt, tronco_topo=tronco_topo,
        tronco_alt=tronco_alt, ombro_y=ombro_y, cintura_y=cintura_y,
        quadril_y=quadril_y, coxa_alt=coxa_alt, joelho_y=joelho_y,
        bota_topo=bota_topo, bota_alt=bota_alt, cotovelo_y=cotovelo_y,
        pulso_y=pulso_y, dedo_y=dedo_y,
    )


E = esqueleto48()
CAB_L = 17          # largura da cabeca na bochecha
OMBRO_L = 25
QUADRIL_L = 19


# ------------------------------------------------------------------ formas
def _lin(im, cx, y, larg, cor):
    ret(im, cx - larg // 2, y, larg, 1, cor)


def _cunha(im, cx, y0, largs, tom_base, tom_lat):
    for k, larg in enumerate(largs):
        _lin(im, cx, y0 + k, larg, tom_base)
    for k, larg in enumerate(largs):
        x = cx - larg // 2
        px(im, x, y0 + k, tom_lat)
        px(im, x + larg - 1, y0 + k, tom_lat)


def _bojo(n, pico_f, altura_pico, base=2):
    """Lista de n valores subindo ate altura_pico na fracao pico_f e descendo
    dos dois lados ate base -- serve para qualquer saliencia (nuca, nariz,
    bochecha): um jeito so de descrever "isto aqui incha"."""
    out = []
    for k in range(n):
        f = k / max(1, n - 1)
        d = abs(f - pico_f) / max(pico_f, 1 - pico_f, 0.01)
        out.append(round(base + (altura_pico - base) * max(0, 1 - d)))
    return out


def _cabeca_largs_frente():
    """Testa estreita, bochecha larga a ~40%, queixo fechando."""
    largs = []
    for k in range(E["cab_alt"]):
        f = k / max(1, E["cab_alt"] - 1)
        if f < 0.42:
            w = CAB_L * 0.62 + (f / 0.42) * CAB_L * 0.38
        else:
            w = CAB_L - ((f - 0.42) / 0.58) * CAB_L * 0.5
        largs.append(max(7, round(w)))
    return largs


def _mao(im, x, y, virado, tom_base=None, tom_luz=None, tom_sombra=None):
    tom_base, tom_luz, tom_sombra = tom_base or P_C, tom_luz or P_L, tom_sombra or P_S
    ret(im, x, y, 5, 3, tom_base)
    ret(im, x, y, 5, 1, tom_luz)
    for k in range(3):
        dx = x + k * 2
        ret(im, dx, y + 3, 1, 3, tom_base)
        px(im, dx, y + 5, P_E)
        if k < 2:
            px(im, dx + 1, y + 3, tom_sombra)
            px(im, dx + 1, y + 4, tom_sombra)
    pol_x = x - 2 if virado < 0 else x + 5
    ret(im, pol_x, y + 1, 2, 2, tom_base)
    px(im, pol_x, y + 2, P_E)


def _pe(im, x, y, lado, aponta=0):
    """Bloco de bota. `aponta` desloca a ponta para a direcao que o pe encara
    -- e o que faz um pe de perfil parecer virado para algum lugar."""
    fx = x + aponta
    ret(im, min(x, fx) - 4, y, abs(aponta) + 9, 6, TUNICA_E)
    ret(im, min(x, fx) - 4, y, abs(aponta) + 9, 1, TUNICA_C)
    ret(im, min(x, fx) - 4, y + 5, abs(aponta) + 9, 1, CABO_E)


def _olho(im, x, y):
    """Esclera grande e redonda, iris, pupila, brilho -- olho de personagem de
    jogo, nao soquete de anatomia. Maior e mais aberto do que a v1."""
    ret(im, x, y, 6, 5, (245, 241, 214))
    apagar(im, x, y)
    apagar(im, x + 5, y)
    ret(im, x + 1, y + 1, 4, 3, (108, 76, 54))
    ret(im, x + 1, y + 3, 4, 1, (72, 48, 34))
    ret(im, x + 2, y + 1, 2, 2, TINTA)
    px(im, x + 1, y + 1, BRANCO)
    ret(im, x, y + 1, 1, 3, P_S)
    ret(im, x + 5, y + 1, 1, 3, P_S)


# --------------------------------------------------------------- de frente
def _braco_frente(im, lado, bal):
    ombro_x = CX + lado * (OMBRO_L // 2 - 2)
    cintura_x = CX + lado * (QUADRIL_L // 2 - 1)
    n1 = E["cintura_y"] - E["ombro_y"]
    for k in range(n1):
        w = 8 - (k * 2) // n1
        y = E["ombro_y"] + k
        x = ombro_x + round((cintura_x - ombro_x) * k / max(1, n1 - 1))
        ret(im, x - w // 2, y, w, 1, P_E)
        px(im, x - lado * w // 2 + (0 if lado > 0 else -1), y, P_C)
    n2 = E["pulso_y"] - E["cintura_y"]
    quadril_x = CX + lado * (QUADRIL_L // 2 - 1)
    for k in range(n2):
        w = 6 - (k * 2) // n2
        y = E["cintura_y"] + k
        x = cintura_x + round((quadril_x - cintura_x) * k / max(1, n2 - 1))
        yy = y + (bal if k > n2 - 3 else 0)
        ret(im, x - w // 2, yy, w, 1, P_E)
        px(im, x - lado * w // 2 + (0 if lado > 0 else -1), yy, P_C)
    _mao(im, quadril_x - 2, E["pulso_y"] + bal, lado)
    return quadril_x, E["pulso_y"] + bal


def _perna_frente(im, lado, desloc):
    quadril_x = CX + lado * (QUADRIL_L // 4)
    joelho_x = quadril_x + desloc // 2
    pe_x = joelho_x + desloc // 2
    n1 = E["coxa_alt"]
    for k in range(n1):
        w = 10 - (k * 3) // n1
        y = E["quadril_y"] + k
        x = quadril_x + round((joelho_x - quadril_x) * k / max(1, n1 - 1))
        ret(im, x - w // 2, y, w, 1, P_E)
        px(im, x - lado * w // 2 + (0 if lado > 0 else -1), y, P_C)
    n2 = E["bota_topo"] - E["joelho_y"]
    for k in range(n2):
        w = 7 - (k * 2) // n2
        y = E["joelho_y"] + k
        x = joelho_x + round((pe_x - joelho_x) * k / max(1, n2 - 1))
        ret(im, x - w // 2, y, w, 1, P_E)
        px(im, x - lado * w // 2 + (0 if lado > 0 else -1), y, P_C)
    _pe(im, pe_x, E["bota_topo"], lado)


def _rosto_frente(im):
    olho_y = E["cab_topo"] + 9
    _olho(im, CX - 9, olho_y)
    _olho(im, CX + 3, olho_y)
    ret(im, CX - 9, olho_y - 3, 5, 1, P_S)     # sobrancelha: TRACO fino, mais alto
    ret(im, CX + 4, olho_y - 3, 5, 1, P_S)
    ret(im, CX - 1, olho_y + 4, 2, 2, P_C)     # nariz: pequeno, quase so luz
    px(im, CX - 1, olho_y + 6, P_E)
    ret(im, CX - 3, olho_y + 9, 6, 1, P_E)     # boca: uma linha so, sem volume
    for lado in (-1, 1):
        elipse(im, CX + lado * 9, olho_y + 6, 2, 2, BOCHECHA)


def _corpo_frente(im):
    linhas_tronco = []
    for k in range(E["tronco_alt"]):
        f = k / (E["tronco_alt"] - 1)
        linhas_tronco.append(round(OMBRO_L + (QUADRIL_L - OMBRO_L) * f))
    _cunha(im, CX, E["tronco_topo"], linhas_tronco, TUNICA, TUNICA_E)
    _lin(im, CX, E["tronco_topo"], linhas_tronco[0] - 4, TUNICA_C)
    _lin(im, CX, E["tronco_topo"] + 1, linhas_tronco[1] - 6, TUNICA_C)
    cinto_y = E["tronco_topo"] + E["tronco_alt"] - 4
    _lin(im, CX, cinto_y, linhas_tronco[-4] + 2, CABO)
    _lin(im, CX, cinto_y + 1, linhas_tronco[-3], CABO_E)

    largs_cab = _cabeca_largs_frente()
    _cunha(im, CX, E["cab_topo"], largs_cab, P_E, P_S)
    for k, larg in enumerate(largs_cab):
        _lin(im, CX, E["cab_topo"] + k, max(0, larg - 3), P_C if k else P_L)
    _lin(im, CX, E["cab_topo"], largs_cab[0] - 6, P_L)
    apagar(im, CX - largs_cab[0] // 2, E["cab_topo"])   # o canto -- sem isto, caixa
    apagar(im, CX + largs_cab[0] // 2, E["cab_topo"])

    _rosto_frente(im)
    _perna_frente(im, -1, 0)
    _perna_frente(im, 1, 0)
    _braco_frente(im, -1, 0)
    forte = _braco_frente(im, 1, 0)
    _espada(im, forte[0] + 2, forte[1] + 3)


def _espada(im, x, y):
    ret(im, x, y, 2, 5, CABO)
    px(im, x, y, CABO_E)
    ret(im, x - 3, y - 1, 8, 2, ACO_E)
    for k in range(20):
        w = 3 if k < 16 else 2
        ret(im, x - w // 2 + 1, y - 3 - k, w, 1, ACO)
        px(im, x - w // 2 + 1, y - 3 - k, ACO_E)
    px(im, x + 1, y - 22, (255, 255, 255))


# -------------------------------------------------------------- de perfil
# lado_frente: -1 olhando para a esquerda, +1 para a direita
def _cabeca_perfil(im, lado_frente):
    n = E["cab_alt"]
    # A primeira tentativa usou uma curva suave (um valor por linha subindo e
    # descendo aos poucos) e o resultado pareceu focinho, nao rosto -- porque
    # rosto de verdade nao e uma curva, e um punhado de PLANOS PLANOS que se
    # encontram em DEGRAU: testa quase reta, uma quina no nariz que salta para
    # fora de repente e para de novo (o "beiral" do nariz), um recuo BRUSCO
    # logo abaixo (o filtro, entre nariz e boca), e so entao o queixo. Sem o
    # salto e o recuo serem abruptos -- 3 a 4 px de uma linha para a
    # seguinte, nao 1 -- o olho nao le "nariz", le "bico".
    tras =   [4, 6, 7, 7, 7, 6, 6, 5, 5, 5, 4, 4, 4, 3, 3, 3, 3, 2, 2]   # nuca: redonda, sem degrau
    frente = [3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 9, 9, 4, 5, 5, 4, 4, 4, 3]   # testa|sobranc.|PONTE|NARIZ|vale|labio|queixo
    assert len(tras) == n and len(frente) == n, "ajuste as listas se cab_alt mudar"

    y0 = E["cab_topo"]
    for k in range(n):
        x0 = CX - lado_frente * tras[k]
        x1 = CX + lado_frente * frente[k]
        a, b = (x0, x1) if x0 < x1 else (x1, x0)
        ret(im, a, y0 + k, b - a + 1, 1, P_E)
    for k in range(n):
        y = y0 + k
        # a lateral mais escura por dentro (perto do pescoco), luz na crista
        px(im, CX - lado_frente * tras[k], y, P_S)
        px(im, CX + lado_frente * frente[k], y, P_C)
    apagar(im, CX - lado_frente * tras[0], y0)
    apagar(im, CX + lado_frente * frente[0], y0)
    # a sombra que o proprio nariz joga na bochecha, embaixo dele -- e o que
    # separa "nariz colado no rosto" de "nariz que sai do rosto de verdade"
    px(im, CX + lado_frente * (frente[10] - 1), y0 + 12, P_S)

    olho_y = y0 + 7
    _olho(im, CX + lado_frente * 1 - (3 if lado_frente > 0 else 3), olho_y)
    orelha_x = CX - lado_frente * (tras[6] + 1)
    ret(im, orelha_x - 1, y0 + 5, 3, 6, P_C)
    px(im, orelha_x - 1, y0 + 7, P_E)
    elipse(im, CX + lado_frente * 1, y0 + 13, 2, 2, BOCHECHA)


def _torso_perfil(im, lado_frente):
    largura = QUADRIL_L
    linhas = []
    for k in range(E["tronco_alt"]):
        f = k / (E["tronco_alt"] - 1)
        # peito estufa um pouco no alto, cintura fecha, quadril reabre um pouco
        bojo = 2 if f < 0.35 else (-1 if f < 0.7 else 1)
        linhas.append(largura + bojo)
    _cunha(im, CX, E["tronco_topo"], linhas, TUNICA, TUNICA_E)
    _lin(im, CX, E["tronco_topo"], linhas[0] - 5, TUNICA_C)
    cinto_y = E["tronco_topo"] + E["tronco_alt"] - 4
    _lin(im, CX, cinto_y, linhas[-4], CABO)
    _lin(im, CX, cinto_y + 1, linhas[-3] - 2, CABO_E)


def _perna_perfil(im, lado_frente, atras, forte):
    """`atras=True` desenha a perna de tras: mais escura, deslocada para tras,
    SEM luz propria -- e o que faz ela ler como atras sem competir com a da
    frente (regra ja escrita na skill: "o que esta atras nao compete")."""
    desloc = lado_frente * (5 if not atras else -3)
    quadril_x = CX + desloc // 3
    joelho_x = quadril_x + desloc // 2
    pe_x = joelho_x + desloc // 2
    tom = P_ATRAS if atras else P_E
    tom_luz = None if atras else P_C
    n1 = E["coxa_alt"]
    for k in range(n1):
        w = (8 if not atras else 7) - (k * 2) // n1
        y = E["quadril_y"] + k
        x = quadril_x + round((joelho_x - quadril_x) * k / max(1, n1 - 1))
        ret(im, x - w // 2, y, w, 1, tom)
        if tom_luz:
            px(im, x + lado_frente * w // 2 - (0 if lado_frente > 0 else 1), y, tom_luz)
    n2 = E["bota_topo"] - E["joelho_y"]
    for k in range(n2):
        w = (6 if not atras else 5) - (k * 2) // n2
        y = E["joelho_y"] + k
        x = joelho_x + round((pe_x - joelho_x) * k / max(1, n2 - 1))
        ret(im, x - w // 2, y, w, 1, tom)
    _pe(im, pe_x, E["bota_topo"], lado_frente, aponta=lado_frente * (4 if not atras else 1))


def _braco_perfil(im, lado_frente):
    """O cotovelo QUEBRA: o antebraco sai numa direcao diferente do braco, nao
    e a mesma reta continuando. Sem essa dobra, perfil de braço vira vara."""
    ombro_x = CX - lado_frente * 2
    n1 = E["cintura_y"] - E["ombro_y"]
    cotovelo_x = ombro_x - lado_frente * 2      # o cotovelo recua um pouco (relaxado)
    for k in range(n1):
        w = 7 - (k * 2) // n1
        y = E["ombro_y"] + k
        x = ombro_x + round((cotovelo_x - ombro_x) * k / max(1, n1 - 1))
        ret(im, x - w // 2, y, w, 1, P_E)
        px(im, x + lado_frente * w // 2 - (0 if lado_frente > 0 else 1), y, P_C)
    n2 = E["pulso_y"] - E["cintura_y"]
    pulso_x = cotovelo_x + lado_frente * 3       # o antebraco volta para a FRENTE
    for k in range(n2):
        w = 6 - (k * 2) // n2
        y = E["cintura_y"] + k
        x = cotovelo_x + round((pulso_x - cotovelo_x) * k / max(1, n2 - 1))
        ret(im, x - w // 2, y, w, 1, P_E)
        px(im, x + lado_frente * w // 2 - (0 if lado_frente > 0 else 1), y, P_C)
    _mao(im, pulso_x - 2, E["pulso_y"], lado_frente)
    return pulso_x, E["pulso_y"]


def _corpo_perfil(im, lado_frente):
    _perna_perfil(im, lado_frente, atras=True, forte=False)
    _perna_perfil(im, lado_frente, atras=False, forte=True)
    _torso_perfil(im, lado_frente)
    _cabeca_perfil(im, lado_frente)
    mao = _braco_perfil(im, lado_frente)
    _espada(im, mao[0] + lado_frente, mao[1] + 3)


def heroi48(direcao):
    im = nova(L, A)
    if direcao == "esquerda":
        _corpo_perfil(im, lado_frente=-1)
    else:
        _corpo_frente(im)

    luz_de_cima(im, [P_E, P_S, P_C, P_L, P_ATRAS], P_L)
    contorno_seletivo(im, TINTA, TINTA_2)
    for i in range(CX - 14, CX + 14):
        for j in (E["chao"] + 1, E["chao"] + 2):
            if 0 <= j < A and im.getpixel((i, j))[3] == 0:
                borda = abs(i - (CX - 0.5)) > 13
                if not (borda and j == E["chao"] + 1):
                    px(im, i, j, (36, 30, 52, 70 if j == E["chao"] + 1 else 45))
    return im


def comparacao(zoom=6):
    direcoes = ["baixo", "esquerda"]
    larg_col = L + 6
    fora = Image.new("RGBA", (larg_col * len(direcoes), A * 2 + 8), (86, 122, 92, 255))

    for i, direcao in enumerate(direcoes):
        corpo_im = pessoa.corpo(direcao, "parado", tom=0, raca="vale")
        bracos_im = pessoa.bracos(direcao, "parado", tom=0, raca="vale")
        hoje = Image.new("RGBA", (16, 32), (0, 0, 0, 0))
        hoje.alpha_composite(corpo_im)
        hoje.alpha_composite(bracos_im)
        hoje_grande = hoje.resize((L, A), Image.NEAREST)
        fora.alpha_composite(hoje_grande, (i * larg_col, 0))
        fora.alpha_composite(heroi48(direcao), (i * larg_col, A + 8))

    return fora.resize((fora.width * zoom, fora.height * zoom), Image.NEAREST)


if __name__ == "__main__":
    destino = os.path.join(RAIZ, "docs", "referencia", "estudo-de-resolucao-heroi.png")
    comparacao().save(destino)
    print("escrito: docs/referencia/estudo-de-resolucao-heroi.png")
