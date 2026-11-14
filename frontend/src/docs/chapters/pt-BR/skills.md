# Skills

Skills são instruções no formato aberto Agent Skills que um agente carrega quando a tarefa precisa delas. Este capítulo explica o que uma skill contém, como você importa e edita skills e o que o Nodestro faz para mantê-las seguras.

## O que é uma skill {#ueberblick}
<!-- keywords: skill, agent skills, SKILL.md, instruções, cabeçalho, front matter, referências -->

Uma skill é uma pasta com um arquivo `SKILL.md` e, opcionalmente, outros arquivos em `scripts/`, `references/` e `assets/`. O `SKILL.md` começa com um cabeçalho (nome, descrição e campos opcionais como licença ou compatibilidade), seguido das instruções em Markdown. A descrição diz ao modelo quando a skill é útil.

Todas as skills do espaço de trabalho estão na página [Skills](/skills). Cada cartão mostra o status, a versão, a origem (própria, importada ou incluída) e se a skill contém scripts. Você atribui uma skill a um agente em uma versão fixa, como descrito na [biblioteca de agentes](/docs/agenten#bibliothek); uma versão mais nova nunca é usada automaticamente.

## Importar uma skill {#import}
<!-- keywords: importar, zip, SKILL.md, relatório de validação, teste, nova versão -->

Escolha **Importar skill** e depois um arquivo ZIP com uma pasta de skill ou um único arquivo `SKILL.md`. O Nodestro verifica o arquivo primeiro e ainda não salva nada. O relatório de validação lista os **erros**, que impedem a importação, e os **avisos**, que apenas informam, por exemplo sobre um nome que não segue a especificação ou sobre scripts. Abaixo você vê o nome, a descrição, as instruções e os arquivos que a importação salvaria.

Se já existir uma skill com o mesmo nome, a importação salva o arquivo como a próxima versão dessa skill em vez de criar uma segunda.

## Versões, edição e status {#versionen}
<!-- keywords: versão, editar, copiar, renomear, exportar, ativar, desativar, arquivar, excluir -->

Cada alteração é salva como uma nova versão; salvar sem alterações mantém a versão. Nos detalhes de uma skill você edita o texto do `SKILL.md` (os outros arquivos continuam iguais), vê versões anteriores, descobre quais agentes usam a skill e baixa qualquer versão como arquivo ZIP.

O nome de uma skill não pode ser mudado pela edição: copie a skill com um novo nome. Uma skill **desativada** continua atribuída, mas os agentes que a usam não são executados até você ativá-la de novo. Uma skill que agentes ainda usam não pode ser excluída; **arquive-a**. Arquivar e excluir são tarefas de administradores.

## Segurança {#sicherheit}
<!-- keywords: segurança, não confiável, scripts, allowed-tools, credenciais, injeção de prompt -->

Uma skill importada vem de uma fonte desconhecida. O Nodestro passa as instruções dela ao modelo como conteúdo não confiável, e os scripts de uma skill **nunca são executados**. Uma skill nunca concede ferramentas: o campo `allowed-tools` é mostrado, mas ignorado, e as ferramentas vêm só das configurações do agente. Confira o conteúdo de uma skill importada antes de usá-la com ferramentas que gravam ou alteram dados. Se um arquivo parecer conter credenciais, o relatório de validação avisa você; remova-as antes de compartilhar ou exportar a skill.
