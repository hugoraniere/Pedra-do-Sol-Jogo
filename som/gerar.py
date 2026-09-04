# -*- coding: utf-8 -*-
"""Gerador de som de rascunho do Reino de Aurora.

    npm run som

Faz o mesmo que arte/gerar.py faz com pixel: o repositorio guarda a RECEITA, nao o
resultado. Nenhum arquivo de audio colado na mao.

O que sai daqui NAO e som final. E bipe e ruido sintetizado, feito para:

  . a banca de audicao funcionar de ponta a ponta hoje
  . dar para ouvir a cadencia do passo no jogo de verdade, com o pe
  . dar para ajustar volume e variacao de altura antes de ter som bom
  . cada som bom que chegar substitui o rascunho, um por um

Um rascunho vira definitivo assim: ponha o arquivo em som/prontos/<nome>.mp3 e ele
ganha do gerado, do mesmo jeito que arte/sprites/ ganha da arte gerada.

So depende da biblioteca padrao do Python. Se o ffmpeg estiver instalado, converte
para MP3 no fim; se nao estiver, deixa em WAV e o jogo toca igual.
"""

import json
import math
import os
import random
import shutil
import struct
import subprocess
import wave

TAXA = 22050  # 22 kHz basta de sobra para bipe, e o arquivo fica pequeno
RAIZ = os.path.dirname(os.path.abspath(__file__))
SAIDA = os.path.join(RAIZ, "..", "public", "assets", "som")
PRONTOS = os.path.join(RAIZ, "prontos")

# semente fixa: gerar duas vezes tem que dar o mesmo arquivo, senao o manifesto
# acusa mudanca em todo mundo a cada rodada
SEMENTE = 20260904


# --------------------------------------------------------------- primitivas

def quadros(dur):
    return max(1, int(TAXA * dur))


def onda(tipo, freq, dur, fase=0.0):
    """sen, quadrada, dente, triangulo ou ruido."""
    n = quadros(dur)
    fora = []
    for i in range(n):
        t = i / TAXA
        f = freq(t) if callable(freq) else freq
        fase += 2 * math.pi * f / TAXA
        x = fase % (2 * math.pi)
        if tipo == "sen":
            v = math.sin(x)
        elif tipo == "quadrada":
            v = 1.0 if x < math.pi else -1.0
        elif tipo == "dente":
            v = x / math.pi - 1.0
        elif tipo == "triangulo":
            v = 2 * abs(x / math.pi - 1.0) - 1.0
        else:  # ruido
            v = random.uniform(-1, 1)
        fora.append(v)
    return fora


def envelope(sinal, ataque=0.005, queda=None, sustenta=1.0):
    """Sobe rapido e cai. Sem isto todo som estala no comeco e no fim."""
    n = len(sinal)
    a = quadros(ataque)
    q = n if queda is None else quadros(queda)
    fora = []
    for i, v in enumerate(sinal):
        if i < a:
            g = i / a
        else:
            resto = (i - a) / max(1, q)
            g = max(0.0, (1.0 - resto)) * sustenta
        fora.append(v * g)
    return fora


def passa_baixa(sinal, corte):
    """Filtro de um polo. Abafa o ruido: e o que separa passo na grama de passo
    na pedra, sem precisar de duas amostras diferentes."""
    if corte >= TAXA / 2:
        return sinal
    rc = 1.0 / (2 * math.pi * corte)
    dt = 1.0 / TAXA
    alfa = dt / (rc + dt)
    fora = []
    ant = 0.0
    for v in sinal:
        ant = ant + alfa * (v - ant)
        fora.append(ant)
    return fora


def passa_alta(sinal, corte):
    rc = 1.0 / (2 * math.pi * corte)
    dt = 1.0 / TAXA
    alfa = rc / (rc + dt)
    fora = []
    ant_e = ant_s = 0.0
    for v in sinal:
        ant_s = alfa * (ant_s + v - ant_e)
        ant_e = v
        fora.append(ant_s)
    return fora


def somar(*sinais):
    n = max(len(s) for s in sinais)
    fora = [0.0] * n
    for s in sinais:
        for i, v in enumerate(s):
            fora[i] += v
    return fora


def emendar(*sinais):
    fora = []
    for s in sinais:
        fora.extend(s)
    return fora


def silencio(dur):
    return [0.0] * quadros(dur)


def ganho(sinal, g):
    return [v * g for v in sinal]


