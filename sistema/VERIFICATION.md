# Verificação — área da gestora

Executada em 12/11/2026.

- 8 testes automatizados passaram: perfis, rejeição de metadados editáveis, centavos e pagamentos parciais, estornos no cálculo, relatórios por período, estoque decimal, calendário bissexto e CSV.
- Build Vite de produção concluído.
- Testes reais no Supabase: criação de festa gera conta; criação de escala gera diária; pagamentos concorrentes acima do saldo são bloqueados; contrato abaixo do valor pago é bloqueado; saídas concorrentes não tornam estoque negativo; reagendamento atualiza vencimentos; estornos reabrem saldo; festa cancelada bloqueia recebimento; diária pode ser paga parcialmente e participação registrada.
- RLS: cozinha e recepção não leram nenhuma das sete tabelas, nem conseguiram inserir ou editar funcionário. Acesso anônimo foi negado.
- Navegador: login da gestora, cadastro e persistência de festa, presença no calendário, recebimento parcial de R$ 80 em contrato de R$ 250 com saldo de R$ 170, saída de estoque e alerta ao atingir o mínimo, listagem de funcionários/escalas e relatórios correspondentes.
- Registros QA identificados foram removidos após os testes.
- Advisor de segurança: nenhuma pendência de RLS ou funções públicas privilegiadas após correção da permissão do event trigger preexistente. Permanece a configuração de proteção de senhas vazadas desativada no projeto (não alterada): https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

Os testes cobrem o fluxo inicial e as regras principais. Não foi realizado teste de carga com grandes volumes. A aplicação registra pagamentos; não realiza transferências bancárias.

## Atualização: exclusões e preparação de entrega

- Migração `safe_record_deletion` aplicada sem remover registros existentes.
- Teste transacional real (`database/test-deletion.sql`) aprovado: exclusão de festa e escala limpa conta automática; vínculos bloqueiam funcionário/festa/item; pagamentos e estornos impedem exclusão da conta; exclusão de entrada não deixa saldo negativo; cozinha e recepção não podem excluir. Todos os dados de teste foram revertidos.
- Carregamento sob demanda da área da gestora, paginação de 25 linhas, reutilização de formatador monetário, cálculos do painel com mapas e atualização local após operações simples.
- Esta atualização não foi publicada na hospedagem nem validada manualmente em navegador autenticado.

- Validação final: 8/8 testes passaram; build Vite concluído (110 módulos), pacote estático gerado em danadinhos-entrega.zip. Advisor não encontrou novos problemas de RLS/funções; permanece o aviso preexistente de proteção de senhas vazadas desativada.


## Sistema de recepção — 12/11/2026

- Teste real transacional no Supabase aprovado: cadastro/edição de convidados, entrada única com horário do servidor, rejeição de saída, contagem além do limite, validação de idade, ficha separada da festa e consulta da gestora. Fixtures desfeitas por ROLLBACK.
- Recepção impedida de ler a tabela privada de festas diretamente, criar/editar/excluir festas; consulta somente à projeção operacional. Cozinha e perfis baseados em user_metadata não têm acesso à recepção.
- Navegador com fixture isolada: cadastro com nome/idade/telefone, entrada desabilita novo registro e mostra aviso ao atingir limite, ficha salva mantém escolhas e prepara documento correto para impressão. Diálogo de impressão acionado e fechado sem imprimir. Não houve impressão física nem teste autenticado ponta a ponta nesta atualização.
- Projeção privilegiada fica no schema privado, com conferência de auth.uid e app_metadata; RPC pública usa SECURITY INVOKER.

- Validação final da recepção: 11/11 testes passaram, build com 114 módulos concluído e pacote danadinhos-entrega.zip atualizado. Advisor de segurança sem novos avisos; permanece a configuração preexistente de senhas vazadas.

## Importação CSV — 12/11/2026

- 17 testes automatizados aprovados, incluindo CSV brasileiro, BOM/CRLF, aspas escapadas, campos multilinha, idade inválida, cabeçalhos ambíguos, limites e deduplicação.
- Teste transacional real `database/test-guest-import.sql`: inserção em lote pela recepção, repetição idempotente, ausência de check-in automático e rollback integral de lote inválido. Dados de teste revertidos.
- Navegador com fixture isolada: arquivo de duas linhas iguais mostrou um convidado para importar e um duplicado ignorado; confirmação adicionou exatamente um convidado com telefone preservado e status Não entrou.
- Corrigida a delimitação SQL da função pública no script local reception.sql para instalação em ambientes novos. Banco existente já possuía a função correta.

## Sistema de cozinha — 19/11/2026

- 20/20 testes automatizados aprovados; build Vite concluído com 120 módulos.
- Teste real no Supabase com ROLLBACK: consulta de festa e ficha, cálculo decimal do saldo, leitura de quantidades, bloqueio de edição de festa/cardápio/estoque/quantidades pela cozinha, checklist com conclusão/reabertura/responsável, bloqueio de troca de festa da tarefa e de edição em festa cancelada, isolamento do perfil recepção, gestão de quantidades pela gestora.
- Navegador com fixture isolada: data/horário/convidados/cardápio/quantidades visíveis; marcar tarefa atualiza horário e contador; estoque exibe saldo de bebidas e materiais de limpeza com alerta no mínimo. Não houve teste autenticado ponta a ponta nesta atualização.
- Teste de recepção atualizado para reconhecer a nova permissão intencional de leitura da ficha de cardápio pela cozinha; lista de convidados permanece bloqueada.
## Correção da tela branca — 19/11/2026

- Causa reproduzida: Manager usava onKitchen no menu sem recebê-lo nas props, causando ReferenceError na primeira renderização. Com sessão de gestora persistida, a falha pode aparecer imediatamente ao abrir, antes de exibir login.
- Corrigida a declaração da prop e adicionado AppBoundary para mostrar mensagem de recuperação em falhas de renderização/carregamento de módulos.
- Teste de renderização falhou com o erro original e passou após correção. As três áreas são verificadas; total de 23 testes aprovados.
- Build real aberto em http://127.0.0.1:4173 sem sessão: login exibido, nenhum erro/aviso no console. Não foi identificado o endereço utilizado pelo usuário; publicação online não foi alterada nesta correção.
