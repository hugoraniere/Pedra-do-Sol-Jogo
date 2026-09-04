# -*- coding: utf-8 -*-
"""Corpo, bracos e roupa das pessoas, 16 x 32.

Tres ideias sustentam este arquivo.

1. TODO MUNDO PISA NA MESMA LINHA. O pe fica sempre na linha 30 do quadro,
   seja crianca ou anao ou elfo. Quem e mais baixo tem perna mais curta, nao o
   desenho inteiro empurrado para baixo. Sem isso um personagem baixinho
   pareceria afundado no chao e outro alto pareceria flutuando.

2. A RACA MUDA O CORPO, nao so a cor. O Elfo tem orelha de folha e e alto e
   magro, o Anao e baixo e largo e usa barba, o Pequenino tem perna curtinha e
   pe descalco, a Cria de Dragao tem chifre, escama na bochecha e cauda. Se
   voce apagar todas as cores e olhar so a silhueta, ainda da para dizer qual e
   qual. E isso que separa pixel art de verdade de troca de paleta.

3. A CLASSE MUDA A ROUPA. A roupa e uma camada separada, desenhada em branco,
   que recebe a cor escolhida por tint dentro do jogo. Como corpo e roupa sao
   camadas diferentes, cinco racas vezes cinco classes dao vinte e cinco
   personagens sem desenhar vinte e cinco folhas.

A cabeca tem sempre o mesmo tamanho e a mesma largura. Isso e de proposito: e o
que permite um unico conjunto de cabelos e chapeus servir para todas as racas,
so descendo alguns pixels. A diferenca de altura entre as racas mora na perna.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from base import *  # noqa

# ------------------------------------------------- esqueleto, de baixo para cima
CHAO = 30                 # ultima linha da bota. todo personagem pisa aqui
BOTA_ALT = 3              # 28, 29, 30
CABECA_ALT = 10
CABECA_L = 10             # igual para todos, senao cabelo e chapeu nao encaixam

# Largura de cada linha da cabeca, de cima para baixo. O craneo e cheio ate a
# altura da boca e o queixo afina. Sem esse afinamento a cabeca termina num
# bloco reto de 10 px logo abaixo dos olhos, e o que se ve nao e um rosto: e um
# focinho. Foi o erro mais feio da primeira versao destes sprites.
LINHAS_CABECA = [10, 10, 10, 10, 10, 10, 10, 10, 8, 6]
PESCOCO = 1
TRONCO_ALT = 7

# a perna e o unico osso que muda de tamanho. e o que faz um ser mais baixo que
# o outro sem tirar ninguem do chao.
#
# Os numeros nao sao livres: eles decidem quanto sobra de ceu acima da cabeca do
# personagem MAIS ALTO, e e esse ceu que precisa caber a copa de um chapeu. Com
# perna mais comprida o elfo subia, e o chapeu de mago saia pela borda de cima
# do quadro. Hoje sobram 3 px ate no elfo, que e o que a copa tombada ocupa.
PERNAS = {"crianca": 2, "baixo": 3, "normal": 5, "alto": 7}

#: porte em que as camadas de cima (roupa, cabelo, chapeu, arma) sao desenhadas.
#: e o mais alto de proposito: assim todo deslocamento e para BAIXO, e nada
#: nunca sai pela borda de cima do quadro.
PORTE_BASE = "alto"

CORPOS = {
    #                 largura   largura   curva da   ombro
    #                 tronco    perna     barriga    caido
    "magro":    dict(tronco=6, perna=2, barriga=0, ombro=0),
    "normal":   dict(tronco=8, perna=2, barriga=0, ombro=0),
    "gordinho": dict(tronco=10, perna=3, barriga=1, ombro=1),
}


def esqueleto(altura="normal"):
    """As linhas de cada parte, ja resolvidas. Uma conta so, num lugar so."""
    perna = PERNAS[altura]
    bota_topo = CHAO - BOTA_ALT + 1
    perna_topo = bota_topo - perna
    tronco_topo = perna_topo - TRONCO_ALT
    cabeca_topo = tronco_topo - PESCOCO - CABECA_ALT
    return dict(
        perna=perna, bota_topo=bota_topo, perna_topo=perna_topo,
        tronco_topo=tronco_topo, cabeca_topo=cabeca_topo,
    )


#: quanto cabeca e tronco descem em relacao ao porte normal. o jogo usa este
#: numero para descer as camadas de cabelo, chapeu, roupa e arma na hora certa
def desloque(altura="normal"):
    return esqueleto(altura)["cabeca_topo"] - esqueleto(PORTE_BASE)["cabeca_topo"]


# ------------------------------------------------------------------ racas
RACAS = {
    "vale": dict(
        tipo="normal", altura="normal", orelha="redonda",
        barba=None, chifre=False, escama=False, descalco=False,
    ),
    "anao": dict(
        tipo="gordinho", altura="baixo", orelha="redonda",
        barba="ruivo", chifre=False, escama=False, descalco=False,
    ),
    "elfo": dict(
        tipo="magro", altura="alto", orelha="folha",
        barba=None, chifre=False, escama=False, descalco=False,
    ),
    "pequenino": dict(
        tipo="normal", altura="crianca", orelha="redonda",
        barba=None, chifre=False, escama=False, descalco=True,
    ),
    "dragao": dict(
        tipo="normal", altura="normal", orelha="pontuda",
        barba=None, chifre=True, escama=True, descalco=False,
    ),
}

ORDEM_RACAS = ["vale", "anao", "elfo", "pequenino", "dragao"]


def tracos(raca, **mudancas):
    """Ficha de uma raca, com o que voce quiser trocar por cima.
    E assim que um NPC vira "um anao sem barba" sem inventar raca nova."""
    d = dict(RACAS.get(raca, RACAS["vale"]))
    for k, v in mudancas.items():
        if v is not None:
            d[k] = v
    return d


def _lados(largura):
    """x inicial de um bloco centrado de dada largura, num sprite de 16."""
    return (16 - largura) // 2


def _tons(raca, tom):
    lista = TONS_POR_RACA.get(raca, PELE_TONS)
    return lista[tom % len(lista)]


# ------------------------------------------------------------------ corpo
def corpo(direcao, coluna, tom=0, raca="vale", **mudancas):
    direcao, giro = normalizar(direcao)
    t = tracos(raca, **mudancas)
    im = nova()
    c = CORPOS[t["tipo"]]
    e = esqueleto(t["altura"])
    sombra_pele, pele, luz_pele = _tons(raca, tom)
    perna_bal, sobe, _ = deslocamento(coluna)
    tonto = coluna == "tonto"

    topo = e["cabeca_topo"] + sobe + (1 if tonto else 0)
    cab_x = _lados(CABECA_L)
    cab_l = CABECA_L

    # De perfil o corpo humano nao e o de frente com um olho a menos: ele e mais
    # FINO, tem UMA orelha e as pernas ficam uma atras da outra. Fazer as tres
    # coisas e o que separa "virou a cara" de "virou o corpo".
    perfil = direcao in ("esquerda", "direita")

    def do_lado_de_tras(ponto):
        """De perfil so aparece a orelha do lado da NUCA. Olhando para a
        esquerda a nuca esta a direita, e vice-versa. Desenhar as duas e o que
        faz o rosto de lado parecer torcido -- o goblin ja acertava isto e o
        heroi nao."""
        if not perfil:
            return True
        return ponto[0] >= 8 if direcao == "esquerda" else ponto[0] < 8

    # ------------------------------------------------------------ cabeca
    for i, larg in enumerate(LINHAS_CABECA):
        ret(im, _lados(larg), topo + i, larg, 1, pele)
    ret(im, cab_x + 1, topo, cab_l - 2, 1, luz_pele)      # luz no alto
    for i in (len(LINHAS_CABECA) - 2, len(LINHAS_CABECA) - 1):
        larg = LINHAS_CABECA[i]
        ret(im, _lados(larg), topo + i, larg, 1, sombra_pele)   # queixo na sombra
    ret(im, cab_x + cab_l - 1, topo + 2, 1, 7, sombra_pele)     # lado da sombra
    apagar(im, cab_x, topo)
    apagar(im, cab_x + cab_l - 1, topo)

    # de costas nao ha rosto, entao o que da forma e a nuca: uma sombra na base
    # do craneo e o vinco do pescoco. sem isso a cabeca vira um tijolo flutuando
    if direcao == "cima":
        ret(im, cab_x + 1 + giro, topo + CABECA_ALT - 3, cab_l - 2, 1, sombra_pele)
        pontos(im, [(cab_x - 1, topo + CABECA_ALT // 2 + 1),
                    (cab_x + cab_l, topo + CABECA_ALT // 2 + 1)], pele)
        if giro:
            # de costas virando, aparece a ponta do queixo do lado do giro
            qx = cab_x - 1 if giro < 0 else cab_x + cab_l
            px(im, qx, topo + CABECA_ALT - 4, sombra_pele)

    # ----------------------------------------------------------- orelhas
    # tres formatos. a orelha e o traco que aparece na silhueta, entao e ela
    # que diz a raca antes mesmo de a cor entrar
    if direcao != "cima":
        oy = topo + CABECA_ALT // 2
        # de tres quartos so a orelha da frente aparece inteira
        if t["orelha"] == "folha":
            pontos(im, [p for p in [
                        (cab_x - 1, oy), (cab_x - 1, oy + 1), (cab_x - 2, oy - 1),
                        (cab_x - 2, oy - 2), (cab_x - 3, oy - 3),
                        (cab_x + cab_l, oy), (cab_x + cab_l, oy + 1),
                        (cab_x + cab_l + 1, oy - 1), (cab_x + cab_l + 1, oy - 2),
                        (cab_x + cab_l + 2, oy - 3)] if do_lado_de_tras(p)], pele)
            pontos(im, [p for p in [
                        (cab_x - 1, oy + 2), (cab_x + cab_l, oy + 2),
                        (cab_x - 2, oy - 1), (cab_x + cab_l + 1, oy - 1)]
                        if do_lado_de_tras(p)], sombra_pele)
        elif t["orelha"] == "pontuda":
            pontos(im, [p for p in [
                        (cab_x - 1, oy), (cab_x - 1, oy + 1), (cab_x - 2, oy),
                        (cab_x + cab_l, oy), (cab_x + cab_l, oy + 1),
                        (cab_x + cab_l + 1, oy)] if do_lado_de_tras(p)], pele)
        else:
            # a orelha redonda era 1 px SO, um ponto perdido na silhueta -- de
            # perfil, com so uma orelha aparecendo (a outra e escondida por
            # do_lado_de_tras), 1 px sozinho debaixo de cabelo ou chapeu nao
            # sobrevive: e o que o Anao, o Vale e o Pequenino tem em comum, e
            # e por isso que o rosto de perfil deles parecia sem orelha
            # nenhuma. Tres linhas fazem um lobulo pequeno, mas que se ve.
            pontos(im, [p for p in [
                        (cab_x - 1, oy), (cab_x - 1, oy + 1), (cab_x - 1, oy + 2),
                        (cab_x + cab_l, oy), (cab_x + cab_l, oy + 1), (cab_x + cab_l, oy + 2)]
                        if do_lado_de_tras(p)], pele)
            pontos(im, [p for p in [(cab_x - 1, oy + 2), (cab_x + cab_l, oy + 2)]
                        if do_lado_de_tras(p)], sombra_pele)

    # ------------------------------------------------------------ chifres
    # dois tocos claros no alto da cabeca, visiveis tambem de costas
    if t["chifre"]:
        for lado in (cab_x + 1, cab_x + cab_l - 2):
            px(im, lado, topo - 1, CHIFRE)
            px(im, lado, topo - 2, CHIFRE)
            px(im, lado + (1 if lado < 8 else -1), topo - 3, CHIFRE_E)

    # ------------------------------------------------------------- rosto
    olho_y = topo + 5
    boca_y = topo + CABECA_ALT - 3
    if tonto:
        for bx in (cab_x + 1, cab_x + cab_l - 3):
            pontos(im, [(bx, olho_y), (bx + 1, olho_y + 1), (bx, olho_y + 2),
                        (bx + 1, olho_y)], TINTA)
    elif direcao == "baixo":
        # nas diagonais os dois olhos e a boca escorregam um pixel para o lado
        # do giro, e um narizinho aparece fora da silhueta daquele lado. Sao os
        # dois unicos sinais que cabem: sem eles a diagonal fica identica a
        # frente, e o jogador ve o personagem andar de lado sem virar a cara
        e1 = cab_x + 1 + giro
        e2 = cab_x + cab_l - 3 + giro
        for ex in (e1, e2):
            ret(im, ex, olho_y, 2, 1, TINTA)          # cilio
            ret(im, ex, olho_y + 1, 2, 2, BRANCO)     # branco do olho
            ret(im, ex + 1, olho_y + 1, 1, 2, TINTA)  # pupila
        pontos(im, [(e1, olho_y - 2), (e1 + 1, olho_y - 2),
                    (e2, olho_y - 2), (e2 + 1, olho_y - 2)], TINTA_2)
        ret(im, 7 + giro, boca_y, 2, 1, sombra_pele)
        pontos(im, [(cab_x, boca_y - 1), (cab_x + cab_l - 1, boca_y - 1)], (216, 148, 138))
        px(im, 7 + giro, boca_y + 1, sombra_pele)
        if giro:
            nx = cab_x - 1 if giro < 0 else cab_x + cab_l
            px(im, nx, olho_y + 1, pele)
            px(im, nx, olho_y + 2, sombra_pele)
    elif direcao in ("esquerda", "direita"):
        # de perfil aparece UM olho so, e menor que os de frente. dois olhos ou
        # um olho do mesmo tamanho fazem a cabeca parecer torcida
        esq = direcao == "esquerda"
        ox = cab_x + 1 if esq else cab_x + cab_l - 3
        ret(im, ox, olho_y, 2, 1, TINTA)              # cilio
        ret(im, ox, olho_y + 1, 2, 2, BRANCO)
        ret(im, ox if esq else ox + 1, olho_y + 1, 1, 2, TINTA)
        pontos(im, [(ox, olho_y - 2), (ox + 1, olho_y - 2)], TINTA_2)
        # o nariz sai na altura do olho, nao embaixo. embaixo ele vira focinho
        nx = cab_x - 1 if esq else cab_x + cab_l
        px(im, nx, olho_y + 1, pele)
        px(im, nx, olho_y + 2, sombra_pele)
        px(im, cab_x + (1 if esq else cab_l - 2), boca_y, sombra_pele)

    # ------------------------------------------------------------ escamas
    # duas escamas na bochecha, so de frente e de lado, senao vira sujeira
    if t["escama"] and direcao != "cima" and not tonto:
        if direcao == "baixo":
            pontos(im, [(cab_x, olho_y + 3), (cab_x + 1, olho_y + 4),
                        (cab_x + cab_l - 1, olho_y + 3), (cab_x + cab_l - 2, olho_y + 4)],
                   luz_pele)
        else:
            lado = cab_x if direcao == "esquerda" else cab_x + cab_l - 1
            pontos(im, [(lado, olho_y + 3), (lado, olho_y + 5)], luz_pele)

    # -------------------------------------------------------------- barba
    if t["barba"] and direcao != "cima":
        # a barba acompanha o afinamento do queixo e continua afinando abaixo
        # dele. Se ela sair reta com a largura do craneo, passa por fora da
        # cabeca e o anao ganha uma prancha presa no rosto
        cor_barba = BARBA_TONS.get(t["barba"], BARBA_TONS["castanho"])
        escura = tuple(max(0, v - 32) for v in cor_barba)
        for i, larg in enumerate([10, 10, 8, 6, 4]):
            ret(im, _lados(larg), boca_y - 1 + i, larg, 1, cor_barba)
        ret(im, _lados(4), boca_y + 3, 4, 1, escura)
        if direcao == "baixo":
            ret(im, 7, boca_y, 2, 1, escura)   # a boca aparece no meio da barba

    # ------------------------------------------------------------ tronco
    # de perfil os ombros somem e o peito vira uma faixa fina: 2 px a menos
    tr_l = c["tronco"] - (2 if perfil else 0)
    tr_x = _lados(tr_l)
    tr_topo = e["tronco_topo"] + sobe
    ret(im, 7, tr_topo - 1, 2, 1, sombra_pele)          # pescoco
    ret(im, tr_x, tr_topo, tr_l, TRONCO_ALT, pele)
    ret(im, tr_x + tr_l - 1, tr_topo, 1, TRONCO_ALT, sombra_pele)
    apagar(im, tr_x, tr_topo)
    apagar(im, tr_x + tr_l - 1, tr_topo)
    if c["barriga"]:
        # barriga: uma coluna a mais nos dois lados, so na parte de baixo
        ret(im, tr_x - 1, tr_topo + 3, 1, TRONCO_ALT - 3, pele)
        ret(im, tr_x + tr_l, tr_topo + 3, 1, TRONCO_ALT - 3, sombra_pele)

    # -------------------------------------------------------------- cauda
    # so de costas e de lado. de frente ela ficaria escondida pelo corpo, e
    # desenhar por fora so faria o boneco parecer torto
    if t["escama"]:
        by = e["perna_topo"] + sobe
        if direcao == "cima":
            pontos(im, [(8, by + 1), (8, by + 3), (9, by + 5)], sombra_pele)
        elif direcao == "esquerda":
            pontos(im, [(tr_x + tr_l, by - 2), (tr_x + tr_l + 1, by - 1),
                        (tr_x + tr_l + 2, by + 1)], sombra_pele)
        elif direcao == "direita":
            pontos(im, [(tr_x - 1, by - 2), (tr_x - 2, by - 1),
                        (tr_x - 3, by + 1)], sombra_pele)

    # ------------------------------------------------------------ pernas
    pe_l = c["perna"]
    vao = 2
    px_esq = 8 - vao // 2 - pe_l
    px_dir = 8 + vao // 2
    if perfil:
        # de perfil as duas pernas ocupam quase a mesma faixa de x. Quem diz
        # qual esta atras e o TOM, nao a posicao: com as duas na mesma cor o
        # olho le duas pernas irmas lado a lado, que e o defeito que isto
        # conserta
        # exatamente o MESMO x para as duas: uma fica atras da outra, nao ao
        # lado. Com 1 px de diferenca a passada saia torta, porque as duas
        # partiam de lugares diferentes e abriam o mesmo tanto
        px_esq = px_dir = 8 - pe_l // 2 - 1
    pe_topo = e["perna_topo"] + sobe
    alt = e["perna"]
    def passada(bal):
        """(deslocamento em x, mudanca de altura) desta perna neste quadro.

        De perfil a passada e X puro: a perna avanca e recua, e e assim que se
        anda. De frente ela vai na direcao da camera, entao quase nada dela
        cabe: sobra 1 px de x e o pe do lado de tras subindo, que e o sinal
        possivel nessa vista.

        O -1 no perfil (so quando avanca) e o pe DESCOLANDO do chao. Sem ele, o
        unico sinal de passo era o tom (perna de tras em sombra) trocando de
        lado -- e sombra de perna e sutil demais, de tao apertada num quadro
        de 16 px, para o olho ler como passo. Silhueta mudando de posicao E
        de altura junto e o que finalmente parece andar, nao so reacender."""
        if not bal:
            return 0, 0
        sinal = 1 if bal > 0 else -1
        # 1 px a mais de passada no perfil: com a passada crua os dois pes, que
        # sao mais largos que a perna, se encostam e viram uma tabua so
        return (bal + sinal, -1 if sinal > 0 else 0) if perfil else (sinal, sinal)

    for i, (x, bal) in enumerate(((px_esq, perna_bal), (px_dir, -perna_bal))):
        # a de tras, no perfil, sai chapada em tom de sombra e sem luz propria
        atras = perfil and i == 0
        tom_perna = sombra_pele if atras else pele
        dx, dh = passada(bal)
        ret(im, x + dx, pe_topo, pe_l, alt + dh, tom_perna)
        ret(im, x + dx + pe_l - 1, pe_topo, 1, alt + dh, sombra_pele)

    # -------------------------------------------------- botas ou pe no chao
    for i, (x, bal) in enumerate(((px_esq, perna_bal), (px_dir, -perna_bal))):
        dx, dh = passada(bal)
        y = pe_topo + alt + dh
        # de perfil o pe aponta para onde ele anda, e fica comprido em x
        larg = pe_l + (2 if perfil else 1)
        if perfil:
            bx = x + dx - (1 if direcao == "esquerda" else 0)
        else:
            bx = x + dx - (1 if x < 8 else 0)
        if t["descalco"]:
            # o Pequenino do Trigo anda descalco, com pe grande e chato
            ret(im, bx, y, larg + 1, BOTA_ALT - 1, pele)
            ret(im, bx, y + BOTA_ALT - 2, larg + 1, 1, sombra_pele)
        else:
            ret(im, bx, y, larg, BOTA_ALT, MADEIRA_E)
            ret(im, bx, y, larg, 1, MADEIRA)
            ret(im, bx, y + BOTA_ALT - 1, larg, 1, TINTA_2)

    # a luz de cima antes do contorno: ela mexe em pixel que ja existe, o
    # contorno cria pixel novo fora da silhueta
    luz_de_cima(im, [pele, sombra_pele], luz_pele)
    contorno_seletivo(im, TINTA, TINTA_2)
    sombra_chao(im, 5 if t["tipo"] == "magro" else 6, CHAO)
    return im


# ------------------------------------------------------------------ braco
LARGURA_BRACO = 2


def geometria(direcao, coluna, raca="vale", **mudancas):
    """Onde cada peca do corpo esta neste quadro.

    Uma fonte so. O desenho do braco e o PONTO DE ENCAIXE da arma saem daqui,
    porque se fossem duas contas parecidas em lugares diferentes elas iam
    divergir na primeira vez que alguem mexesse na largura do tronco, e a arma
    passaria a flutuar ao lado da mao sem ninguem entender por que."""
    direcao, _giro = normalizar(direcao)
    t = tracos(raca, **mudancas)
    c = CORPOS[t["tipo"]]
    e = esqueleto(t["altura"])
    _, sobe, balanco = deslocamento(coluna)

    # a MESMA conta de corpo(): de perfil o tronco e 2 px mais fino. Sem repetir
    # aqui, o braco ficava ancorado na largura de frente enquanto corpo() ja
    # desenhava um tronco mais estreito -- a mao saia flutuando 1 px fora do
    # corpo, ou afundada dentro dele, dependendo da direcao.
    perfil = direcao in ("esquerda", "direita")
    tr_l = min(12, c["tronco"] + (2 if c["barriga"] else 0)) - (2 if perfil else 0)
    tr_x = _lados(tr_l)
    ombro_y = e["tronco_topo"] + sobe + c["ombro"]
    alt_braco = TRONCO_ALT - c["ombro"]

    if coluna == "conjura":
        forte = (tr_x + tr_l, e["cabeca_topo"] + 3)
        fraco = (tr_x - 2, ombro_y + 1)
    elif direcao == "esquerda":
        # de perfil o braco vai para a FRENTE e para tras, no eixo do movimento.
        # O mesmo 1 px em Y que funciona de frente aqui nao le nada
        forte, fraco = (tr_x - balanco, ombro_y), None
    elif direcao == "direita":
        forte, fraco = (tr_x + tr_l - 2 + balanco, ombro_y), None
    else:
        forte = (tr_x + tr_l, ombro_y - balanco)
        fraco = (tr_x - 2, ombro_y + balanco)

    # No corpo gordinho os bracos ja encostam nas duas bordas do quadro de 16 px.
    # Se a mao ficar na ponta do braco, qualquer arma um pouco larga fica com
    # metade para fora, e o NPC, que e achatado num quadro so, perde esse pedaco.
    # Entao a mao recua o suficiente para caber a arma mais larga que existe.
    # 3 e a maior distancia entre a borda de uma arma e o ponto de pega dela
    # (o arco, ver arte/equipamento.py). Manter a mao dentro desta faixa e o que
    # garante que nenhuma arma seja cortada, em nenhuma raca, em nenhum quadro.
    MARGEM_ARMA = 3

    def mao(braco):
        # a mao e o pixel de BAIXO e de FORA do braco, que e onde a mao fecha
        x, y = braco
        ponta = x if x < 8 else x + LARGURA_BRACO - 1
        return (min(max(ponta, MARGEM_ARMA), 16 - MARGEM_ARMA), y + alt_braco - 1)

    return dict(
        tracos=t,
        tronco=(8, e["tronco_topo"] + sobe),
        cabeca=(8, e["cabeca_topo"] + sobe + (1 if coluna == "tonto" else 0)),
        pe=(8, CHAO),
        braco_forte=forte,
        braco_fraco=fraco,
        altura_braco=alt_braco,
        mao=mao(forte),
        mao_fraca=mao(fraco) if fraco else None,
    )


def bracos(direcao, coluna, tom=0, raca="vale", **mudancas):
    direcao, giro = normalizar(direcao)
    g = geometria(direcao, coluna, raca, **mudancas)
    t = g["tracos"]
    im = nova()
    sombra_pele, pele, _ = _tons(raca, tom)
    alt_braco = g["altura_braco"]

    def desenhar(braco, fora):
        """Braco, pulso e mao.

        A MAO E UM DEGRAU NA SILHUETA. O braco tem 2 px; a mao tem 3, e o pixel
        a mais aponta para FORA do corpo. Entre os dois vai uma linha de sombra,
        que e o pulso. Sao esses dois sinais que fazem o olho ver uma mao: sem
        eles o braco termina cego e o personagem parece ter cotos, que era o
        estado ate aqui. Nao da para so alargar a ponta -- sem o pulso a mao
        vira continuacao do braco e ninguem ve corte nenhum."""
        if braco is None:
            return
        x, y = braco
        larg = LARGURA_BRACO
        alt = alt_braco - 3                     # o resto e pulso e mao
        ret(im, x, y, larg, alt, pele)
        ret(im, x + larg - 1, y, 1, alt, sombra_pele)

        pulso = y + alt
        ret(im, x, pulso, larg, 1, sombra_pele)  # o corte que separa a mao

        mx = x - 1 if fora < 0 else x           # o degrau cresce para fora
        ret(im, mx, pulso + 1, larg + 1, 2, pele)
        ret(im, mx, pulso + 1, larg + 1, 1, _tons(raca, tom)[2])
        ret(im, mx, pulso + 2, larg + 1, 1, sombra_pele)
        if t["escama"]:
            # garra clara na ponta da mao da Cria de Dragao
            ret(im, mx, pulso + 2, larg + 1, 1, CHIFRE_E)

    # o degrau da mao aponta para fora do corpo: o braco da esquerda cresce
    # para a esquerda, o da direita para a direita
    desenhar(g["braco_forte"], -1 if g["braco_forte"][0] < 8 else 1)
    desenhar(g["braco_fraco"], -1 if (g["braco_fraco"] or (0,))[0] < 8 else 1)
    luz_de_cima(im, [pele, sombra_pele], _tons(raca, tom)[2])
    contorno_seletivo(im, TINTA, TINTA_2)
    return im


def pontos_da_raca(raca):
    """Os pontos de encaixe dos 24 quadros, na ordem em que o jogo os numera:
    indice = linha da direcao vezes 6, mais a coluna. O jogo le isto de
    public/assets/encaixes.json e nao precisa saber nada de anatomia."""
    saida = {"mao": [], "maoFraca": [], "tronco": [], "cabeca": []}
    for direcao in LINHAS:
        for coluna in COLUNAS:
            g = geometria(direcao, coluna, raca)
            saida["mao"].append(list(g["mao"]))
            saida["maoFraca"].append(list(g["mao_fraca"]) if g["mao_fraca"] else None)
            saida["tronco"].append(list(g["tronco"]))
            saida["cabeca"].append(list(g["cabeca"]))
    return saida
