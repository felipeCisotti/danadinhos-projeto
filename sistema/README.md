# Danadinhos — sistema da equipe

Aplicação React JS + Vite, com autenticação por e-mail e senha no Supabase.

## Executar

1. Execute `npm install`.
2. Copie `.env.example` para `.env.local` e preencha a URL do projeto e sua chave pública publishable (ou anon legada).
3. Execute `npm run dev` e abra o endereço informado pelo Vite.

Sem as variáveis, a aplicação mostra a tela de login com aviso de configuração e bloqueia o envio. Não existe autenticação simulada.

## Três acessos

O perfil fica em `app_metadata.role` do usuário no Supabase Auth:

| Valor | Mensagem após login |
| --- | --- |
| `gestora` | Você está na conta da gestora |
| `cozinha` | Você está na conta da cozinha |
| `recepcao` | Você está na conta da recepção |

O usuário não escolhe o perfil. Não há cadastro público na aplicação. Contas sem um dos perfis acima recebem uma mensagem de acesso pendente.

Para provisionar três novas contas, copie `.env.admin.example` para `.env.admin`, preencha os e-mails, senhas e uma chave administrativa local e execute `npm run create:users`. O script usa a API oficial de administração do Supabase, não envia e-mails e não altera contas preexistentes. Use e-mails controlados pela equipe. A chave administrativa nunca deve ter prefixo `VITE_`, ser versionada ou compartilhada no chat. A configuração administrativa não é importada pelo navegador.

Também é possível criar os usuários no painel Supabase e atribuir `app_metadata.role` pela API administrativa. Não use `user_metadata` para perfis: o próprio usuário pode alterá-lo.

## Validação

`npm test` verifica os três perfis, rejeição de valores desconhecidos e desconsideração de metadados editáveis. `npm run build` gera a aplicação em `dist`.

Teste integrado após configurar: entrar com cada uma das três contas, conferir sua mensagem, atualizar a página para verificar a sessão, sair e tentar uma senha inválida. Verifique também uma conta sem perfil. A sessão usa o armazenamento do Supabase no navegador; ao compartilhar um computador, saia da conta ao terminar.

## Área da gestora

O perfil `gestora` acessa festas, calendário mensal, estoque, financeiro, funcionários e relatórios com exportação CSV. A recepção acessa sua área operacional, compartilhada com a gestora. Cozinha acessa festas, checklist e estoque em sua área operacional. Todas as sete tabelas têm RLS para restringir leitura e escrita à gestora, validando `app_metadata.role` no banco.

- Festas: cliente, telefone, data, horário, convidados, valor, cardápio, decoração, observações e quatro status. Festas aprovadas geram conta a receber; orçamentos e canceladas mantêm a conta inativa.
- Funcionários: fixos e temporários, cadastro, edição e inativação com preservação do histórico. Cada escala registra festa, funcionário, função, diária e situação (escalado, trabalhou ou cancelado).
- Diárias: a escala gera automaticamente uma conta a pagar. Reagendar a festa atualiza o vencimento das diárias. Cancelar a festa não cancela compromissos com funcionários automaticamente; revise as escalas.
- Estoque: categorias alimentos, bebidas e limpeza; entradas e saídas com data, motivo e festa opcional; alerta no painel e módulo quando o saldo é igual ou inferior ao mínimo. O saldo inicial é uma entrada. Correções são movimentações inversas.
- Financeiro: contas manuais a pagar/receber, gastos por festa, salários vinculados a funcionários, pagamentos parciais, histórico e estornos. Não há transferência de dinheiro: o sistema registra os pagamentos realizados.
- Relatórios: faturamento contratado considera festas aprovadas pela data do evento; recebimentos e gastos pagos consideram a data do pagamento; pendências consideram contas ativas de todos os meses. Festas futuras incluem orçamentos e aprovadas. Pagamentos de festas canceladas continuam no histórico e no caixa; devoluções efetivas devem ser registradas como contas a pagar.

O banco impede pagamento maior que o saldo e estoque negativo, inclusive em operações concorrentes. Não é possível reduzir contratos/diárias abaixo do valor já pago. Estorne o lançamento incorreto antes de corrigir. A gestora pode excluir cadastros com confirmação. Festas e escalas removem também a conta automática sem pagamentos, em uma única transação. Vínculos com outros registros impedem a exclusão. Funcionários e itens com histórico podem ser inativados. Contas com pagamentos, inclusive estornados, não podem ser excluídas. Movimentações podem ser excluídas somente se o saldo não ficar negativo. Pagamentos são corrigidos por estorno.

Definição do banco: `database/schema.sql`, `database/reschedule.sql` e `database/deletion.sql` (nesta ordem), aplicadas no projeto pelas migrações `gestora_modules` e `sync_rescheduled_daily_due_date`. Nenhuma senha de usuário é armazenada nesses arquivos.

Festas, escalas e exclusões recarregam os dados para refletir os efeitos do banco. Os demais salvamentos atualizam apenas o registro retornado, sem sete consultas adicionais; use “Atualizar” para obter mudanças feitas em outro computador. A leitura percorre todas as páginas do Supabase para evitar relatórios truncados no limite padrão de 1.000 registros.

Referência: https://supabase.com/docs/reference/javascript/auth-signinwithpassword

## Preparação para entrega