def emenda_de_loop(sinal, cruzamento=0.25):
    """Faz o fim casar com o comeco, senao o loop estala a cada volta."""
    n = quadros(cruzamento)
    if n * 2 >= len(sinal):
        return sinal
    fora = list(sinal)
    for i in range(n):
        p = i / n
        fora[i] = sinal[i] * p + sinal[len(sinal) - n + i] * (1 - p)
    return fora[: len(sinal) - n]


def normalizar(sinal, pico=0.85):
    m = max((abs(v) for v in sinal), default=0.0)
    if m < 1e-6:
        return sinal
    k = pico / m
    return [v * k for v in sinal]


def deslize(f0, f1):
    """Frequencia que caminha de f0 a f1 ao longo do som."""
    return lambda t, f0=f0, f1=f1: f0 + (f1 - f0) * min(1.0, t * 8)


# ------------------------------------------------------------------ receitas

def passo(corte, grave, dur=0.11):
    """O passo.

    O CORPO MORA NO MEDIO, e isso e de proposito. O alto-falante do iPad nao
    entrega quase nada abaixo de uns 300 Hz: passo que se apoia no grave soa
    cheio no fone e some no aparelho em que o Lele joga. Entao o peso vem de
    uma faixa media que o aparelho consegue reproduzir, e o grave entra so como
    reforco para quem estiver de fone.

    A cauda tambem e mais longa que o normal. Depois de normalizar o pico, som
    curto e magro fica mais baixo que som cheio no mesmo pico: quem manda no
    quanto se ouve nao e o pico, e quanta energia tem embaixo dele."""
    r = passa_baixa(onda("ruido", 0, dur), corte)
    medio = envelope(
        passa_alta(passa_baixa(onda("ruido", 0, dur), corte * 2.2), 480),
        0.001, dur * 0.5
    )
    corpo = onda("sen", deslize(grave * 2.4, grave), dur)
    return envelope(
        somar(ganho(r, 0.7), ganho(medio, 0.6), ganho(corpo, 0.45)),
        0.002, dur * 0.9
    )


def blip(freq, dur=0.05, tipo="quadrada"):
    return envelope(onda(tipo, freq, dur), 0.004, dur)


def arpejo(notas, passo_dur=0.07, tipo="quadrada"):
    return emendar(*[blip(f, passo_dur, tipo) for f in notas])


def assobio(f0, f1, dur=0.22):
    r = passa_alta(onda("ruido", 0, dur), 900)
    corpo = onda("sen", deslize(f0, f1), dur)
    return envelope(somar(ganho(r, 0.55), ganho(corpo, 0.3)), 0.02, dur)


def pancada(freq, corte, dur=0.16):
    r = passa_baixa(onda("ruido", 0, dur), corte)
    corpo = onda("sen", deslize(freq, freq * 0.4), dur)
    return envelope(somar(ganho(r, 0.6), ganho(corpo, 0.7)), 0.001, dur * 0.6)


def leito(corte, dur=4.0, brilho=0.0):
    """Colchao de ambiente: ruido filtrado, em loop sem emenda."""
    r = passa_baixa(onda("ruido", 0, dur + 0.4), corte)
    if brilho:
        r = somar(r, ganho(passa_alta(onda("ruido", 0, dur + 0.4), 2500), brilho))
    return emenda_de_loop(r, 0.3)


def crepitar(dur=3.0):
    """Fogueira: estalos aleatorios sobre um sopro baixo."""
    base = passa_baixa(onda("ruido", 0, dur + 0.3), 420)
    fora = ganho(base, 0.45)
    n = len(fora)
    for _ in range(int(dur * 14)):
        i = random.randrange(0, n - 900)
        estalo = envelope(passa_alta(onda("ruido", 0, 0.03), 1800), 0.001, 0.03)
        for k, v in enumerate(estalo):
            if i + k < n:
                fora[i + k] += v * random.uniform(0.25, 0.8)
    return emenda_de_loop(fora, 0.3)


def canto(f0, f1, voltas=3, dur=0.06):
    """Passarinho: subidas rapidas repetidas."""
    partes = []
    for i in range(voltas):
        partes.append(envelope(onda("sen", deslize(f0, f1), dur), 0.006, dur))
        partes.append(silencio(0.035))
        f0 *= 1.04
        f1 *= 1.03
    return emendar(*partes)


