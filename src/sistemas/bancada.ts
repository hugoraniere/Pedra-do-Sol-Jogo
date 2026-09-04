/** Bancada de conferencia. So existe para as ferramentas de teste.
 *
 * Expoe em window.__aurora o suficiente para uma ferramenta de fora montar
 * qualquer personagem e perguntar ao jogo se as camadas dele existem. E de
 * proposito que a conferencia pergunte ao JOGO em vez de reimplementar as
 * regras: uma copia das regras dentro do teste passa a errar junto com o
 * codigo, e ai o teste para de servir. */
import Phaser from "phaser";
import {
  RACAS, CLASSES, DIRECOES, COLUNAS_FOLHA,
  ROUPA_DA_CLASSE, ARMA_DA_CLASSE, CHAPEU_DA_CLASSE,
} from "../dados/config";
import { VAZIO, Heroi as FichaHeroi } from "./estado";
import { camadasDoHeroi, pecasDoHeroi } from "./heroi";
import { encaixes } from "./encaixes";

function fichaDeTeste(raca: string, classe: string): FichaHeroi {
  return {
    ...VAZIO.heroi,
    nome: "Teste",
    raca,
    classe,
    estiloRoupa: ROUPA_DA_CLASSE[classe] ?? "tunica",
    armaSprite: ARMA_DA_CLASSE[classe] ?? "nenhuma",
    chapeu: CHAPEU_DA_CLASSE[classe] ?? "nenhum",
  };
}

export function instalarBancada(_jogo: Phaser.Game) {
  (window as unknown as { __aurora: unknown }).__aurora = {
    racas: RACAS.map((r) => r.id),
    classes: CLASSES.map((c) => c.id),
    fichaDeTeste,
    camadasDoHeroi,
    /** Tudo o que precisa existir como textura para este personagem aparecer,
     *  com quantos quadros cada peca deve ter. Quadros aqui e a contagem sem o
     *  quadro __BASE que o Phaser cria sozinho, entao um desenho unico, como a
     *  arma, tem zero. */
    texturasDe(ficha: FichaHeroi) {
      const p = pecasDoHeroi(ficha);
      return [
        ...camadasDoHeroi(ficha).map((c) => ({
          chave: c.chave,
          quadros: DIRECOES.length * COLUNAS_FOLHA,
        })),
        { chave: p.roupa.chave, quadros: 12 },
        ...(p.arma ? [{ chave: p.arma.chave, quadros: 0 }] : []),
      ];
    },
    /** os pontos de encaixe, para conferir que nenhum quadro ficou sem ponto */
    pontosDe(ficha: FichaHeroi) {
      const t = encaixes();
      const p = t?.pontos[pecasDoHeroi(ficha).raca];
      const esperado = DIRECOES.length * COLUNAS_FOLHA;
      return p ? { mao: p.mao.length, tronco: p.tronco.length, esperado } : null;
    },
  };
}