- `npm ci`, `npm test` e `npm run build`; publique o conteúdo de `dist` em uma hospedagem HTTPS.
- A área da gestora e seu CSS carregam sob demanda após o login. Tabelas exibem 25 registros por página; relatórios e CSV continuam considerando todos os registros.
- Exclusões estão disponíveis nas listas de eventos, funcionários, escalas e itens. Para excluir contas manuais ou movimentações, abra os detalhes pelo nome/descrição.
- A migração `safe_record_deletion` foi aplicada ao projeto Danadinhos. Para outros ambientes, execute os SQLs na ordem acima. `database/test-deletion.sql` verifica exclusões e permissões e desfaz todos os registros de teste com ROLLBACK.
- Cozinha e recepção possuem áreas operacionais separadas, descritas abaixo.
- A versão atual ainda carrega todas as tabelas para relatórios completos. A paginação reduz o DOM, mas volumes muito grandes exigirão consultas e agregações no servidor.

## Sistema de recepção

A conta com `app_metadata.role = recepcao` abre somente a área de recepção. A gestora entra pela opção **Recepção** no menu e retorna por **Voltar à gestão**.

- Seleção e consulta da festa: cliente, data, horário, situação, limite e referência de cardápio. Dados financeiros não são enviados ao perfil de recepção.
- Cadastro e correção de convidados por festa: nome da pessoa/criança, idade (0–120 anos) e telefone de contato/responsável.
- Entrada única com horário fornecido pelo servidor, sem registro de saída ou exclusão do histórico. Entrada permitida somente em festa aprovada. Festas canceladas ficam somente para consulta.
- Todos os convidados contam como uma pessoa, inclusive crianças. O limite usa o campo Convidados da festa; ao atingir ou ultrapassar, aparece aviso. Novas entradas acima do limite pedem confirmação, mas não são bloqueadas. Atualização automática a cada 30 segundos e botão Atualizar.
- Lista completa imprimível (ou salvar como PDF pelo navegador) e exportação CSV, independentemente dos filtros e paginação na tela.
- Ficha de escolha de cardápio em branco para o cliente preencher ou preenchida no sistema: salgados/pratos, doces, bebidas, bolo, restrições e observações. Salvar antes de imprimir para a cozinha. A ficha é um registro separado e não altera o cardápio nem outros campos da festa. Não há catálogo predefinido de opções comerciais.
- Recepção não pode criar, editar ou excluir festas nem acessar financeiro, funcionários ou estoque. A restrição é aplicada no banco, além da interface.

Banco: execute `database/reception.sql` após os demais scripts em ambientes novos. No projeto Danadinhos, as migrações `reception_guests_and_menu_forms` e `reception_private_projection` já estão aplicadas. `database/test-reception.sql` testa as permissões e regras usando ROLLBACK.

Prévia visual isolada: `node scripts/preview-reception.mjs` abre um servidor em http://127.0.0.1:4181 com dados fictícios em memória. Não usa autenticação ou dados reais e não faz parte do build de produção.
## Importação CSV de convidados

Na área de recepção, selecione a festa e abra **Importar CSV**. Baixe o modelo, preencha Nome, Idade e Telefone e selecione o arquivo. Confira a prévia e confirme a importação.

- Aceita vírgula, ponto e vírgula ou tabulação, UTF-8 (com/sem BOM) e Windows-1252, até 2 MB e 1.000 convidados por arquivo.
- Colunas podem estar em qualquer ordem; colunas extras são ignoradas. Telefones são preservados como texto, incluindo zeros iniciais. No Excel, formate a coluna Telefone como Texto antes de preencher.
- Qualquer linha inválida bloqueia o arquivo inteiro e informa o número da linha. Corrija e selecione novamente.
- Por padrão, ignora repetidos com mesmo nome, idade e telefone no arquivo ou na lista atual da festa. A opção pode ser desmarcada para pessoas distintas com dados iguais. A comparação usa a lista carregada; não é uma restrição de unicidade entre atendentes simultâneos.
- Uma única operação salva o lote: falhas no banco não deixam importação parcial. Repetir o envio da mesma prévia usa os mesmos identificadores e não duplica os registros.
- Importar não registra entrada e não altera os dados da festa. Festas canceladas não permitem importação.

## Sistema de cozinha

O login com perfil `cozinha` abre Festas e cardápios, Checklist de tarefas e Estoque completo. A gestora acessa pela opção Cozinha no menu.

- Festas ordenadas por data e horário, com seleção por festa, convidados previstos e cardápio cadastrado pela gestora. A ficha preenchida na recepção também aparece, incluindo restrições alimentares.
- Quantidades estruturadas por festa: alimento/bebida, categoria, quantidade e unidade. A gestora cadastra, edita e exclui em Gestão → Cozinha → Festas e cardápios. A cozinha consulta. São quantidades planejadas, sem reserva ou baixa automática do estoque.
- Checklist por festa: tarefa, nome do responsável (texto obrigatório), conclusão com horário do servidor, reabertura, edição e exclusão com confirmação. Cozinha e gestora podem organizar as tarefas; festas canceladas permitem apenas consulta.
- Estoque completo em consulta: todas as categorias e itens, inclusive inativos, saldo calculado pelas movimentações, unidade, mínimo e situação. Busca, filtro por categoria e paginação. Atualização automática a cada 30 segundos e manual.
- Cozinha não altera festas, ficha de cardápio, quantidades planejadas ou estoque, nem recebe dados financeiros, telefones de clientes ou lista de convidados. Permissões impostas no banco.

Migração `kitchen_planning_tasks_stock` aplicada ao projeto Danadinhos. Em ambientes novos, execute `database/kitchen.sql` depois de `database/reception.sql`. Teste transacional: `database/test-kitchen.sql` (ROLLBACK ao final). Prévia isolada: `node scripts/preview-kitchen.mjs`, porta 4182, sem dados reais.
