# -*- coding: utf-8 -*-
"""Icones dos itens do jogo: consumiveis da LOJA, materiais de monstro,
armadura e acessorio (ver docs/plano-de-itens-e-equipamento.md).

FOLHA PROPRIA, e nao mais icones em ui.py ou icones.py: ui.py e a interface
generica (coracao, moeda, seta...) e icones.py e especifico de combate
(retrato, acao, dado). Item de mochila e um terceiro assunto, com a propria
lista que so cresce — mistura-los faria qualquer um dos tres crescer por
motivo errado.

MESMA TECNICA de icones.py: cada icone e um bloco de 16 linhas de 16 letras,
e a LEGENDA diz que cor e cada letra. Editar olhando o desenho, nao contando
pixel.

Toda cor sai de paleta.py. Nenhuma cor solta.
"""
import os
import sys

from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from paleta import *  # noqa

U = 16

LEGENDA = {
    ".": VAZIO,
    "k": TINTA,
    "K": TINTA_2,
    "w": PAPEL,
    "W": BRANCO,
    "o": OURO,
    "O": OURO_E,
    "r": VERMELHO,
    "v": VERDE,
    "b": AZUL,
    "p": ROXO,
    "P": ROXO_C,
    "m": MADEIRA,
    "M": MADEIRA_C,
    "n": MADEIRA_E,
    "s": COURO,
    "S": COURO_C,
    "e": COURO_E,
    "t": PEDRA,
    "T": PEDRA_C,
    "u": PEDRA_E,
    "f": BRASA,
    "c": AGUA_C,
    "y": TEIA,
    "Y": TEIA_E,
    "z": NEVOA,
    "Z": PEDRA,
    "g": MUSGO,
    "G": MUSGO_C,
    "N": MADEIRA_E,  # a marca escura do broche do troll
}


def do_texto(linhas):
    """Um bloco de 16 linhas de 16 letras vira uma imagem de 16x16."""
    im = Image.new("RGBA", (U, U), (0, 0, 0, 0))
    for y, linha in enumerate(linhas[:U]):
        for x, letra in enumerate(linha[:U]):
            cor = LEGENDA.get(letra, VAZIO)
            if len(cor) == 4 and cor[3] == 0:
                continue
            im.putpixel((x, y), cor if len(cor) == 4 else cor + (255,))
    return im


# --------------------------------------------------------------- consumiveis
POCAO_MORANGO = [
    "................",
    ".......nn.......",
    ".......ww.......",
    "......kwwk......",
    "......krrk......",
    ".....krrrrk.....",
    ".....krrWrk.....",
    "....krrrrrrk....",
    "....krrrrrrk....",
    "....krrrrrrk....",
    ".....krrrrk.....",
    "......kkkk......",
    "................",
    "................",
    "................",
    "................",
]

POCAO_GRANDONA = [
    "................",
    "......nnnn......",
    "......wwww......",
    ".....kwwwwk.....",
    ".....krrrrk.....",
    "....krrrrrrk....",
    "....krrWrrrk....",
    "...krrrrrrrrk...",
    "...krrrrrrrrk...",
    "...krrrrrrrrk...",
    "...krrrrrrrrk...",
    "....krrrrrrk....",
    ".....kkkkkk.....",
    "................",
    "................",
    "................",
]

CORDA = [
    "................",
    "................",
    "...MMMk.........",
    "..M...Mk........",
    "..M....Mk.......",
    "...M....Mk......",
    "....Mk...Mk.....",
    ".....Mk...Mk....",
    "......Mk...Mk...",
    ".......Mk...M...",
    "........Mk.M....",
    ".........MM.....",
    "................",
    "................",
    "................",
    "................",
]

LANTERNA = [
    "................",
    "......kk........",
    ".....k..k.......",
    "......kk........",
    "....kttttk......",
    "....ktOOtk......",
    "....ktOOtk......",
    "....ktOOtk......",
    "....kttttk......",
    ".....kkkk.......",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
]

BISCOITO = [
    "................",
    "................",
    "......kkk.......",
    ".....kMMMk......",
    "....kMnMMMk.....",
    "....kMMMnMk.....",
    "....kMMMMMk.....",
    "....kMnMMnk.....",
    ".....kMMMk......",
    "......kkk.......",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
]

BOTA_VENTO = [
    "................",
    "................",
    ".....kkk........",
    ".....kss........",
    ".....kss........",
    ".....kss........",
    ".....kssk.......",
    ".....kssSk......",
    ".....ksssSkkkk..",
    ".....ksssssssk..",
    "......kkkkkkk...",
    "....c...........",
    "...c.c..........",
    "................",
    "................",
    "................",
]

