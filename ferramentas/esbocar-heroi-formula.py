# -*- coding: utf-8 -*-
"""A formula do heroi redondo, testada em dois tamanhos.

NAO e producao. Quarta tentativa. As tres anteriores (ver
docs/referencia/estudo-de-resolucao-heroi.png e -heroi-redondo.png) ensinaram
uma coisa em cada direcao errada e uma em cada direcao certa -- ver o
docstring de `formula_heroi()` para a tabela completa.

    python3 ferramentas/esbocar-heroi-formula.py

A ideia desta rodada: extrair do heroi redondo (16x32) que funcionou uma
FORMULA em fracao de altura -- nao numero de pixel fixo -- e aplicar a MESMA
formula num quadro maior (32x64) para ganhar espaco de detalhe sem trazer de
volta anatomia realista. Se a formula estiver certa, aplicar H=27 nela tem
que devolver os MESMOS numeros que o esboco anterior escolheu a mao. Aplica,
e devolve -- ver o comentario dentro de `formula_heroi()`.
"""
import os
import sys

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(RAIZ, "arte"))
from base import *  # noqa
from paleta import rampa  # noqa
import pessoa  # noqa
from PIL import Image


# ------------------------------------------------------------------ a formula
def formula_heroi(H):
    """Toda medida do heroi, a partir de UM numero: a altura total (topo da
    cabeca a sola), em fracao de UNIDADE = H / 9.

    A fracao 4 : 3 : 2 (cabeca : tronco : perna+bota) e o achado principal
    desta exploracao -- e o que separa "heroizinho charmoso" de "manequim de
    anatomia". Veio de medir o esboco redondo de 16x32 que funcionou:

        cabeca 12px, tronco 9px, perna+bota 6px, total 27  ->  12:9:6 = 4:3:2

    Rodando esta formula com H=27 (o mesmo H de la) tem que devolver os
    MESMOS 12 / 9 / 6 -- e devolve, ver `validar()` no fim do arquivo. Isso e
    a prova de que a proporcao nao foi chute daquela vez: e uma fracao que
    se repete em qualquer tamanho.

    Sem pescoco de proposito -- cabeca de chibi senta direto no ombro. Sem
    cotovelo nem joelho de proposito -- ver docs/referencia/esboco-heroi-pivos.png,
    esses dois so existem em pose especial, nunca no esqueleto base.
    """
    u = H / 9
    cabeca_d = round(4 * u)
    tronco_h = round(3 * u)
    pernabota_h = round(2 * u)
    perna_h = round(pernabota_h * 2 / 3)
    bota_h = pernabota_h - perna_h
    braco_h = round(tronco_h * 2 / 3)

    return dict(
        H=H, u=u,
        cabeca_d=cabeca_d, cabeca_r=cabeca_d / 2,
        tronco_h=tronco_h, tronco_w=round(cabeca_d * 5 / 6),
        perna_h=perna_h, bota_h=bota_h,
        limb_w=round(cabeca_d / 4),
        perna_offset=round(cabeca_d / 6),
        braco_h=braco_h, braco_offset=round(cabeca_d / 2),
        braco_y_recuo=round(tronco_h / 9),           # o braco comeca 1/9 do tronco abaixo do ombro
    )


# ---------------------------------------------------------- paleta (mesma)
PELE_S, PELE_B, PELE_L = rampa((236, 198, 162))
TUNICA_S, TUNICA_B, TUNICA_L = rampa((122, 118, 96), forca=46)
BOTA_S, BOTA_B, BOTA_L = rampa((92, 76, 60), forca=40)
CABELO_S, CABELO_B, CABELO_L = rampa((120, 82, 52), forca=50)


def _bloco_redondo(im, x, y, w, h, cor, cantos=True):
    ret(im, x, y, w, h, cor)
    if cantos and w > 2 and h > 2:
        apagar(im, x, y)
        apagar(im, x + w - 1, y)
        apagar(im, x, y + h - 1)
        apagar(im, x + w - 1, y + h - 1)


