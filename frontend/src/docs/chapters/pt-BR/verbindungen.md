# Conexões de serviço

Algumas ferramentas integradas acessam um serviço externo, por exemplo uma busca na web, um servidor de e-mail ou um webhook. O que elas precisam para isso (o endereço, as configurações e um segredo) é uma **conexão de serviço**. Este capítulo explica as fichas das ferramentas, como você configura uma conexão e como um agente a usa.

## Fichas das ferramentas {#tool-steckbrief}
<!-- keywords: ficha, tool spec, categoria, rede, offline, tipo de conexão, limite de tempo, limite de chamadas, filtro -->

Cada ferramenta integrada tem uma **ficha**: sua categoria (*Cálculo*, *Dados*, *Arquivos*, *Internet*, *Comunicação*), se precisa de Internet, se **funciona offline**, que tipo de conexão precisa, seu limite de tempo e quantas vezes um agente pode chamá-la em uma execução. A página [Ferramentas](/tools) mostra essas informações como selos e permite filtrar as ferramentas integradas por elas.

Uma chamada que demora mais que o limite de tempo termina com um erro; quando uma ferramenta atinge seu limite de chamadas, o agente recebe um erro nas chamadas seguintes e responde com o que tem. No modo offline estrito, ferramentas que precisam de Internet são recusadas antes do início. As ferramentas integradas do Nodestro estão descritas em [Ferramentas integradas](/docs/tools#eingebaut).

## Configurar uma conexão {#einrichten}
<!-- keywords: conexão, serviço, busca na web, smtp, servidor de e-mail, webhook, configurações, provedor -->

Você gerencia as conexões em *Ferramentas → Conexões*. **Adicionar conexão** pede o tipo (busca na web, servidor de e-mail ou webhook), o provedor quando o tipo oferece vários, um nome e as configurações do tipo, como o endereço do servidor e o endereço do remetente de um servidor de e-mail. Os endereços devem usar `https` (no seu próprio computador, `http` para um servidor local é permitido) e não podem conter uma senha; endereços internos são recusados.

Cada conexão mostra os hosts que pode acessar, derivados das suas configurações, e os agentes que a usam. Só administradores podem adicionar, alterar, verificar ou excluir conexões; os demais apenas as veem. O Nodestro registra quem alterou qual conexão, nunca os valores.

Uma conexão que agentes ainda usam não é excluída na hora: o Nodestro cita os agentes e oferece **Excluir mesmo assim**. A verificação deles passa então a apontar a conexão que falta.

## O segredo {#geheimnis}
<!-- keywords: segredo, chave de api, senha, chave de assinatura, cofre, criptografado, sessão -->

Uma conexão tem no máximo um segredo: uma chave de API, uma senha ou uma chave de assinatura. Você o define nos detalhes da conexão depois de salvar. O segredo é **somente de escrita**: o Nodestro nunca mais o mostra, nem na interface, nem em exportações, nem em logs. Você vê apenas **Segredo definido** ou **Sem segredo** e onde ele é guardado.

Os segredos são salvos criptografados, como os tokens de acesso dos serviços conectados: no desktop com uma chave do chaveiro do sistema operacional, em um servidor com a chave do servidor, separadamente para cada locatário. Sem armazenamento seguro de chaves, o segredo vale **só para esta sessão** e precisa ser informado de novo depois de reiniciar. **Substituir segredo** o sobrescreve, **Remover segredo** o apaga.

## Verificar uma conexão {#pruefen}
<!-- keywords: verificar, status, funciona, a verificação falhou, código de erro -->

**Verificar conexão** testa a conexão e mostra o resultado: *Funciona*, *A verificação falhou* ou *Não verificada*, com o horário da verificação e, em caso de falha, o código de erro. Por enquanto, em servidores de e-mail e webhooks só as configurações são verificadas; o serviço ainda não é contatado. Ao mudar as configurações, o provedor ou o segredo, o status volta para *Não verificada*. Uma conexão ainda não verificada com sucesso aparece como aviso na verificação antes de uma execução.

## Usar uma conexão em um agente {#zuweisen}
<!-- keywords: agente, inspetor, configurações da ferramenta, escolha da conexão -->

Quando você atribui uma ferramenta integrada que precisa de uma conexão, o inspetor do agente mostra abaixo das ferramentas uma escolha com as conexões do tipo certo (veja [Atribuir ferramentas](/docs/agenten#tools)). Sem uma conexão escolhida, a verificação do agente mostra um erro. O modelo nunca vê a conexão, suas configurações nem seu segredo; ele vê apenas a ferramenta.
