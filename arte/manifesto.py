# -*- coding: utf-8 -*-
"""O manifesto da arte gerada.

Depois de cada `npm run arte`, escreve arte/manifesto.json com o hash, o tamanho e
as dimensoes de cada PNG produzido. O arquivo entra no git.

Serve para duas coisas que hoje ninguem consegue ver:

1. O QUE MUDOU. `git diff arte/manifesto.json` depois de regerar a arte diz
   exatamente quais sprites mudaram. Sem isso, um `git status` mostra vinte PNGs
   modificados e nao da pra saber se voce mexeu em um desenho ou em todos.

2. ARTE SOLTA. O CLAUDE.md proibe colar PNG na mao em public/assets, porque ele some
   na proxima geracao. Um PNG que esta em disco e nao esta no manifesto e exatamente
   isso: alguem colou. O verificar.mjs acusa.

Uso, no fim de main() em arte/gerar.py:

    import manifesto
    ...
    manifesto.escrever(SAIDA, os.path.dirname(__file__))
"""

import hashlib
import json
import os
import struct


def _dimensoes(caminho):
    """Largura e altura de um PNG, lendo so o cabecalho IHDR."""
    try:
        with open(caminho, "rb") as f:
            cabeca = f.read(24)
        if len(cabeca) < 24 or cabeca[12:16] != b"IHDR":
            return None
        largura, altura = struct.unpack(">II", cabeca[16:24])
        return largura, altura
    except OSError:
        return None


def escrever(saida, pasta_arte):
    """Varre `saida` e grava o manifesto em `pasta_arte`/manifesto.json."""
    arquivos = {}

    for raiz, _, nomes in os.walk(saida):
        for nome in sorted(nomes):
            if not nome.endswith(".png"):
                continue
            cheio = os.path.join(raiz, nome)
            rel = os.path.relpath(cheio, saida).replace(os.sep, "/")

            with open(cheio, "rb") as f:
                dados = f.read()

            ficha = {
                "hash": hashlib.sha256(dados).hexdigest()[:16],
                "bytes": len(dados),
            }
            tam = _dimensoes(cheio)
            if tam:
                ficha["largura"], ficha["altura"] = tam
            arquivos[rel] = ficha

    # ordenado para o diff do git ficar estavel entre duas geracoes
    manifesto = {
        "gerado_por": "npm run arte",
        "total": len(arquivos),
        "arquivos": dict(sorted(arquivos.items())),
    }

    destino = os.path.join(pasta_arte, "manifesto.json")
    with open(destino, "w", encoding="utf-8") as f:
        json.dump(manifesto, f, indent=2, ensure_ascii=False)
        f.write("\n")

    return destino, len(arquivos)


def comparar(antigo, novo):
    """Diferenca entre dois manifestos, para imprimir o que mudou na geracao.

    Devolve (novos, mudados, sumidos) com os nomes dos arquivos.
    """
    a = (antigo or {}).get("arquivos", {})
    b = (novo or {}).get("arquivos", {})

    novos = sorted(set(b) - set(a))
    sumidos = sorted(set(a) - set(b))
    mudados = sorted(k for k in set(a) & set(b) if a[k]["hash"] != b[k]["hash"])
    return novos, mudados, sumidos