def _esfera(im, cx, cy, rx, ry, escuro, base, claro):
    """3 bandas, mas o limiar NAO e fixo -- ele encolhe conforme a esfera
    cresce. A v1 desta funcao usava limiar fixo (0.5 / -0.65): em 12px de
    raio isso e um corte suave (poucos pixel de cada lado), mas em 24px vira
    um corte duro atravessando o rosto inteiro, porque a AREA coberta pelo
    mesmo limiar cresce mais rapido que o raio. Compensar com um limiar mais
    alto (menos area de sombra) quando o raio cresce e o que mante a mesma
    LEITURA em qualquer tamanho -- prova de que nem toda regra desta formula
    escala por multiplicacao direta; sombreamento escala por AREA, nao por
    comprimento."""
    folga = min(0.32, 0.10 + rx * 0.012)
    lim_escuro = 0.5 + folga
    lim_claro = -0.65 - folga
    for y in range(round(cy - ry), round(cy + ry) + 1):
        for x in range(round(cx - rx), round(cx + rx) + 1):
            ndx = (x - cx) / max(rx, 0.01)
            ndy = (y - cy) / max(ry, 0.01)
            if ndx * ndx + ndy * ndy <= 1.0:
                if ndx + ndy > lim_escuro:
                    cor = escuro
                elif ndx + ndy < lim_claro:
                    cor = claro
                else:
                    cor = base
                px(im, x, y, cor)