CAPA_CAMALEAO = [
    "................",
    "......kk........",
    ".....kvvk.......",
    ".....kvPk.......",
    "....kvvvPk......",
    "....kvPvvk......",
    "...kvvvPvk......",
    "...kvPvvvk......",
    "..kvvvvvPvk.....",
    "..kvPvvvvvk.....",
    ".kkkkkkkkkkk....",
    "................",
    "................",
    "................",
    "................",
    "................",
]

PENA_FENIX = [
    "................",
    "........k.......",
    ".......kfk......",
    "......kfOk......",
    "......kfOk......",
    ".....kfOOk......",
    ".....kfOOk......",
    "....kfOOOk......",
    "....kfOOOk......",
    "...kfOOOk.......",
    "...kfOk.........",
    "..kfk...........",
    ".kk.............",
    "................",
    "................",
    "................",
]

SINO_ESPANTA = [
    "................",
    ".......kk.......",
    "......kooook....",
    ".....koooooK....",
    ".....koooooK....",
    ".....koooooK....",
    "....koooooook...",
    "....kOOOOOOk....",
    ".....kkkkkk.....",
    "......kOk.......",
    "......kOk.......",
    "................",
    "................",
    "................",
    "................",
    "................",
]

MAPA_QUE_FALA = [
    "................",
    "................",
    "....nn....nn....",
    "...nwwn..nwwn...",
    "...nwwwwwwwwn...",
    "...nwkkkkkkwn...",
    "...nwwwwwwwwn...",
    "...nwkkkkkkwn...",
    "...nwwwwwwwwn...",
    "....nn....nn....",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
]

SACO_SEM_FUNDO = [
    "................",
    "......kk........",
    ".....kmmk.......",
    ".....kmmk.......",
    "....kmmmmk......",
    "....kmmmmk......",
    "...kmmmmmmk.....",
    "...kmmmmmmk.....",
    "...kmmmmmmk.....",
    "....kmmmmk......",
    ".....kkkk.......",
    "................",
    "................",
    "................",
    "................",
    "................",
]

CHAVE_MESTRA = [
    "................",
    "................",
    ".....ooo........",
    "....oOOo........",
    "....oOOo........",
    ".....ooo........",
    "......o.........",
    "......o.........",
    "......oo........",
    "......ooo.......",
    "......o.o.......",
    "......ooo.......",
    "................",
    "................",
    "................",
    "................",
]

# ----------------------------------------------------------------- materiais
TEIA_DOCE = [
    "................",
    "................",
    ".....y..y.......",
    "......yy........",
    ".....yyyyy......",
    "....yy.y.yy.....",
    ".....yyyyy......",
    "......yy........",
    ".....y..y.......",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
]

PALHA = [
    "................",
    "................",
    "....o.....o.....",
    ".....o...o......",
    "......o.o.......",
    ".......O........",
    "......o.o.......",
    ".....o...o......",
    "....o.....o.....",
    "...o.......o....",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
]

PRESA_DE_NEVOA = [
    "................",
    "......kk........",
    ".....kzZk.......",
    ".....kzZk.......",
    "......kzZk......",
    "......kzZk......",
    ".......kzZk.....",
    ".......kzZk.....",
    "........kzk.....",
    ".........k......",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
]

CINZA = [
    "................",
    "................",
    ".....ttt........",
    "....ttTtt.......",
    "...ttttttt......",
    "...tuTtuTt......",
    "....ttttt.......",
    ".....ttt........",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
]

# ---------------------------------------------------------------- armaduras
COLETE_VILA = [
    "................",
    ".....kkkk.......",
    "....ksssk.......",
    "....ks.sk.......",
    "...ksssssk......",
    "...kseesek......",
    "...ksssssk......",
    "...ks.s.sk......",
    "...ksssssk......",
    "....kssssk......",
    ".....kkkk.......",
    "................",
    "................",
    "................",
    "................",
    "................",
]

MANTO_TEIA = [
    "................",
    "......kk........",
    ".....kyyk.......",
    "....kyyyyk......",
    "....kyYyYk......",
    "...kyyyyyyk.....",
    "...kyYyyyYk.....",
    "..kyyyyyyyyk....",
    "..kyyyyyyyyk....",
    ".kkkkkkkkkkkk...",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
]

CAPUZ_NEVOA = [
    "................",
    "......kkk.......",
    ".....kzzzk......",
    "....kzzzzzk.....",
    "....kzZZzzk.....",
    "....kzzzzzk.....",
    "....kz...zk.....",
    "....kzz.zzk.....",
    ".....kzzzk......",
    "......kkk.......",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
]

