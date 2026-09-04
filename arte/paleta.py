# -*- coding: utf-8 -*-
"""Paleta do Reino de Aurora, a mesma do material impresso, adaptada para pixel art.
Toda cor nova do jogo deve sair daqui. Nao invente cor solta no meio do codigo."""

TINTA      = (44, 36, 64)      # contorno de tudo
TINTA_2    = (74, 62, 100)     # contorno suave, sombra de interior
PAPEL      = (255, 248, 234)
PAPEL_2    = (253, 239, 214)

GRAMA_C    = (104, 176, 108)   # grama clara
GRAMA      = (66, 128, 78)
GRAMA_E    = (44, 96, 58)     # grama escura, sombra

TERRA_C    = (222, 190, 142)
TERRA      = (198, 160, 108)
TERRA_E    = (158, 118, 76)

AGUA_C     = (166, 220, 250)
AGUA       = (112, 190, 240)
AGUA_E     = (64, 148, 210)

PEDRA_C    = (192, 202, 216)
PEDRA      = (150, 162, 184)
PEDRA_E    = (116, 128, 152)

MADEIRA_C  = (168, 122, 78)
MADEIRA    = (128, 88, 56)
MADEIRA_E  = (92, 62, 40)

TELHA_C    = (232, 108, 92)
TELHA      = (196, 74, 62)
TELHA_E    = (146, 50, 44)

FOLHA_C    = (108, 182, 108)
FOLHA      = (72, 142, 82)
FOLHA_E    = (46, 104, 62)

OURO       = (245, 182, 43)
OURO_E     = (198, 138, 24)
VERMELHO   = (226, 72, 61)
AZUL       = (47, 111, 181)
VERDE      = (62, 155, 98)
ROXO       = (123, 90, 196)
ROXO_C     = (168, 138, 230)
BRASA      = (242, 128, 43)
ROSA       = (238, 123, 166)

PELE_C     = (250, 218, 186)
PELE       = (228, 186, 148)
PELE_E     = (188, 142, 108)

GOBLIN_C   = (176, 224, 140)
GOBLIN     = (140, 196, 104)
GOBLIN_E   = (96, 152, 70)

BRANCO     = (255, 255, 255)
VAZIO      = (0, 0, 0, 0)

# cores que a crianca escolhe na criacao do personagem.
# o sprite e desenhado em branco nas camadas de cabelo e roupa e recebe tint em runtime.
CABELOS = [
    ("Verde folha",   "#3E9B62"),
    ("Castanho",      "#8A5A34"),
    ("Preto",         "#3B3550"),
    ("Ruivo",         "#D2622F"),
    ("Loiro",         "#EBC35C"),
    ("Azul ceu",      "#4F96D6"),
]
ROUPAS = [
    ("Verde mata",    "#3E9B62"),
    ("Azul rio",      "#2F6FB5"),
    ("Vermelho",      "#E2483D"),
    ("Roxo magia",    "#7B5AC4"),
    ("Ouro",          "#F5B62B"),
    ("Rosa",          "#EE7BA6"),
]


# ---------------------------------------------------------------- rampas
# Uma rampa e o trio sombra / base / luz de um material. As sombras puxam para o
# roxo e as luzes para o amarelo, o chamado deslocamento de matiz. E o que faz a
# cor parecer iluminada em vez de so mais escura ou mais clara.

def _limita(v):
    return max(0, min(255, int(v)))


#: para onde a luz e a sombra puxam. Nao e branco nem preto puros de proposito:
#: sombra fria e luz quente e o que faz a cor parecer iluminada em vez de so
#: mais clara ou mais escura.
LUZ_ALVO = (255, 246, 222)
SOMBRA_ALVO = (42, 32, 72)


def _misturar(a, b, k):
    return tuple(_limita(a[i] + (b[i] - a[i]) * k) for i in range(3))


def rampa(base, forca=54):
    """Devolve (sombra, base, luz) de um material.

    A conta e mistura, nao soma. Somar um valor fixo em cada canal estourava o
    canal mais alto e mudava a cor: a pele clara, que e (248, 216, 182), virava
    (255, 255, 204) na luz, ou seja, deixava de ser pele e virava amarelo. Com
    mistura, a cor caminha ate um branco quente e ate um roxo escuro sem nunca
    trocar de matiz."""
    k = forca / 160
    return _misturar(base, SOMBRA_ALVO, k), tuple(base[:3]), _misturar(base, LUZ_ALVO, k)


# Os tres tons de pele subiram em relacao a primeira versao, e o chao desceu.
# E o par de mudancas que faz o personagem sair de dentro do fundo: as duas
# familias de cor estavam na mesma faixa media e o heroi sumia na grama.
PELE_TONS = [
    rampa((248, 216, 182)),   # claro
    rampa((218, 174, 134)),   # medio
    rampa((188, 134, 98)),    # escuro
]

CABELO_TONS = {
    "verde": (62, 155, 98),
    "castanho": (138, 90, 52),
    "preto": (59, 53, 80),
    "ruivo": (210, 98, 47),
    "loiro": (235, 195, 92),
    "azul": (79, 150, 214),
    "branco": (232, 228, 220),
    "rosa": (238, 123, 166),
}


# ----------------------------------------------------- tons por raca
# Cada raca tem a sua propria lista de tres tons. O jogador escolhe o indice
# 0, 1 ou 2 e o significado muda com a raca: para gente e cor de pele, para a
# Cria de Dragao e cor de escama. Assim o mesmo campo da ficha serve para todos.

ESCAMA_TONS = [
    rampa((152, 218, 152)),   # verde folha
    rampa((236, 132, 116)),   # vermelho brasa
    rampa((138, 184, 238)),   # azul ceu
]

TONS_POR_RACA = {
    "vale": PELE_TONS,
    "anao": PELE_TONS,
    "elfo": PELE_TONS,
    "pequenino": PELE_TONS,
    "dragao": ESCAMA_TONS,
}

# Cor do chifre e da garra da Cria de Dragao, e da barba do Anao.
CHIFRE = (238, 228, 206)
CHIFRE_E = (186, 172, 148)
BARBA_TONS = {
    "castanho": (138, 90, 52),
    "ruivo": (196, 96, 44),
    "branco": (226, 222, 212),
    "preto": (72, 64, 92),
}