def heroi(direcao, H, coluna="parado", detalhe=False):
    """`detalhe=True` liga os acrescimos que so cabem com mais pixel: mitene
    com 2 tons na mao, bota com sola, cabelo com sombra propria. NENHUM deles
    e anatomia nova -- so volume a mais em cima da mesma forma redonda."""
    f = formula_heroi(H)
    L = round(f["cabeca_d"] * 1.6)
    A = H + round(f["u"] * 2)
    CX = L // 2
    CHAO = A - round(f["u"])
    im = nova(L, A)
    perfil = direcao in ("esquerda", "direita")
    lado = -1 if direcao == "esquerda" else 1
    bal, sobe, braco_bal = deslocamento(coluna)

    perna_y = CHAO - f["bota_h"] - f["perna_h"]
    for lx, d in ((-1, bal), (1, -bal)):
        px_x = CX + lx * f["perna_offset"] + (d if not perfil else 0) - f["limb_w"] // 2
        _bloco_redondo(im, px_x, perna_y + sobe, f["limb_w"], f["perna_h"], PELE_B, cantos=False)
        by = perna_y + f["perna_h"] + sobe
        _bloco_redondo(im, px_x, by, f["limb_w"], f["bota_h"], BOTA_B)
        ret(im, px_x, by, f["limb_w"], 1, BOTA_L)
        if detalhe:
            ret(im, px_x, by + f["bota_h"] - 1, f["limb_w"], 1, BOTA_S)   # a sola

    tronco_y = perna_y - f["tronco_h"] + sobe
    _bloco_redondo(im, CX - f["tronco_w"] // 2, tronco_y, f["tronco_w"], f["tronco_h"], TUNICA_B)
    ret(im, CX - f["tronco_w"] // 2, tronco_y, f["tronco_w"] - (2 if perfil else 0), 1, TUNICA_L)
    ret(im, CX - f["tronco_w"] // 2, tronco_y + f["tronco_h"] - round(f["tronco_h"] * 0.2), f["tronco_w"], round(f["tronco_h"] * 0.2), TUNICA_S)

    for lx, bb in ((-1, braco_bal), (1, -braco_bal)):
        by = tronco_y + f["braco_y_recuo"] + (bb if abs(bb) >= 1 else 0)
        bx = CX + lx * f["braco_offset"] - f["limb_w"] // 2
        tom = PELE_S if (lx < 0 and perfil) else PELE_B
        _bloco_redondo(im, bx, by, f["limb_w"], f["braco_h"], tom, cantos=False)
        if detalhe:
            mao_y = by + f["braco_h"] - round(f["limb_w"] * 0.9)
            _bloco_redondo(im, bx - 1, mao_y, f["limb_w"] + 2, round(f["limb_w"] * 0.9), PELE_B)
            ret(im, bx - 1, mao_y, f["limb_w"] + 2, 1, PELE_L)

    cab_y = tronco_y - f["cabeca_r"]
    r = f["cabeca_r"]
    _esfera(im, CX, cab_y, r, r, PELE_S, PELE_B, PELE_L)

    cabelo_h = round(r * 0.62)
    for y in range(round(cab_y - r), round(cab_y - r + cabelo_h)):
        k = (y - (cab_y - r)) / max(1, cabelo_h - 1)
        larg = round((r * 2 + 1) * (1 - k * 0.32))
        tom = CABELO_S if k > 0.7 else CABELO_B
        ret(im, round(CX - larg / 2), y, larg, 1, tom)
    ret(im, round(CX - r * 0.7), round(cab_y - r), round(r * 0.55), 1, CABELO_L)

    if direcao != "cima" and coluna != "derrota":
        olho_y = round(cab_y - r * 0.05)
        if perfil:
            ox = round(CX + lado * r * 0.72)
            px(im, ox, olho_y, TINTA)
            if detalhe:
                px(im, ox, olho_y - 1, BRANCO)
            px(im, round(CX + lado * r * 0.92), olho_y + round(r * 0.15), PELE_S)
        else:
            for lx in (-1, 1):
                ox = round(CX + lx * r * 0.45)
                px(im, ox, olho_y, TINTA)
                if detalhe:
                    px(im, ox, olho_y - 1, BRANCO)
        by = round(cab_y + r * 0.35)
        bx = round(CX + (lado * r * 0.75 if perfil else -r * 0.35))
        elipse(im, bx, by, round(r * 0.28), round(r * 0.2), (200, 130, 118))

    luz_de_cima(im, [PELE_B, PELE_S, TUNICA_B, TUNICA_S, BOTA_B], PELE_L)
    contorno_seletivo(im, TINTA, TINTA_2)

    for i in range(round(CX - r), round(CX + r)):
        if 0 <= CHAO + 1 < A and im.getpixel((i, CHAO + 1))[3] == 0:
            px(im, i, CHAO + 1, (36, 30, 52, 60))
    return im, L, A


def validar():
    """Roda a formula com H=27 (o H do esboco redondo que funcionou) e
    confere que ela devolve os mesmos numeros escolhidos a mao la."""
    f = formula_heroi(27)
    esperado = dict(cabeca_d=12, tronco_h=9, tronco_w=10, limb_w=3, perna_offset=2, braco_offset=6)
    linhas = []
    ok_geral = True
    for k, v in esperado.items():
        ok = f[k] == v
        ok_geral &= ok
        linhas.append(f"  {k}: formula={f[k]}  esboco-que-funcionou={v}  {'OK' if ok else 'DIVERGIU'}")
    print("validacao da formula contra o esboco de 16x32:")
    print("\n".join(linhas))
    print("-> tudo bateu" if ok_geral else "-> ALGO DIVERGIU, a formula precisa de ajuste")


def comparacao(zoom=8):
    direcoes = ["baixo", "esquerda"]
    tamanhos = [27, 54]
    colunas = []
    for H in tamanhos:
        imgs = [heroi(d, H, detalhe=(H > 27))[0] for d in direcoes]
        colunas.append(imgs)

    Lmax = max(im.width for col in colunas for im in col)
    Amax = max(im.height for col in colunas for im in col)
    largura_total = Lmax * len(direcoes) * len(tamanhos) + 6 * (len(direcoes) * len(tamanhos) - 1)
    fora = Image.new("RGBA", (largura_total + 20, Amax + 20), (86, 122, 92, 255))
    x = 10
    for col in colunas:
        for im in col:
            fora.alpha_composite(im, (x, Amax - im.height + 10))
            x += Lmax + 6
    return fora.resize((fora.width * zoom, fora.height * zoom), Image.NEAREST)


def comparacao_com_hoje(zoom=6):
    corpo_im = pessoa.corpo("baixo", "parado", tom=0, raca="vale")
    bracos_im = pessoa.bracos("baixo", "parado", tom=0, raca="vale")
    hoje = Image.new("RGBA", (16, 32), (0, 0, 0, 0))
    hoje.alpha_composite(corpo_im)
    hoje.alpha_composite(bracos_im)

    grande, Lg, Ag = heroi("baixo", 54, detalhe=True)
    hoje_grande = hoje.resize((round(16 * Ag / 32), Ag), Image.NEAREST)

    fora = Image.new("RGBA", (hoje_grande.width + grande.width + 18, Ag + 12), (86, 122, 92, 255))
    fora.alpha_composite(hoje_grande, (6, 6))
    fora.alpha_composite(grande, (hoje_grande.width + 12, 6))
    return fora.resize((fora.width * zoom, fora.height * zoom), Image.NEAREST)


if __name__ == "__main__":
    validar()
    d1 = os.path.join(RAIZ, "docs", "referencia", "estudo-heroi-formula-tamanhos.png")
    comparacao().save(d1)
    print("escrito: docs/referencia/estudo-heroi-formula-tamanhos.png")
    d2 = os.path.join(RAIZ, "docs", "referencia", "estudo-heroi-formula-vs-hoje.png")
    comparacao_com_hoje().save(d2)
    print("escrito: docs/referencia/estudo-heroi-formula-vs-hoje.png")