COURACA_CINZA = [
    "................",
    ".....kkkkk......",
    "....ktttttk.....",
    "....ktTTTtk.....",
    "...ktttttttk....",
    "...ktTuuuTtk....",
    "...ktttttttk....",
    "...kt.k.k.tk....",
    "...kttttttk.....",
    "....kkkkkk......",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
]

MANTO_PANTANO = [
    "................",
    "......kk........",
    ".....kggk.......",
    "....kggggk......",
    "....kgGggk......",
    "...kggggggk.....",
    "...kgGgggGk.....",
    "..kggggggggk....",
    "..kggggggggk....",
    ".kkkkkkkkkkkk...",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
]

# --------------------------------------------------------------- acessorios
BRACELETE_PALHA = [
    "................",
    "................",
    ".....oooo.......",
    "....o....o......",
    "...o......o.....",
    "...o......o.....",
    "...o......o.....",
    "....o....o......",
    ".....oooo.......",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
]

ANEL_TEIA = [
    "................",
    "................",
    "......kk........",
    ".....kyyk.......",
    ".....kyyk.......",
    "....k.kk.k......",
    "...k......k.....",
    "...k......k.....",
    "....k....k......",
    ".....kkkk.......",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
]

PRESA_LAPIDADA = [
    "................",
    "......kk........",
    ".....kzZk.......",
    ".....kzZk.......",
    "....W.kzZk......",
    ".......kzZk.....",
    "........kzk.....",
    ".........k......",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
]

PINGENTE_SINO = [
    "................",
    ".......k........",
    ".......k........",
    ".......k........",
    "......ooo.......",
    ".....ooooo......",
    ".....ooooo......",
    ".....ooooo......",
    "....oooooo......",
    ".....kkkk.......",
    "......o.........",
    "................",
    "................",
    "................",
    "................",
    "................",
]

BROCHE_TROLL = [
    "................",
    "................",
    "......kkk.......",
    ".....kMMMk......",
    "....kMvNvMk.....",
    "....kMNNNMk.....",
    "....kMvNvMk.....",
    ".....kMMMk......",
    "......kkk.......",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
]

# ------------------------------------------------------------------- armas
# Uma forma por TIPO de arma (8), nao por Arma.id (17): a versao "encontrada"
# e a lendaria sao a mesma silhueta, so o material muda — igual o jogo ja
# faz com a propria arma no mundo (mesmo desenho, cor diferente por raca em
# outros casos). `com_cores` troca letra por cor sem redesenhar a forma.

def com_cores(linhas, trocas):
    """Mesma silhueta de um icone, cores diferentes por cima da LEGENDA
    padrao. Usado pras variantes de arma (mesma forma, material/raridade
    diferente) sem duplicar a lista de letras."""
    im = Image.new("RGBA", (U, U), (0, 0, 0, 0))
    for y, linha in enumerate(linhas[:U]):
        for x, letra in enumerate(linha[:U]):
            cor = trocas.get(letra, LEGENDA.get(letra, VAZIO))
            if len(cor) == 4 and cor[3] == 0:
                continue
            im.putpixel((x, y), cor if len(cor) == 4 else cor + (255,))
    return im


ESPADA = [
    "................",
    ".......tt.......",
    ".......Tt.......",
    ".......Tt.......",
    ".......Tt.......",
    ".......Tt.......",
    ".......Tt.......",
    "......ktk.......",
    ".....kkkkk......",
    "......nnn.......",
    "......nMn.......",
    "......nnn.......",
    "................",
    "................",
    "................",
    "................",
]

ESCUDO = [
    "................",
    "......ttt.......",
    ".....tTTTt......",
    "....tTTTTTt.....",
    "....tTToTTt.....",
    "....tTTTTTt.....",
    "....tTTTTTt.....",
    ".....tTTTt......",
    "......ttt.......",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
]

ARCO = [
    "................",
    ".......mm.......",
    "......m..m......",
    "......m...m.....",
    "......m....m....",
    ".....m......m...",
    ".....m..w...m...",
    ".....m..w...m...",
    ".....m......m...",
    "......m....m....",
    "......m...m.....",
    "......m..m......",
    ".......mm.......",
    "................",
    "................",
    "................",
]

CAJADO_ITEM = [
    "................",
    "...........cc...",
    "..........cCCc..",
    "..........cCCc..",
    "...........cc...",
    "..........mm....",
    ".........mm.....",
    "........mm......",
    ".......mm.......",
    "......mm........",
    ".....mm.........",
    "....mm..........",
    "...mM...........",
    "...M............",
    "................",
    "................",
]

MARTELO = [
    "................",
    "....ttttt.......",
    "...tTTTTTt......",
    "...tTTTTTt......",
    "...tTTTTTt......",
    "....ttttt.......",
    "......nn........",
    "......nn........",
    "......nn........",
    "......nn........",
    "......nn........",
    "......MM........",
    "................",
    "................",
    "................",
    "................",
]

