# Configurações e operação

Este capítulo descreve todas as configurações, a instalação e a inicialização do Nodestro e os atalhos de teclado.

## Provedores de IA {#anbieter}
<!-- keywords: chave de api, provedor, anthropic, openai, gemini, ollama, vllm, compatível com openai, url base, variável de ambiente, .env, capacidades -->

O Nodestro executa os agentes com a biblioteca Orkexa e trabalha com vários **provedores de IA** ao mesmo tempo: **Anthropic**, **OpenAI**, **Google Gemini** e seus próprios servidores por meio de um **endpoint compatível com OpenAI**, **Ollama** ou **vLLM**. Cada agente usa o provedor do seu modelo. Se esse provedor não estiver configurado, a execução não começa; o Nodestro nunca troca em silêncio para outro provedor. Se faltar o provedor do modelo padrão, aparece “Configurar provedor de IA” no canto superior direito.

Em *Configurações → Provedores de IA* cada provedor tem sua própria seção:

- **Anthropic, OpenAI, Google Gemini:** informe a chave de API e clique em **Salvar**. A chave fica no banco de dados local, nunca mais é exibida e só é enviada a este provedor. **Remover** a apaga.
- **Endpoint compatível com OpenAI, Ollama, vLLM:** informe a **URL base** do servidor (por exemplo `http://localhost:11434/v1` para o Ollama) e clique em **Salvar endpoint**; a chave de API é opcional. O provedor só conta como configurado quando há uma URL base salva.
- **O que os modelos sabem fazer:** para seus próprios servidores você informa se os modelos suportam ferramentas, saída estruturada, imagens, documentos PDF, esforço de raciocínio e outras capacidades. O Nodestro não supõe nada: uma opção que um modelo não suporta, ou cujo suporte é desconhecido, é relatada como erro pela verificação em vez de ser omitida.
- **Testar conexão** só pede ao provedor a lista de modelos; não custa nada.

Você também pode definir as chaves como **variáveis de ambiente**, antes de iniciar ou em um arquivo **`.env`** na pasta em que você inicia o `nodestro`. Variáveis de ambiente têm **prioridade** sobre chaves salvas:

| Provedor | Variável de ambiente |
|---|---|
| Anthropic | `ANTHROPIC_API_KEY` |
| OpenAI | `OPENAI_API_KEY` |
| Google Gemini | `GEMINI_API_KEY` ou `GOOGLE_API_KEY` |
| Compatível com OpenAI, Ollama, vLLM | `COMPATIBLE_API_KEY`, `OLLAMA_API_KEY`, `VLLM_API_KEY` (opcional) |

Uma chave de versões anteriores (na época só para a Anthropic) vira automaticamente a chave da Anthropic nestas configurações na primeira inicialização.

## Modelo dos assistentes e modelo padrão {#modelle}
<!-- keywords: modelo padrão, modelo dos assistentes, default model, novos agentes -->

- **Modelo padrão para novos agentes:** novos agentes vazios começam com este provedor e modelo (pela paleta, por *Adicionar agente*, em novos workflows e como modelo vazio). Nos rascunhos por IA, ele serve de substituto caso o arquiteto sugira um modelo não permitido. Agentes existentes não mudam.
- **Modelo dos assistentes:** este modelo cria agentes a partir da sua descrição, escreve ferramentas como agente de código, sugere estruturas de memória e responde suas perguntas como [Nodestro Assistant](/docs/assistent). Um modelo forte (padrão: Claude Opus 5.5 da Anthropic) gera sugestões melhores. Os rascunhos por IA só sugerem modelos de provedores configurados.

Os dois campos são compostos por **provedor** e **modelo**. Escolha o modelo da lista ou digite qualquer id de modelo do provedor, por exemplo `gpt-5.5` na OpenAI ou `llama3.1:8b` no Ollama. Ele é salvo como `provedor:modelo` (por exemplo `openai:gpt-5.5`); valores antigos sem provedor, como `claude-sonnet-5-5`, contam como modelos da Anthropic.

Salve as alterações com **Salvar** na seção *Modelos e orçamento*.

## Orçamento padrão {#budget}
<!-- keywords: orçamento padrão, orçamento, budget, limite -->

