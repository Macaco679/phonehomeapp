// Ficha técnica do produto: gerada a partir do tipo + modelo do iPhone, mais as
// especificações extras que a assistência cadastrou (coluna `especificacoes`).
import type { Especificacao, Produto } from "@/lib/types";

type Modelo = {
  ano: number;
  tela: string; // polegadas
  res: string; // resolução
  ppi: number;
  painel: "LCD" | "OLED";
  hz: 60 | 120;
  mah: number;
  conector: "Lightning" | "USB-C";
  camera: string;
};

const L = "Lightning" as const;
const C = "USB-C" as const;
const DUPLA12 = "Dupla 12 MP (grande-angular + ultra-angular)";
const DUPLA48 = "Dupla: 48 MP principal + 12 MP ultra-angular";

// Dados de fábrica de cada aparelho (tamanho/resolução/bateria/câmera).
const MODELOS: Record<string, Modelo> = {
  "iPhone 8": { ano: 2017, tela: "4,7", res: "1334 × 750", ppi: 326, painel: "LCD", hz: 60, mah: 1821, conector: L, camera: "12 MP" },
  "iPhone SE": { ano: 2020, tela: "4,7", res: "1334 × 750", ppi: 326, painel: "LCD", hz: 60, mah: 1821, conector: L, camera: "12 MP" },
  "iPhone XR": { ano: 2018, tela: "6,1", res: "1792 × 828", ppi: 326, painel: "LCD", hz: 60, mah: 2942, conector: L, camera: "12 MP (grande-angular)" },
  "iPhone 11": { ano: 2019, tela: "6,1", res: "1792 × 828", ppi: 326, painel: "LCD", hz: 60, mah: 3110, conector: L, camera: DUPLA12 },
  "iPhone 11 Pro": { ano: 2019, tela: "5,8", res: "2436 × 1125", ppi: 458, painel: "OLED", hz: 60, mah: 3046, conector: L, camera: "Tripla 12 MP (grande-angular, ultra-angular e teleobjetiva 2x)" },
  "iPhone 11 Pro Max": { ano: 2019, tela: "6,5", res: "2688 × 1242", ppi: 458, painel: "OLED", hz: 60, mah: 3969, conector: L, camera: "Tripla 12 MP (grande-angular, ultra-angular e teleobjetiva 2x)" },
  "iPhone 12": { ano: 2020, tela: "6,1", res: "2532 × 1170", ppi: 460, painel: "OLED", hz: 60, mah: 2815, conector: L, camera: DUPLA12 },
  "iPhone 12 mini": { ano: 2020, tela: "5,4", res: "2340 × 1080", ppi: 476, painel: "OLED", hz: 60, mah: 2227, conector: L, camera: DUPLA12 },
  "iPhone 12 Pro": { ano: 2020, tela: "6,1", res: "2532 × 1170", ppi: 460, painel: "OLED", hz: 60, mah: 2815, conector: L, camera: "Tripla 12 MP (grande-angular, ultra-angular e teleobjetiva 2x)" },
  "iPhone 12 Pro Max": { ano: 2020, tela: "6,7", res: "2778 × 1284", ppi: 458, painel: "OLED", hz: 60, mah: 3687, conector: L, camera: "Tripla 12 MP (grande-angular, ultra-angular e teleobjetiva 2,5x)" },
  "iPhone 13": { ano: 2021, tela: "6,1", res: "2532 × 1170", ppi: 460, painel: "OLED", hz: 60, mah: 3227, conector: L, camera: DUPLA12 },
  "iPhone 13 mini": { ano: 2021, tela: "5,4", res: "2340 × 1080", ppi: 476, painel: "OLED", hz: 60, mah: 2406, conector: L, camera: DUPLA12 },
  "iPhone 13 Pro": { ano: 2021, tela: "6,1", res: "2532 × 1170", ppi: 460, painel: "OLED", hz: 120, mah: 3095, conector: L, camera: "Tripla 12 MP (grande-angular, ultra-angular e teleobjetiva 3x)" },
  "iPhone 13 Pro Max": { ano: 2021, tela: "6,7", res: "2778 × 1284", ppi: 458, painel: "OLED", hz: 120, mah: 4352, conector: L, camera: "Tripla 12 MP (grande-angular, ultra-angular e teleobjetiva 3x)" },
  "iPhone 14": { ano: 2022, tela: "6,1", res: "2532 × 1170", ppi: 460, painel: "OLED", hz: 60, mah: 3279, conector: L, camera: DUPLA12 },
  "iPhone 14 Plus": { ano: 2022, tela: "6,7", res: "2778 × 1284", ppi: 458, painel: "OLED", hz: 60, mah: 4325, conector: L, camera: DUPLA12 },
  "iPhone 14 Pro": { ano: 2022, tela: "6,1", res: "2556 × 1179", ppi: 460, painel: "OLED", hz: 120, mah: 3200, conector: L, camera: "Tripla: 48 MP principal + 12 MP ultra-angular + 12 MP teleobjetiva 3x" },
  "iPhone 14 Pro Max": { ano: 2022, tela: "6,7", res: "2796 × 1290", ppi: 460, painel: "OLED", hz: 120, mah: 4323, conector: L, camera: "Tripla: 48 MP principal + 12 MP ultra-angular + 12 MP teleobjetiva 3x" },
  "iPhone 15": { ano: 2023, tela: "6,1", res: "2556 × 1179", ppi: 460, painel: "OLED", hz: 60, mah: 3349, conector: C, camera: DUPLA48 },
  "iPhone 15 Plus": { ano: 2023, tela: "6,7", res: "2796 × 1290", ppi: 460, painel: "OLED", hz: 60, mah: 4383, conector: C, camera: DUPLA48 },
  "iPhone 15 Pro": { ano: 2023, tela: "6,1", res: "2556 × 1179", ppi: 460, painel: "OLED", hz: 120, mah: 3274, conector: C, camera: "Tripla: 48 MP principal + 12 MP ultra-angular + 12 MP teleobjetiva 3x" },
  "iPhone 15 Pro Max": { ano: 2023, tela: "6,7", res: "2796 × 1290", ppi: 460, painel: "OLED", hz: 120, mah: 4422, conector: C, camera: "Tripla: 48 MP principal + 12 MP ultra-angular + 12 MP teleobjetiva 5x" },
  "iPhone 16": { ano: 2024, tela: "6,1", res: "2556 × 1179", ppi: 460, painel: "OLED", hz: 60, mah: 3561, conector: C, camera: DUPLA48 },
  "iPhone 16 Plus": { ano: 2024, tela: "6,7", res: "2796 × 1290", ppi: 460, painel: "OLED", hz: 60, mah: 4674, conector: C, camera: DUPLA48 },
  "iPhone 16 Pro": { ano: 2024, tela: "6,3", res: "2622 × 1206", ppi: 460, painel: "OLED", hz: 120, mah: 3582, conector: C, camera: "Tripla: 48 MP principal + 48 MP ultra-angular + 12 MP teleobjetiva 5x" },
  "iPhone 16 Pro Max": { ano: 2024, tela: "6,9", res: "2868 × 1320", ppi: 460, painel: "OLED", hz: 120, mah: 4685, conector: C, camera: "Tripla: 48 MP principal + 48 MP ultra-angular + 12 MP teleobjetiva 5x" },
};