MACHADO = [
    "................",
    "......tt........",
    ".....tTTt.......",
    "....tTTTt.......",
    "...tTTTTk.......",
    "...tTTTk........",
    "....ktk.........",
    ".....n..........",
    ".....n..........",
    ".....n..........",
    ".....n..........",
    ".....M..........",
    "................",
    "................",
    "................",
    "................",
]

ADAGA = [
    "................",
    "............t...",
    "...........tT...",
    "..........tT....",
    ".........tT.....",
    "........tT......",
    ".......kk.......",
    "......nMn.......",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
]

FUNDA = [
    "................",
    "....s......s....",
    ".....s....s.....",
    "......s..s......",
    ".......ss.......",
    ".......ss.......",
    ".......ss.......",
    "......ssss......",
    ".....sssssss....",
    "......ssss......",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
]

#: id de Arma (conteudo.ts) -> (forma base, trocas de cor). Sem entrada =
#: forma base sem troca (as 8 originais). Ver docs/plano-de-itens-e-
#: equipamento.md, secao 9, pra origem de cada uma.
ARMAS_ICONE = [
    ("espada-curta", ESPADA, {}),
    ("escudo", ESCUDO, {}),
    ("arco", ARCO, {}),
    ("cajado", CAJADO_ITEM, {}),
    ("martelo", MARTELO, {}),
    ("machado", MACHADO, {}),
    ("adaga", ADAGA, {}),
    ("funda", FUNDA, {}),
    # lendarias: mesma forma, material precioso
    ("lamina-aurora", ESPADA, {"t": OURO, "T": OURO_E}),
    ("escudo-espelho", ESCUDO, {"t": PEDRA, "T": BRANCO, "o": PEDRA}),
    ("arco-lua", ARCO, {"m": PEDRA, "w": BRANCO}),
    # encontradas: mesma forma, sinal do lugar/vitoria que a deu
    ("lamina-guarda-vila", ESPADA, {"n": AZUL, "M": AZUL}),
    ("arco-trancado-teia", ARCO, {"m": TEIA_E, "w": TEIA}),
    ("funda-de-presa", FUNDA, {"s": PEDRA}),
    ("martelo-de-cinza", MARTELO, {"t": PEDRA_E, "T": PEDRA}),
    ("adaga-da-serpente", ADAGA, {"t": VERDE, "T": FOLHA_C}),
    ("cajado-bruxa-espinho", CAJADO_ITEM, {"m": ROXO, "M": ROXO_C, "c": ROXO_C, "C": ROXO}),
]

ITENS = [
    ("pocao-morango", POCAO_MORANGO),
    ("pocao-grandona", POCAO_GRANDONA),
    ("corda", CORDA),
    ("lanterna", LANTERNA),
    ("biscoito", BISCOITO),
    ("bota-vento", BOTA_VENTO),
    ("capa-camaleao", CAPA_CAMALEAO),
    ("pena-fenix", PENA_FENIX),
    ("sino-espanta", SINO_ESPANTA),
    ("mapa-que-fala", MAPA_QUE_FALA),
    ("saco-sem-fundo", SACO_SEM_FUNDO),
    ("chave-mestra", CHAVE_MESTRA),
    ("teia-doce", TEIA_DOCE),
    ("palha", PALHA),
    ("presa-de-nevoa", PRESA_DE_NEVOA),
    ("cinza", CINZA),
    ("colete-vila", COLETE_VILA),
    ("manto-teia", MANTO_TEIA),
    ("capuz-nevoa", CAPUZ_NEVOA),
    ("couraca-cinza", COURACA_CINZA),
    ("manto-pantano", MANTO_PANTANO),
    ("bracelete-palha", BRACELETE_PALHA),
    ("anel-teia", ANEL_TEIA),
    ("presa-lapidada", PRESA_LAPIDADA),
    ("pingente-sino", PINGENTE_SINO),
    ("broche-troll", BROCHE_TROLL),
]

def gerar(saida):
    """Monta public/assets/itens.png e devolve o indice nome -> quadro."""
    quadros = [(nome, do_texto(linhas)) for nome, linhas in ITENS]
    quadros += [(nome, com_cores(linhas, trocas)) for nome, linhas, trocas in ARMAS_ICONE]
    folha = Image.new("RGBA", (U * len(quadros), U), (0, 0, 0, 0))
    for i, (_, im) in enumerate(quadros):
        folha.paste(im, (i * U, 0))
    os.makedirs(saida, exist_ok=True)
    folha.save(os.path.join(saida, "itens.png"))
    return {nome: i for i, (nome, _) in enumerate(quadros)}