O **orçamento padrão por execução** (inicialmente 2 USD) vale para todos os fluxos sem orçamento próprio. Vazio significa sem limite. Como o orçamento funciona está em [Orçamento por execução](/docs/workflows#budget).

## Sandbox {#sandbox}
<!-- keywords: escolher sandbox, docker, processo python, docker disponível -->

Aqui você escolhe onde rodam as ferramentas próprias e as criadas por IA: **Processo Python** ou **Docker**. A alteração vale na hora. Um aviso mostra se o Docker foi encontrado; se o Docker estiver escolhido mas inacessível, testes e chamadas de ferramentas falham. Detalhes em [A sandbox](/docs/tools#sandbox).

## Idioma {#sprache}
<!-- keywords: idioma, language, português, inglês, alemão, espanhol, francês, italiano, idioma do navegador, tradução, localização -->

O Nodestro está disponível em **alemão, inglês, espanhol, francês, português (Brasil) e italiano**. Em **Idioma da interface** você escolhe um deles ou **Automático (idioma do navegador)**.

- **Primeira inicialização:** o Nodestro usa o idioma do seu navegador. Se ele não for suportado, aparece o inglês.
- **Sua escolha:** um idioma escolhido sempre tem prioridade e fica salvo, mesmo depois de reiniciar. O Nodestro o guarda no navegador e nas configurações; outro navegador o adota enquanto não tiver uma escolha própria.
- **Efeito imediato:** a troca não exige reinicialização e não inicia nenhum fluxo de trabalho nem chamada à IA.

O idioma afeta apenas a **interface**: menus, avisos, mensagens de erro, esta documentação e formatos de números e datas. Os custos são sempre mostrados em dólares americanos, no formato do idioma escolhido. Nas mensagens de erro do servidor, você vê o texto original em **Detalhes técnicos**.

**Seu conteúdo não muda.** Agentes, prompts, fluxos de trabalho, ferramentas, conhecimento, memória e resultados nunca são traduzidos automaticamente. Um agente existente continua respondendo no idioma do prompt dele, qualquer que seja o idioma da interface.

**Assistentes de IA:** novas sugestões (agentes, estruturas de memória) são escritas no idioma da interface, a menos que sua descrição peça outro idioma. Código, identificadores e chaves JSON sempre continuam em inglês.

## Aparência {#darstellung}
<!-- keywords: tema, escuro, claro, modo escuro, modo claro, esquema de cores, design, midnight citron -->

No canto superior direito você alterna entre **Escuro** e **Claro**. A escolha fica salva no navegador. As duas variantes seguem o sistema de design *Midnight Citron*. Em telas estreitas, a barra lateral vira uma barra de ícones.

## Backup e restauração {#backup}
<!-- keywords: backup, cópia de segurança, restaurar, exportar, zip, mudança, salvaguarda -->

**Baixar backup** salva todos os dados em um arquivo ZIP: fluxos de trabalho com versões, modelos de agentes, ferramentas próprias, arquivos de conhecimento, memória, execuções, dados de uso, favoritos, tags e configurações. O banco de dados é salvo como um instantâneo consistente, mesmo enquanto uma execução está trabalhando.

As **chaves de API** dos provedores de IA nunca vão para o backup, nem URLs base que contenham credenciais. A restauração mantém as chaves deste computador.

**Restaurar de um arquivo** primeiro verifica o arquivo por completo: formato, a soma de verificação de cada arquivo, o banco de dados e cada fluxo de trabalho e execução salvos. Só então o Nodestro mostra o que o backup contém, em comparação com o estado atual. Os dados só são substituídos após confirmação explícita e somente se nenhuma execução estiver ativa. Antes disso, o Nodestro salva automaticamente um backup do estado atual (`before-restore-….zip` na pasta `backups` do diretório de dados); ele aparece entre os backups deste computador e pode ser restaurado da mesma forma. Se algo falhar, os dados anteriores permanecem inalterados.

## Diagnóstico do sistema {#diagnose}
<!-- keywords: diagnóstico, verificar, encontrar erros, conexão, docker, sandbox, versão, problema -->

**Iniciar diagnóstico** verifica se o Nodestro funciona por completo neste computador e mostra para cada item **OK**, **Aviso** ou **Erro**, com uma explicação e uma sugestão de solução:

- versões do Nodestro, Orkexa, Python, SQLite e do sistema operacional
- banco de dados (legível, gravável, íntegro, busca de texto completo)
- diretórios de dados, ferramentas e backups graváveis, espaço livre em disco
- provedores de IA: quais estão configurados e se os provedores do modelo padrão e do modelo do assistente estão entre eles (sem exibir chaves)
- Docker e a sandbox de ferramentas com uma pequena ferramenta de teste
- suporte a PDF e a interface compilada

O diagnóstico é gratuito e não envia nada para a internet. **Testar conexão** pede também a lista de modelos ao provedor do modelo padrão; na seção de cada provedor em [Provedores de IA](/docs/einstellungen#anbieter) você o testa individualmente. Isso não usa tokens e não custa nada. Chaves de API e outras credenciais nunca são exibidas.

## Instalação e inicialização {#installation}
<!-- keywords: instalação, inicialização, linha de comando, cli, porta, host, data-dir, no-browser, reload, python, node -->

Requisitos: Python 3.10 ou mais recente e Node.js 20 ou mais recente (só para compilar a interface); Docker é opcional.

```bash
cd frontend && npm ci && npm run build && cd ..
pip install -e .
nodestro
```

O Nodestro inicia em `http://localhost:8000` e abre o navegador. Opções do comando `nodestro`:

| Opção | Variável de ambiente | Significado |
|---|---|---|
| `--host` | `NODESTRO_HOST` | Endereço (padrão `127.0.0.1`, só este computador) |
| `--port` | `NODESTRO_PORT` | Porta (padrão `8000`) |
| `--data-dir` | `NODESTRO_DATA_DIR` | Diretório de dados (padrão `~/.nodestro`) |
| `--no-browser` | – | Não abrir o navegador automaticamente |
| `--reload` | – | Reiniciar quando o código mudar (desenvolvimento) |

Para encerrar, use **Ctrl+C**. Execuções em andamento são canceladas.

> **Segurança:** o Nodestro não tem gerenciamento de usuários. Não o deixe acessível com `--host 0.0.0.0` em redes de terceiros, porque quem alcançar a interface pode iniciar execuções com suas chaves de API.

## Atalhos de teclado {#tastenkuerzel}
<!-- keywords: atalhos de teclado, shortcuts, teclado, keyboard, acessibilidade -->

<!-- widget: shortcuts -->

Além disso, em qualquer lugar: **Tab** vai para o próximo controle e mostra a explicação dele, **Esc** fecha caixas de diálogo e explicações, **Enter** ou **Espaço** acionam botões.
