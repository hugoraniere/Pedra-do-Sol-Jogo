# -*- coding: utf-8 -*-
"""Goblins, na resolucao nova.

Segunda tentativa. A primeira (ver `docs/estudo-de-bichos-e-armas.md` e
`docs/estudo-de-resolucao.md`) parou na cabeca: com 16 x 32 nao ha pixel
sobrando para separar tronco de braco de perna por TOM, e o corpo virava uma
mancha verde so. Aqui o quadro e 48 x 96 (3x), so para o goblin, por decisao do
Hugo em 2026-09-05: o resto do jogo continua em 16 x 32 ate a decisao de
resolucao geral sair do papel. `arte/gente.py` usa `folha_de()` para isso, e o
jogo compensa a escala na exibicao (ver `src/cenas/Boot.ts` e os pontos que
criam o sprite do goblin), para ele continuar do MESMO TAMANHO no mundo.

O que muda de verdade, alem do numero de pixels:

  . RAMPA DE 5 TONS (GOBLIN_L/GOBLIN_C/GOBLIN/GOBLIN_E/GOBLIN_S) em vez de 3.
    Tronco em GOBLIN, braco e perna em GOBLIN_E, mao e pe em GOBLIN_C — a regra
    que o estudo ja escreveu e o desenho de 16px so aplicava pela metade.
  . OLHO COM ESTRUTURA: esclera, iris, pupila, brilho.
  . MAO COM DEDOS, PE COM DEDOS.
  . NARIZ QUE FURA A SILHUETA de frente, atravessando a boca ate passar do
    queixo — antes so existia de perfil.
  . TANGA DE COURO, a unica roupa. Sem ela o goblin fica pelado da cintura
    pra baixo, sem nada que quebre o verde.
  . ATAQUE ganha um porrete de verdade (o bestiario ja descreve o telegrafo:
    "levanta o pau acima da cabeca e fecha os olhos"), e ESQUIVA, FUGA e
    DERROTA sao poses novas — ver `arte/base.py` COLUNAS.

Continua tudo herdado do docstring antigo, so que agora executado:
  . baixinho: ocupa a metade de baixo do quadro
  . cabeca enorme, mais LARGA que alta, encaixada direto no tronco, sem pescoco
  . orelhas gigantes em forma de folha, caida para tras (nao chifre reto)
  . nariz comprido saindo da silhueta, o traco que mais marca
  . boca larga com dois dentes/presas para fora
  . postura curvada, cabeca jogada para a frente
  . braco comprido, passa do joelho
  . perna arqueada, pe grande e chato, sem bota

Quatro tipos, e eles nao sao so escala:
  magricela  alto e fino, orelha e nariz maiores
  gorducho   baixo e redondo, barriga, orelha pequena
  moleque    pequenininho, cabeca gigante, olho enorme
  chefe      o Zonzo: maior, coroa de osso, barba rala, cara de chefe
"""
import os, sys
from base import *  # noqa

L, A = 48, 96
CX = L // 2

TIPOS = {
    "magricela": dict(cab=30, tronco=20, orelha=11, nariz=11, dy=0, barriga=0, perna=7),
    "gorducho":  dict(cab=30, tronco=26, orelha=8,  nariz=8,  dy=5, barriga=1, perna=9),
    "moleque":   dict(cab=27, tronco=16, orelha=8,  nariz=7,  dy=13, barriga=0, perna=6),
    "chefe":     dict(cab=32, tronco=25, orelha=9,  nariz=9,  dy=-4, barriga=1, perna=9),
}

CHAO_Y = 90