# -------------------------------------------------------------------- musica
#
# A TRILHA E O UNICO SOM DO JOGO QUE E ESCRITO, nao sintetizado no escuro. O
# resto daqui e ruido filtrado e bipe: ninguem "compoe" um passo na grama. Ja
# uma musiquinha ou tem melodia ou nao e musiquinha, entao a melodia esta escrita
# nota por nota mais abaixo, em numero de nota MIDI, e da pra mexer nela sem
# entender nada de sintese.
#
# Continua sendo rascunho. Trilha gravada por gente entra por som/prontos/ e
# ganha desta, igual todo o resto.

def hz(nota):
    """Nota MIDI em hertz. 69 e o la 440.

    Escrever a melodia em numero de nota em vez de frequencia deixa ela legivel
    (69, 71, 74 e um trecho subindo) e transpor a musica inteira vira uma soma."""
    return 440.0 * (2 ** ((nota - 69) / 12.0))


def queda_exp(sinal, meia_vida):
    """Perde metade da forca a cada meia_vida.

    Corda e sino caem assim. O envelope reto que serve pros efeitos soa, numa
    nota longa, como alguem baixando o volume na mao."""
    k = math.log(0.5) / max(1.0, quadros(meia_vida))
    return [v * math.exp(k * i) for i, v in enumerate(sinal)]


def pontas(sinal, sobe=0.006, desce=0.03):
    """Zera as duas pontas. Nota que comeca ou acaba longe do zero estala, e numa
    trilha em loop esse estalo toca de novo a cada volta."""
    n = len(sinal)
    a, r = min(quadros(sobe), n), min(quadros(desce), n)
    for i in range(a):
        sinal[i] *= i / a
    for i in range(r):
        sinal[n - 1 - i] *= i / r
    return sinal


def nota_tocada(freq, dur, tipo="sen", meia=0.4, sobra=1.7):
    """Uma nota que soa e some sozinha.

    Dura mais que o tempo dela de proposito: e a cauda passando por cima da nota
    seguinte que faz a frase soar tocada em vez de digitada."""
    return pontas(queda_exp(onda(tipo, freq, dur * sobra), meia * dur))


def sino(freq, dur):
    """Caixinha de musica: os harmonicos brilham e somem antes do fundamental.

    Timbre escolhido pra aguentar loop. Ataque duro cansa em tres voltas, e esta
    faixa vai ficar tocando enquanto o Lele monta o personagem pela decima vez."""
    return somar(
        nota_tocada(freq, dur, "sen", 0.45),
        ganho(nota_tocada(freq * 2, dur, "sen", 0.22), 0.30),
        ganho(nota_tocada(freq * 3.01, dur, "sen", 0.13), 0.14),
        ganho(nota_tocada(freq * 4.72, dur, "sen", 0.07), 0.07),
    )


def corda(freq, dur):
    """Dedilhado: mais madeira que vidro. Acompanha sem disputar com a melodia."""
    return somar(
        nota_tocada(freq, dur, "triangulo", 0.3),
        ganho(nota_tocada(freq * 2, dur, "sen", 0.15), 0.2),
    )


