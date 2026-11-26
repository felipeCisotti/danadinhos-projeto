# Danadinhos
O site público fica em `site/`. A aplicação da equipe fica em `sistema/`, com login em `/admin/` e acesso por perfil.

Com Node 24 e npm, execute na raiz:
1. `npm run setup` para instalar as dependências dos dois projetos.
2. Configure `sistema/.env.local` conforme `sistema/.env.example` para habilitar o login. Consulte `sistema/README.md` para configurar banco e perfis.
3. `npm start` para compilar e abrir o servidor de prévia. No endereço exibido, visite `/` ou `/admin`.
4. `npm test` para os testes do sistema.

Para publicar, rode `npm run build` e envie o conteúdo de `dist/` à hospedagem estática. Preserve a pasta `admin/` e habilite o índice de diretório (index.html). Caso haja uma regra global que redirecione tudo ao site, priorize `/admin` e `/admin/` apontando para `/admin/index.html`. Só as variáveis públicas VITE_ devem fazer parte da compilação.