/** "iPhone 12 / 12 Pro" → "iPhone 12"; "iPhone SE (2ª e 3ª geração)" → "iPhone SE". */
function modeloPrincipal(modelo: string | null): Modelo | null {
  if (!modelo) return null;
  const nome = modelo.split(/[,/(]/)[0].trim();
  return MODELOS[nome] ?? null;
}

const num = (n: number) => n.toLocaleString("pt-BR");
const tem = (texto: string, termo: string) => texto.toLowerCase().includes(termo.toLowerCase());

export function especificacoesDoProduto(p: Pick<Produto, "nome" | "tipo" | "categoria" | "modelo_compativel" | "especificacoes">): Especificacao[] {
  const m = modeloPrincipal(p.modelo_compativel);
  const nome = p.nome;
  const s: Especificacao[] = [];
  const add = (rotulo: string, valor: string | number | null | undefined) => {
    if (valor !== null && valor !== undefined && valor !== "") s.push({ rotulo, valor: String(valor) });
  };

  add("Condição", "Novo");
  add("Compatível com", p.modelo_compativel);

  switch (p.tipo) {
    case "tela": {
      const tec = tem(nome, "OLED") ? "OLED" : tem(nome, "Incell") ? "Incell (LCD com touch integrado)" : "LCD";
      add("Tecnologia", tec);
      add("Conteúdo", "Tela completa montada: vidro, display e touch");
      if (m) {
        add("Tamanho", `${m.tela} polegadas`);
        add("Resolução", `${m.res} pixels (${m.ppi} ppi)`);
        add("Tela original do aparelho", `${m.painel}, ${m.hz} Hz${m.hz === 120 ? " (ProMotion)" : ""}`);
        if (m.hz === 120 && tem(nome, "Incell")) add("Taxa de atualização desta tela", "60 Hz");
      }
      add("Sensores e alto-falante auricular", "Não acompanham — reaproveitados da tela antiga");
      add("True Tone", "Requer transferência dos dados da tela original (programador)");
      if (m && m.ano >= 2019) add("Aviso do iOS", "Pode exibir mensagem de tela não original em Ajustes > Geral > Sobre");
      break;
    }
    case "bateria": {
      add("Química", "Íon-lítio");
      if (p.modelo_compativel?.includes("SE")) add("Capacidade", "1.821 mAh (SE 2ª geração) / 2.018 mAh (SE 3ª geração)");
      else if (m) add("Capacidade", `${num(m.mah)} mAh (padrão do modelo)`);
      add("Saúde da bateria", "100% (nova, 0 ciclos)");
      add("Itens inclusos", "Bateria + adesivo de fixação");
      add("Aviso do iOS", "Pode exibir \"Peça desconhecida\" em Ajustes > Bateria");
      break;
    }
    case "conector": {
      if (m) add("Tipo de conector", m.conector);
      add("Funções", "Carga, transferência de dados e microfone inferior");
      add("Conteúdo", "Flex completo do conector de carga");
      break;
    }
    case "camera": {
      if (tem(nome, "vidro")) {
        add("Conteúdo", "Vidro de reposição da lente traseira (sem módulo de câmera)");
        add("Material", "Vidro temperado");
        add("Pedido", "Informe o modelo exato na observação");
      } else {
        add("Conteúdo", "Módulo completo da câmera traseira");
        if (m) add("Câmeras", m.camera);
        if (m && m.ano >= 2020) add("Aviso do iOS", "Pode exibir \"Peça desconhecida\" em Ajustes > Geral > Sobre");
      }
      break;
    }
    case "tampa": {
      add("Material", "Vidro com acabamento igual ao original");
      add("Conteúdo", "Vidro traseiro (sem câmera e sem peças internas)");
      // vidro traseiro removível: iPhone 14 / 14 Plus e da linha 15 em diante
      const mod = p.modelo_compativel ?? "";
      const removivel = mod === "iPhone 14" || mod === "iPhone 14 Plus" || /^iPhone 1[5-9]/.test(mod);
      add("Tipo de troca", removivel ? "Vidro removível (troca sem laser)" : "Vidro colado ao chassi (troca com máquina a laser)");
      add("Cor", "Informe a cor desejada na observação do pedido");
      break;
    }
    case "alto_falante": {
      const auricular = tem(nome, "auricular");
      add("Posição", auricular ? "Superior (ligações)" : "Inferior (campainha, música e viva-voz)");
      add("Conteúdo", auricular ? "Alto-falante auricular" : "Módulo do alto-falante inferior");
      break;
    }
    case "pelicula": {
      if (tem(nome, "câmera")) {
        add("Material", "Anéis de vidro temperado com borda de alumínio");
        add("Protege", "Lentes traseiras contra riscos e trincas");
      } else {
        add("Material", "Vidro temperado");
        add("Dureza", "9H");
        add("Espessura", "≈ 0,3 mm");
        add("Cobertura", "Tela inteira, bordas 3D");
        add("Revestimento", "Oleofóbico (reduz marcas de dedo)");
        if (tem(nome, "privacidade")) add("Filtro de privacidade", "Escurece a tela para quem olha de lado");
        add("Compatível com capas", "Sim");
      }
      break;
    }
    case "capa": {
      if (tem(nome, "silicone")) {
        add("Material", "Silicone com interior em microfibra");
        add("Cor", "Informe a cor desejada na observação do pedido");
      } else {
        add("Material", "TPU e policarbonato transparentes (anti-impacto)");
        add("Ímãs", "Sim, padrão MagSafe");
      }
      add("Proteção", "Bordas elevadas para tela e câmeras");
      add("Carregamento sem fio", "Compatível");
      break;
    }
    case "cabo": {
      const c = tem(nome, "USB-A") ? "USB-A → Lightning" : tem(nome, "USB-C para USB-C") ? "USB-C → USB-C" : "USB-C → Lightning";
      add("Conectores", c);
      const metros = nome.match(/(\d+)\s?m\b/)?.[1];
      add("Comprimento", metros ? `${metros} m` : null);
      add("Potência", c === "USB-C → USB-C" ? "Até 60 W" : c === "USB-A → Lightning" ? "Até 12 W" : "Até 20 W (carga rápida)");
      add("Transferência de dados", "USB 2.0 (até 480 Mb/s)");
      add("Revestimento", tem(nome, "trançado") ? "Trançado em nylon" : "TPE flexível");
      break;
    }
    case "carregador": {
      const w = nome.match(/(\d+)\s?W/)?.[1];
      const mah = nome.match(/([\d.]+)\s?mAh/)?.[1];
      if (mah) {
        add("Capacidade", `${mah} mAh`);
        add("Saída", tem(nome, "magnética") ? "Sem fio magnética (padrão MagSafe) + USB-C" : "USB-C Power Delivery (carga rápida)");
      } else {
        add("Potência", w ? `${w} W` : null);
        if (tem(nome, "veicular")) {
          add("Entrada", "Tomada 12 V / 24 V do carro");
          add("Saída", "USB-C Power Delivery");
        } else if (tem(nome, "sem fio")) {
          add("Tipo", "Carregador sem fio magnético (padrão MagSafe)");
          add("Compatível com", "iPhone 12 ao 16 e AirPods com estojo sem fio");
        } else {
          add("Saída", tem(nome, "2 portas") ? "2× USB-C Power Delivery" : "1× USB-C Power Delivery");
          add("Entrada", "Bivolt 100–240 V");
        }
        if (tem(nome, "Kit")) add("Itens inclusos", `Fonte + cabo ${tem(nome, "USB-C para USB-C") ? "USB-C → USB-C" : "USB-C → Lightning"} (1 m)`);
      }
      break;
    }
    case "fone": {
      if (tem(nome, "Bluetooth")) {
        add("Conexão", "Bluetooth sem fio");
        add("Bateria", "Até 5 h por carga; estojo carrega até 4 vezes");
      } else {
        add("Conector", tem(nome, "USB-C") ? "USB-C" : "Lightning");
        add("Comprimento do fio", "≈ 1,2 m");
      }
      add("Microfone", "Sim, para ligações");
      break;
    }
    case "outros": {
      if (tem(nome, "adaptador")) add("Conectores", `${tem(nome, "USB-C") ? "USB-C" : "Lightning"} → fone P2 (3,5 mm)`);
      if (tem(nome, "suporte")) add("Fixação", "Saída de ar do carro, encaixe magnético");
      if (tem(nome, "pop")) add("Fixação", "Magnética (padrão MagSafe)");
      break;
    }
  }

  if (m && p.tipo && ["tela", "bateria", "conector", "camera", "tampa", "alto_falante"].includes(p.tipo)) {
    add("Ano de lançamento do aparelho", m.ano);
  }
  add("Garantia", "90 dias contra defeito de fabricação");

  // extras cadastrados pela assistência sobrescrevem os gerados com o mesmo rótulo
  const extras = Array.isArray(p.especificacoes) ? p.especificacoes.filter((e) => e?.rotulo && e?.valor) : [];
  const rotulosExtras = new Set(extras.map((e) => e.rotulo.toLowerCase()));
  return [...s.filter((e) => !rotulosExtras.has(e.rotulo.toLowerCase())), ...extras];
}

/** "Rótulo: valor" por linha ⇄ lista de especificações (formulário do dashboard). */
export function especificacoesParaTexto(lista: Especificacao[] | null | undefined): string {
  return (lista ?? []).map((e) => `${e.rotulo}: ${e.valor}`).join("\n");
}

export function textoParaEspecificacoes(texto: string): Especificacao[] {
  return texto
    .split("\n")
    .map((linha) => {
      const i = linha.indexOf(":");
      if (i <= 0) return null;
      const rotulo = linha.slice(0, i).trim();
      const valor = linha.slice(i + 1).trim();
      return rotulo && valor ? { rotulo, valor } : null;
    })
    .filter((e): e is Especificacao => e !== null);
}