def sopro(freq, dur):
    """A almofada do acorde: entra e sai devagar, nunca chama atencao. E ela que
    da chao pra trilha sem colocar mais uma melodia disputando espaco."""
    s = onda("sen", freq, dur)
    n = len(s)
    a = min(quadros(min(0.9, dur * 0.45)), n // 2)
    for i in range(a):
        s[i] *= i / a
        s[n - 1 - i] *= i / a
    return s


def sequenciar(volta, eventos):
    """Escreve as notas num trecho do tamanho exato de uma volta.

    O QUE PASSAR DO FIM VOLTA PRO COMECO em vez de ser cortado. E isso que faz a
    trilha emendar sem costura e ainda assim cair no tempo certo: quando a
    primeira nota volta, a cauda do ultimo sino ja esta tocando por cima dela.
    Fazer isso com fade cruzado, como nos ambientes, encurtaria o trecho e
    desalinharia o compasso."""
    n = quadros(volta)
    fora = [0.0] * n
    for inicio, sinal, vol in eventos:
        i0 = quadros(inicio) % n
        for k, v in enumerate(sinal):
            fora[(i0 + k) % n] += v * vol
    return fora


def frase(notas, batida, timbre, vol):
    """notas: (em que batida entra, nota MIDI, quantas batidas dura)."""
    return [(t * batida, timbre(hz(m), d * batida), vol) for t, m, d in notas]


def acompanhar(acordes, batida, compasso, vol_sopro, vol_baixo):
    """De cada acorde saem duas coisas: a almofada que segura o compasso inteiro
    e a nota grave que marca onde ele comeca."""
    ev = []
    for inicio, almofada, baixo in acordes:
        for m in almofada:
            ev.append((inicio * batida, sopro(hz(m), compasso * batida), vol_sopro))
        for k in (0, compasso / 2):
            ev.append(((inicio + k) * batida,
                       nota_tocada(hz(baixo), 1.4 * batida, "triangulo", 0.45),
                       vol_baixo))
    return ev


# --- menu: fora do mundo -----------------------------------------------------
# Vale pro Titulo, pro Carregar e pra Criacao: pro jogador os tres sao o mesmo
# lugar. Re maior, 66 por minuto, caixinha de musica. Devagar de proposito: e a
# tela onde alguem fica parado mais tempo, e musica animada em tela parada irrita.
# (batida em que entra, notas da almofada, nota do baixo)
MENU_ACORDES = [
    (0,  [57, 62, 66], 50),   # Re
    (8,  [54, 59, 66], 47),   # Si menor
    (16, [55, 59, 62], 43),   # Sol
    (24, [57, 61, 64], 45),   # La
]
MENU_MELODIA = [
    (0, 69, 1.5), (1.5, 66, 0.5), (2, 62, 2), (4, 64, 1), (5, 66, 3),
    (8, 74, 1.5), (9.5, 71, 0.5), (10, 69, 2), (12, 66, 1), (13, 69, 3),
    (16, 71, 1), (17, 69, 1), (18, 67, 2), (20, 62, 1), (21, 67, 3),
    (24, 69, 1), (25, 71, 1), (26, 73, 2), (28, 69, 4),
]


def musica_menu():
    b = 60.0 / 66
    ev = frase(MENU_MELODIA, b, sino, 0.5)
    ev += acompanhar(MENU_ACORDES, b, 8, 0.13, 0.20)
    return sequenciar(32 * b, ev)


# --- vila: manha na Vila Semente ---------------------------------------------
# Sol maior, 100 por minuto, um acorde por compasso. Mais andante que a do menu
# porque aqui o jogador anda, e a trilha tem que combinar com o pe.
VILA_ACORDES = [
    (0,  [55, 59, 62], 43), (4,  [52, 55, 59], 40),   # Sol, Mi menor
    (8,  [52, 55, 60], 48), (12, [50, 54, 57], 38),   # Do, Re
    (16, [55, 59, 62], 43), (20, [52, 55, 59], 40),
    (24, [52, 55, 60], 48), (28, [50, 54, 57], 38),
]
VILA_MELODIA = [
    (0, 74, .5), (0.5, 71, .5), (1, 67, 1), (2, 71, .5), (2.5, 74, .5), (3, 76, 1),
    (4, 74, 1), (5, 71, .5), (5.5, 69, .5), (6, 67, 2),
    (8, 76, .5), (8.5, 74, .5), (9, 72, 1), (10, 76, 1), (11, 79, 1),
    (12, 78, .5), (12.5, 76, .5), (13, 74, 1), (14, 69, 2),
    (16, 67, 1), (17, 71, 1), (18, 74, 1), (19, 76, 1),
    (20, 79, 1.5), (21.5, 76, .5), (22, 74, 2),
    (24, 72, .5), (24.5, 74, .5), (25, 76, 1), (26, 72, 1), (27, 71, 1),
    (28, 69, 1), (29, 71, 1), (30, 74, 2),
]


def musica_vila():
    b = 60.0 / 100
    ev = frase(VILA_MELODIA, b, sino, 0.45)
    ev += acompanhar(VILA_ACORDES, b, 4, 0.11, 0.22)
    # dedilhado no contratempo: e o que da passo a vila em vez de deixar ela pairando
    for inicio, almofada, _ in VILA_ACORDES:
        for k in (1.5, 3.5):
            ev.append(((inicio + k) * b, corda(hz(almofada[1]), 0.9 * b), 0.16))
    return sequenciar(32 * b, ev)


RECEITAS = {
    # ---------------------------------------------------------------- passos
    # so muda o corte do filtro e o grave: e o material, nao a amostra
    "passo-grama": lambda: passo(1400, 150),
    "passo-terra": lambda: passo(900, 120),
    "passo-areia": lambda: passo(2600, 200),
    "passo-madeira": lambda: passo(1800, 220),
    "passo-pedra": lambda: passo(3200, 260),

    # ------------------------------------------------------------------ fala
    "fala-abre": lambda: arpejo([520, 700], 0.045),
    "fala-letra": lambda: blip(600, 0.035),
    "fala-fecha": lambda: arpejo([700, 520], 0.045),

    # ------------------------------------------------------------- interface
    "menu-foco": lambda: blip(880, 0.03),
    "menu-confirma": lambda: arpejo([660, 990], 0.055),
    "menu-volta": lambda: arpejo([760, 500], 0.055),
    "pausa-abre": lambda: envelope(onda("triangulo", deslize(300, 700), 0.18), 0.01, 0.18),
    "pausa-fecha": lambda: envelope(onda("triangulo", deslize(700, 300), 0.18), 0.01, 0.18),
    "salvou": lambda: arpejo([660, 880, 1320], 0.06, "triangulo"),

    # ------------------------------------------------------------ recompensa
    "moeda": lambda: arpejo([988, 1319], 0.06, "quadrada"),
    "selo": lambda: arpejo([784, 988, 1175, 1568], 0.08, "triangulo"),
    "pista": lambda: arpejo([523, 659, 784], 0.09, "triangulo"),
    "bau-abre": lambda: emendar(pancada(90, 700, 0.14), arpejo([880, 1175], 0.07)),
    "cristal": lambda: arpejo([1046, 1318, 1568, 2093], 0.11, "sen"),
    "coracao-novo": lambda: arpejo([659, 784, 1046], 0.1, "triangulo"),

    # ----------------------------------------------------------------- heroi
    "magia": lambda: envelope(onda("sen", deslize(300, 1400), 0.4), 0.02, 0.4),
    "trovao": lambda: envelope(passa_baixa(onda("ruido", 0, 0.7), 300), 0.02, 0.7),
    "tonto": lambda: arpejo([600, 520, 450, 390, 330], 0.09, "triangulo"),

    # ----------------------------------------------------------------- armas
    "espada-saca": lambda: assobio(1800, 700, 0.18),
    "espada-golpe": lambda: assobio(1200, 380, 0.16),
    "escudo-ergue": lambda: pancada(180, 900, 0.12),
    "escudo-bloqueia": lambda: somar(pancada(140, 1200, 0.2), ganho(blip(1800, 0.12, "sen"), 0.4)),
    "arco-arma": lambda: envelope(passa_baixa(onda("ruido", 0, 0.22), 700), 0.06, 0.22),
    "arco-solta": lambda: envelope(onda("dente", deslize(420, 130), 0.14), 0.002, 0.14),
    "flecha-voa": lambda: assobio(2400, 1200, 0.3),
    "flecha-crava": lambda: pancada(200, 1600, 0.12),
    "cajado-carrega": lambda: envelope(onda("sen", deslize(200, 600), 0.5), 0.15, 0.5),
    "cajado-libera": lambda: envelope(onda("sen", deslize(900, 200), 0.3), 0.01, 0.3),
    "martelo-golpe": lambda: assobio(700, 240, 0.22),
    "martelo-conserta": lambda: emendar(pancada(160, 1400, 0.1), silencio(0.06), pancada(200, 1600, 0.1)),
    "machado-golpe": lambda: assobio(900, 300, 0.18),
    "machado-lenha": lambda: somar(pancada(120, 800, 0.22), ganho(passa_baixa(onda("ruido", 0, 0.22), 1500), 0.4)),
    "adaga-estoca": lambda: assobio(2200, 1400, 0.09),
    "adaga-furtiva": lambda: ganho(assobio(2600, 1800, 0.07), 0.5),
    "funda-roda": lambda: emenda_de_loop(passa_banda_roda(), 0.1),
    "funda-solta": lambda: assobio(1400, 600, 0.12),
    "pedra-voa": lambda: assobio(1800, 900, 0.25),
    "pedra-bate": lambda: pancada(160, 2200, 0.13),
    "golpe-trovao": lambda: somar(assobio(1000, 300, 0.25),
                                  ganho(envelope(passa_baixa(onda("ruido", 0, 0.5), 260), 0.01, 0.5), 0.8)),

    # ------------------------------------------------- impacto, por material
    "bate-bicho": lambda: pancada(150, 600, 0.14),
    "bate-madeira": lambda: pancada(180, 1100, 0.14),
    "bate-pedra": lambda: pancada(120, 2400, 0.1),
    "bate-metal": lambda: somar(pancada(200, 3000, 0.3), ganho(blip(2400, 0.3, "sen"), 0.5)),
    "errou": lambda: ganho(assobio(1600, 900, 0.2), 0.6),

    # ------------------------------------------------------------------ dado
    "dado-chacoalha": lambda: emendar(*[emendar(pancada(300, 3000, 0.04), silencio(0.05)) for _ in range(6)]),
    "dado-rola": lambda: emendar(*[emendar(pancada(240, 2400, 0.03), silencio(0.07)) for _ in range(5)]),
    "dado-para": lambda: pancada(200, 2000, 0.09),
    # OBA sobe, QUASE fica morno, OPS ESCORREGA. nenhum dos tres e castigo
    "desfecho-oba": lambda: arpejo([523, 659, 784, 1046], 0.09, "triangulo"),
    "desfecho-quase": lambda: arpejo([587, 659], 0.12, "triangulo"),
    "desfecho-ops": lambda: envelope(onda("triangulo", deslize(500, 160), 0.45), 0.01, 0.45),

    # ---------------------------------------------------------------- magias
    "magia-fogo": lambda: somar(envelope(passa_alta(onda("ruido", 0, 0.4), 900), 0.02, 0.4),
                                ganho(envelope(onda("sen", deslize(600, 200), 0.4), 0.02, 0.4), 0.5)),
    "magia-gelo": lambda: arpejo([1568, 2093, 2637], 0.1, "sen"),
    "magia-planta": lambda: envelope(onda("triangulo", deslize(200, 900), 0.5), 0.05, 0.5),
    "magia-vento": lambda: envelope(passa_baixa(onda("ruido", 0, 0.6), 1600), 0.15, 0.6),
    "magia-voz": lambda: envelope(onda("sen", deslize(160, 90), 0.6), 0.03, 0.6),
    "magia-conserta": lambda: arpejo([440, 587, 440, 587], 0.07, "triangulo"),

    # -------------------------------------------------------------- criatura
    "bicho-pequeno-nota": lambda: arpejo([900, 1200], 0.05, "dente"),
    "bicho-pequeno-reage": lambda: envelope(onda("dente", deslize(1100, 500), 0.16), 0.005, 0.16),
    "bicho-pequeno-foge": lambda: arpejo([1200, 900, 700, 500], 0.05, "dente"),
    "bicho-grande-nota": lambda: envelope(onda("dente", deslize(120, 90), 0.4), 0.05, 0.4),
    "bicho-grande-reage": lambda: envelope(onda("dente", deslize(180, 70), 0.5), 0.02, 0.5),
    "bicho-grande-senta": lambda: emendar(envelope(onda("dente", deslize(140, 60), 0.5), 0.05, 0.5),
                                          pancada(70, 500, 0.3)),
    # as tres fraquezas que o bestiario ja escreveu como som
    "metal-alto": lambda: normalizar(somar(pancada(300, 4000, 0.8),
                                           ganho(blip(2093, 0.8, "sen"), 0.6),
                                           ganho(blip(3136, 0.8, "sen"), 0.35))),
    "gargalhada": lambda: emendar(*[envelope(onda("dente", deslize(320 - i * 18, 220 - i * 12), 0.12), 0.01, 0.12)
                                    for i in range(6)]),
    "nome-verdadeiro": lambda: envelope(onda("sen", deslize(220, 110), 1.0), 0.2, 1.0),

    # ----------------------------------------------------------------- itens
    "bebe-pocao": lambda: emendar(*[blip(300 + i * 40, 0.06, "triangulo") for i in range(4)]),
    "biscoito": lambda: envelope(passa_alta(onda("ruido", 0, 0.09), 1400), 0.001, 0.09),
    "fechadura": lambda: emendar(pancada(400, 3000, 0.05), silencio(0.04), pancada(500, 3400, 0.06)),
    "pena-levanta": lambda: arpejo([440, 587, 784, 1046], 0.1, "sen"),
    "lanterna": lambda: emenda_de_loop(ganho(onda("sen", 220, 2.0), 0.25), 0.2),

    # -------------------------------------------------------------- ambiente
    "vento-campo": lambda: leito(700, 4.0, 0.12),
    "fogueira": lambda: crepitar(3.0),
    "rio": lambda: leito(1800, 4.0, 0.3),
    "poco-pingo": lambda: emendar(silencio(1.2), blip(1400, 0.06, "sen"), silencio(1.4),
                                  blip(1200, 0.06, "sen"), silencio(1.0)),
    "feira": lambda: leito(500, 4.0, 0.05),
    "passaro-1": lambda: canto(2200, 3000),
    "passaro-2": lambda: canto(1800, 2600, 4),
    "passaro-3": lambda: canto(2600, 3400, 2),
    "passaro-4": lambda: canto(1500, 2200, 5),

    # ---------------------------------------------------------------- musica
    # as unicas faixas longas. ver a secao "musica" la em cima
    "musica-menu": musica_menu,
    "musica-vila": musica_vila,

    # ------------------------------------------------------------ travessia
    "porta": lambda: envelope(passa_baixa(onda("ruido", 0, 0.3), 500), 0.05, 0.3),
    "escada": lambda: emendar(*[passo(1600, 200) for _ in range(3)]),
    "troca-mapa": lambda: envelope(onda("sen", deslize(400, 900), 0.5), 0.05, 0.5),
}


def passa_banda_roda():
    """A funda girando: um zumbido que sobe e desce."""
    dur = 1.2
    return ganho(onda("sen", lambda t: 200 + 120 * math.sin(2 * math.pi * 3 * t), dur), 0.5)


# ------------------------------------------------------------------- escrita

def escrever_wav(caminho, sinal):
    sinal = normalizar(sinal)
    with wave.open(caminho, "w") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(TAXA)
        w.writeframes(b"".join(
            struct.pack("<h", int(max(-1.0, min(1.0, v)) * 32767)) for v in sinal
        ))


def para_mp3(wav, mp3):
    """Converte com ffmpeg, se existir. Sem ffmpeg o jogo toca o WAV do mesmo jeito."""
    if not shutil.which("ffmpeg"):
        return False
    subprocess.run(
        ["ffmpeg", "-y", "-loglevel", "error", "-i", wav, "-codec:a", "libmp3lame",
         "-qscale:a", "6", "-ar", str(TAXA), mp3],
        check=True,
    )
    os.remove(wav)
    return True


def pronto(nome):
    """Som definitivo em som/prontos/ ganha do rascunho, igual arte/sprites/."""
    for ext in (".mp3", ".wav"):
        caminho = os.path.join(PRONTOS, nome + ext)
        if os.path.exists(caminho):
            return caminho, ext
    return None, None


def main():
    os.makedirs(SAIDA, exist_ok=True)
    random.seed(SEMENTE)

    tem_ffmpeg = bool(shutil.which("ffmpeg"))
    manifesto = {}
    rascunhos = definitivos = 0

    for nome in sorted(RECEITAS):
        bom, ext = pronto(nome)
        if bom:
            destino = os.path.join(SAIDA, nome + ext)
            shutil.copyfile(bom, destino)
            manifesto[nome] = {"origem": "pronto", "arquivo": nome + ext}
            definitivos += 1
            continue

        # a semente por som deixa cada arquivo estavel mesmo se a ordem mudar
        random.seed(SEMENTE + sum(ord(c) for c in nome))
        sinal = RECEITAS[nome]()
        wav = os.path.join(SAIDA, nome + ".wav")
        escrever_wav(wav, sinal)
        ext_final = ".wav"
        if tem_ffmpeg:
            try:
                if para_mp3(wav, os.path.join(SAIDA, nome + ".mp3")):
                    ext_final = ".mp3"
            except subprocess.CalledProcessError:
                ext_final = ".wav"
        manifesto[nome] = {
            "origem": "rascunho",
            "arquivo": nome + ext_final,
            "segundos": round(len(sinal) / TAXA, 3),
        }
        rascunhos += 1

    with open(os.path.join(RAIZ, "manifesto.json"), "w", encoding="utf-8") as f:
        json.dump({"gerado_por": "npm run som", "total": len(manifesto),
                   "formato": ".mp3" if tem_ffmpeg else ".wav",
                   "sons": dict(sorted(manifesto.items()))}, f, indent=2, ensure_ascii=False)
        f.write("\n")

    print(f"rascunhos: {rascunhos}   definitivos: {definitivos}")
    if not tem_ffmpeg:
        print("sem ffmpeg: saiu em WAV. instale com  brew install ffmpeg  para gerar MP3")
    print("som gerado em", os.path.normpath(SAIDA))


if __name__ == "__main__":
    main()
