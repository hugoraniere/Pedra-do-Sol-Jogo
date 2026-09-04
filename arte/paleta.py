# -*- coding: utf-8 -*-
"""Paleta do Reino de Aurora, a mesma do material impresso, adaptada para pixel art.
Toda cor nova do jogo deve sair daqui. Nao invente cor solta no meio do codigo."""

TINTA      = (44, 36, 64)      # contorno de tudo
TINTA_2    = (74, 62, 100)     # contorno suave, sombra de interior
PAPEL      = (255, 248, 234)
PAPEL_2    = (253, 239, 214)

GRAMA_C    = (124, 196, 122)   # grama clara
GRAMA      = (94, 170, 100)
GRAMA_E    = (62, 128, 76)     # grama escura, sombra

TERRA_C    = (206, 168, 116)
TERRA      = (176, 134, 88)
TERRA_E    = (128, 94, 62)

AGUA_C     = (126, 196, 242)
AGUA       = (79, 150, 214)
AGUA_E     = (47, 111, 181)

PEDRA_C    = (176, 186, 200)
PEDRA      = (134, 146, 166)
PEDRA_E    = (92, 102, 124)

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

GOBLIN_C   = (150, 208, 120)
GOBLIN     = (108, 172, 84)
GOBLIN_E   = (72, 128, 58)

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


def rampa(base, forca=42):
    """Devolve (sombra, base, luz) com deslocamento de matiz."""
    r, g, b = base[:3]
    sombra = (_limita(r - forca * 1.15), _limita(g - forca * 1.25), _limita(b - forca * 0.55))
    luz = (_limita(r + forca * 0.95), _limita(g + forca * 0.85), _limita(b + forca * 0.45))
    return sombra, (r, g, b), luz


PELE_TONS = [
    rampa((246, 214, 180)),   # claro
    rampa((214, 168, 126)),   # medio
    rampa((162, 112, 78)),    # escuro
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
    rampa((122, 196, 128)),   # verde folha
    rampa((214, 106, 92)),    # vermelho brasa
    rampa((112, 158, 220)),   # azul ceu
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