def _lin(im, cx, y, larg, cor):
    """Uma linha centrada de dada largura. A silhueta organica desta folha e
    uma pilha destas: cada linha com largura diferente da de cima."""
    ret(im, cx - larg // 2, y, larg, 1, cor)


def _cunha(im, cx, y0, largs, tom_base, tom_lat):
    """Uma forma em cunha (cabeca ou tronco): uma lista de larguras, uma por
    linha, com a lateral em sombra -- e o que da volume de barril/craneo sem
    precisar de curva de verdade."""
    for k, larg in enumerate(largs):
        _lin(im, cx, y0 + k, larg, tom_base)
    for k, larg in enumerate(largs):
        x = cx - larg // 2
        px(im, x, y0 + k, tom_lat)
        px(im, x + larg - 1, y0 + k, tom_lat)


def _mao_ou_pe(im, x, y, dedos, virado, vertical=False):
    """Bloco claro (GOBLIN_C) com dedos separados por vao escuro (GOBLIN_S).
    `vertical=True` desenha para baixo (pe); senao para o lado (mao)."""
    if vertical:
        ret(im, x, y, dedos * 2 + 1, 2, GOBLIN_C)
        for k in range(dedos):
            px(im, x + 1 + k * 2, y + 2, GOBLIN_C)
            px(im, x + k * 2, y + 2, GOBLIN_S)
    else:
        ret(im, x, y, 3, dedos * 2 + 1, GOBLIN_C)
        d = 1 if virado > 0 else -1
        for k in range(dedos):
            px(im, x + 3 * (virado > 0), y + 1 + k * 2, GOBLIN_C)
            px(im, x + 3 * (virado > 0), y + k * 2, GOBLIN_S)


def _braco(im, cx, ombro_y, lado, bal, largura):
    """Braco comprido (passa do joelho), ombro colado no tronco, cotovelo
    afastando. GOBLIN_E o separa do tronco em GOBLIN so pelo tom."""
    ombro_x = cx + lado * (largura // 2 - 1)
    cot_x = ombro_x + lado * 3
    n = 13
    for k in range(n):
        x = ombro_x + round((cot_x - ombro_x) * min(k, 7) / 7)
        y = ombro_y + k + (bal if k > 5 else 0)
        w = 6
        ret(im, x - w // 2, y, w, 1, GOBLIN_E)
        px(im, x - w // 2, y, GOBLIN_S)          # o vinco de dentro
        px(im, x + w // 2 - 1, y, GOBLIN)         # a luz de fora
    _mao_ou_pe(im, cot_x - 3 + (6 if lado > 0 else 0), ombro_y + n - 1 + bal, 3, lado)


def _perna(im, cx, quadril_y, lado, desloc, largura, pe_alt=6):
    """Arqueada: sai mais aberta do que o quadril e volta a fechar no pe.
    Perna e pe em GOBLIN_E/GOBLIN_C -- nunca no tom do tronco."""
    quadril_x = cx + lado * (largura // 2)
    pe_x = quadril_x + lado * 2 + desloc
    n = 12
    for k in range(n):
        x = quadril_x + round((pe_x - quadril_x) * k / (n - 1))
        w = 6 - (1 if k > n - 4 else 0)
        ret(im, x - w // 2, quadril_y + k, w, 1, GOBLIN_E)
        px(im, x + w // 2 - 1, quadril_y + k, GOBLIN)   # a luz da canela
    py = quadril_y + n
    _mao_ou_pe(im, pe_x - 3, py, 3, lado, vertical=True)
    ret(im, pe_x - 4, py, 8, 1, GOBLIN_S)


def _olho(im, x, y, grande=False):
    """Esclera, iris, pupila, brilho. E o olho que da intencao ao bicho."""
    w, h = (7, 6) if grande else (5, 4)
    ret(im, x, y, w, h, ESCLERA)
    ret(im, x, y, w, 1, (208, 200, 168))
    ret(im, x + 1, y + 1, w - 2, h - 2, OLHO_IRIS)
    ret(im, x + 1, y + h - 2, w - 2, 1, OLHO_IRIS_E)
    cxo, cyo = x + w // 2, y + h // 2
    ret(im, cxo, cyo, 2, 2, TINTA)
    px(im, x + 1, y + 1, BRANCO)
    ret(im, x, y, 1, h, GOBLIN_S)
    ret(im, x + w - 1, y, 1, h, GOBLIN_S)


def _orelha(im, cx, oy, lado, comprimento):
    """Orelha em folha, com dobra interna. Sobe enquanto se afasta e a ponta
    cai de volta -- a linha que mais diz goblin na silhueta, e o que hoje
    (16px) le como chifre reto por falta de espaco para a curva."""
    base_x = cx + lado * (TIPOS["magricela"]["cab"] // 2 - 1)
    for k in range(comprimento):
        x = base_x + lado * (k + 1)
        sobe = min(k, comprimento - 4)
        topo = oy - sobe + (k - (comprimento - 4) if k > comprimento - 4 else 0)
        alt = max(3, comprimento - k + 2)
        ret(im, x, topo, 1, alt, GOBLIN_C)
        px(im, x, topo, GOBLIN_L)
        px(im, x, topo + alt - 1, GOBLIN_E)
        if k < comprimento - 3:
            px(im, x, topo + 2 + k // 2, GOBLIN_E)   # a dobra de dentro


def goblin(direcao, coluna, tipo="magricela"):
    direcao, giro = normalizar(direcao)
    t = TIPOS[tipo]
    im = nova(L, A)

    tonto = coluna == "tonto"
    ataca = coluna == "ataque"
    esquiva = coluna == "esquiva"
    foge = coluna == "fuga"
    derrota = coluna == "derrota"
    perfil = direcao in ("esquerda", "direita")
    lado_frente = -1 if direcao == "esquerda" else 1   # para onde o goblin olha

    bal, sobe_desloc, braco_bal = deslocamento(coluna)
    if foge:
        bal, sobe_desloc, braco_bal = bal * 2, sobe_desloc, braco_bal * 2

    base_y = CHAO_Y - t["dy"] + sobe_desloc
    if derrota:
        base_y += 6   # o corpo afunda: joelho dobra, nao ha mais postura ereta

    perna_topo = base_y - t["perna"] - 6
    tronco_alt = t["tronco"] + (4 if t["barriga"] else 0)
    tronco_topo = perna_topo - tronco_alt + 4
    cab_alt = t["cab"] - 2
    cab_topo = tronco_topo - cab_alt + 3        # sem pescoco: cabeca encaixa

    if tonto:
        cab_topo += 2
    if derrota:
        cab_topo += 9   # a cabeca pende bem para a frente -- corpo vencido
    if direcao != "cima" and not perfil:
        cab_x_off = 0
    else:
        cab_x_off = lado_frente * 2 if perfil else 0
    if derrota:
        cab_x_off += 3   # a cabeca pende para o lado tambem, nao so para baixo
    if esquiva:
        cab_x_off += -4 if perfil else 5   # o corpo inteiro inclina para o lado
    cx = CX + cab_x_off

    # ------------------------------------------------------------ pernas
    perna_l = t["perna"]
    if not derrota:
        for (lado, d) in ((-1, bal), (1, -bal)):
            if perfil and lado != -lado_frente:
                continue   # de perfil so a perna de TRAS aparece atras da da frente
            _perna(im, cx, perna_topo, lado, d if not perfil else d, perna_l + tronco_alt // 6)
    else:
        # derrota: as duas pernas dobradas para o lado, corpo caido
        for lado in (-1, 1):
            qx = cx + lado * (perna_l // 2)
            ret(im, qx - 3, perna_topo + 10, 8, 5, GOBLIN_E)
            ret(im, qx - 3, perna_topo + 10, 8, 1, GOBLIN)

    # ------------------------------------------------------------ tronco
    largura_ombro = t["tronco"]
    largura_quadril = int(largura_ombro * 0.72)
    linhas_tronco = []
    n_tr = tronco_alt
    for k in range(n_tr):
        f = k / max(1, n_tr - 1)
        linhas_tronco.append(round(largura_ombro + (largura_quadril - largura_ombro) * f))
    if t["barriga"]:
        for k in range(n_tr):
            f = 1 - abs((k / max(1, n_tr - 1)) - 0.6) * 2
            linhas_tronco[k] += max(0, round(f * 6))
    _cunha(im, cx, tronco_topo, linhas_tronco, GOBLIN, GOBLIN_E)
    _lin(im, cx, tronco_topo, largura_ombro - 4, GOBLIN_C)          # luz da clavicula
    _lin(im, cx, tronco_topo + 1, largura_ombro - 6, GOBLIN_C)
    for k in (n_tr // 3, (2 * n_tr) // 3):
        ret(im, cx - largura_ombro // 3, tronco_topo + k, largura_ombro * 2 // 3, 1, GOBLIN_E)

    # a tanga de couro, unica roupa
    tanga_y = tronco_topo + n_tr - 3
    tanga_l = largura_quadril + 4
    ret(im, cx - tanga_l // 2, tanga_y, tanga_l, 5, COURO)
    ret(im, cx - tanga_l // 2, tanga_y, tanga_l, 1, COURO_C)
    ret(im, cx - tanga_l // 2, tanga_y + 4, tanga_l, 1, COURO_E)
    for k in range(3):
        px(im, cx - tanga_l // 2 + 2 + k * (tanga_l // 3), tanga_y + 3, COURO_E)

    # ------------------------------------------------------------ bracos
    ombro_y = tronco_topo + 2
    if derrota:
        # os dois bracos caem soltos, sem forca -- bal grande e so para baixo
        for lado in (-1, 1):
            _braco(im, cx, ombro_y, lado, 6, largura_ombro)
    elif ataca and perfil:
        pass   # so a mao no cabo do porrete aparece, ver abaixo
    else:
        for (lado, bb) in ((-1, braco_bal), (1, -braco_bal)):
            if perfil and lado != -lado_frente:
                continue   # so o braco de TRAS aparece de perfil
            if ataca and not perfil:
                continue   # os dois saem redesenhados por baixo do porrete, ver abaixo
            _braco(im, cx, ombro_y, lado, bb, largura_ombro)

    # ------------------------------------------------------------ cabeca
    largura_cab = t["cab"]
    linhas_cab = []
    for k in range(cab_alt):
        f = k / max(1, cab_alt - 1)
        # cunha: testa estreita, bochecha larga no meio, queixo fechando
        if f < 0.5:
            w = largura_cab * (0.55 + f * 0.9)
        else:
            w = largura_cab * (1.0 - (f - 0.5) * 1.1)
        linhas_cab.append(max(4, round(w)))
    _cunha(im, cx, cab_topo, linhas_cab, GOBLIN, GOBLIN_E)
    _lin(im, cx, cab_topo, linhas_cab[0] - 2, GOBLIN_L)
    _lin(im, cx, cab_topo + 1, linhas_cab[1] - 3, GOBLIN_C)

    # orelhas: continuam de costas (sao grandes o bastante para aparecer mesmo
    # sem rosto -- de perfil so a de tras
    oy = cab_topo + cab_alt // 3
    lados = (-1, 1)
    if direcao == "esquerda":
        lados = (-1,)
    elif direcao == "direita":
        lados = (1,)
    for lado in lados:
        _orelha(im, cx, oy, lado, t["orelha"])

    # ------------------------------------------------------------- rosto
    if direcao != "cima":
        olho_y = cab_topo + cab_alt // 2 - 2
        grande = tipo == "moleque"
        if tonto:
            for ex in (cx - 8, cx + 4):
                pontos(im, [(ex, olho_y), (ex + 3, olho_y + 3), (ex, olho_y + 3), (ex + 3, olho_y)], TINTA)
                pontos(im, [(ex + 1, olho_y), (ex + 2, olho_y + 3), (ex + 1, olho_y + 3), (ex + 2, olho_y)], TINTA)
        elif derrota:
            # olhos fechados: uma linha so, sem esclera nem iris -- nocauteado,
            # nao tonto (a diferenca e a mesma que separa as duas colunas)
            largura_o = 7 if grande else 5
            for ex in ((cx - 8, cx + 3) if not perfil else (cx + lado_frente * 4 - 2,)):
                ret(im, ex, olho_y + 2, largura_o, 1, TINTA)
        elif perfil:
            ex = cx + lado_frente * 4
            _olho(im, ex - 2, olho_y, grande)
        else:
            for ex in (cx - 8, cx + 3):
                _olho(im, ex, olho_y, grande)
            ret(im, cx - 9, olho_y - 2, 6, 1, GOBLIN_S)     # sobrancelha, separada
            ret(im, cx + 3, olho_y - 2, 6, 1, GOBLIN_S)     # ao meio -- nao e monobrow

        # boca larga, dois dentes para fora
        by = cab_topo + cab_alt - t["nariz"] // 3 - 2
        boca_l = largura_cab - 8
        ret(im, cx - boca_l // 2, by, boca_l, 4, (86, 44, 52))
        ret(im, cx - boca_l // 2 + 1, by + 1, boca_l - 2, 2, (52, 26, 34))
        ret(im, cx - boca_l // 2, by, boca_l, 1, GOBLIN_S)
        for dx in (cx - boca_l // 2 + 2, cx + boca_l // 2 - 4):
            ret(im, dx, by, 2, 3, DENTE)
            px(im, dx, by + 3, (196, 190, 170))

        # nariz: nasce entre os olhos, atravessa a boca, a ponta passa do
        # queixo -- e o traco que so a resolucao nova permite existir de frente
        n = t["nariz"]
        if perfil:
            fx = cx + lado_frente * 6
            for k in range(n):
                ret(im, fx + lado_frente * k, olho_y + 2 + k, 2, 2, GOBLIN)
                px(im, fx + lado_frente * k + (1 if lado_frente > 0 else 0), olho_y + 2 + k, GOBLIN_E)
            px(im, fx + lado_frente * (n - 1), olho_y + 1 + n, GOBLIN_S)
        else:
            # em GOBLIN_C (mais claro que o GOBLIN da cabeca): sem isso o
            # nariz sai no mesmo tom do rosto e desaparece, so a aresta
            # sobrevive. As duas laterais em GOBLIN_E fecham a crista.
            largs_nariz = [4, 4, 5, 5, 6, 6, 7, 7, 7, 6, 5]
            ny0 = olho_y + 2
            fim = min(n, len(largs_nariz))
            for k in range(fim):
                larg = largs_nariz[k]
                _lin(im, cx, ny0 + k, larg, GOBLIN_C)
                x = cx - larg // 2
                px(im, x, ny0 + k, GOBLIN_E)
                px(im, x + larg - 1, ny0 + k, GOBLIN_E)
            for k in range(fim - 2):
                px(im, cx, ny0 + k, GOBLIN_L)              # o cavalete, uma coluna de luz
            _lin(im, cx, ny0 + fim, 5, GOBLIN_E)            # a base, na sombra
            px(im, cx - 2, ny0 + fim - 2, GOBLIN_S)         # narinas
            px(im, cx + 2, ny0 + fim - 2, GOBLIN_S)

    # ------------------------------------------------------- coroa/barba
    if tipo == "chefe" and direcao != "cima":
        for k in range(3):
            ret(im, cx - largura_cab // 2 + 2 + k * (largura_cab // 3), cab_topo - 3, 3, 3, PAPEL_2)
        ret(im, cx - largura_cab // 2, cab_topo - 1, largura_cab, 1, PAPEL_2)
        ret(im, cx - 3, cab_topo + cab_alt - 3, 6, 3, (168, 190, 150))

    # -------------------------------------------------------- o porrete
    # "levanta o pau acima da cabeca e fecha os olhos" (telegrafo do
    # bestiario) -- por isso a ponta ancora em cab_topo, nao no ombro: sem
    # isso o porrete nao clareava a cabeca e ficava escondido atras da orelha.
    if ataca:
        v = lado_frente if perfil else 1
        empunha_x = cx + v * (largura_cab // 2 + 2)
        punho_y = ombro_y + 6 + (braco_bal if not tonto else 0)
        topo_y = cab_topo - 7
        n_porrete = punho_y - topo_y
        for k in range(n_porrete):
            larg = 3 + (2 if k > n_porrete - 4 else 0)
            ret(im, empunha_x - larg // 2, topo_y + k, larg, 1, MADEIRA)
            px(im, empunha_x - larg // 2, topo_y + k, MADEIRA_E)
        elipse(im, empunha_x, topo_y + n_porrete - 2, 3, 3, MADEIRA_C)
        # a mao que segura, por cima do cabo
        ret(im, empunha_x - 3, punho_y - 2, 6, 5, GOBLIN_C)
        # o outro braco, normal
        lado_o = -v if perfil else -1
        if not perfil:
            _braco(im, cx, ombro_y, -1, braco_bal, largura_ombro)
            _braco(im, cx, ombro_y, 1, -braco_bal, largura_ombro)

    contorno_seletivo(im, TINTA, TINTA_2)
    luz_de_cima(im, [GOBLIN, GOBLIN_E, GOBLIN_C], GOBLIN_L)
    for i in range(CX - 14, CX + 14):
        for j in (CHAO_Y + 1, CHAO_Y + 2):
            if 0 <= i < L and 0 <= j < A and im.getpixel((i, j))[3] == 0:
                borda = abs(i - (CX - 0.5)) > 13
                if not (borda and j == CHAO_Y + 1):
                    px(im, i, j, (36, 30, 52, 70 if j == CHAO_Y + 1 else 45))
    return im
