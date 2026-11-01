# ControleCC

Aplicação Next.js para controle de atividades e certificados, executada em infraestrutura própria com PostgreSQL, MinIO, Auth.js, SMTP e Caddy. O navegador nunca acessa o banco nem recebe credenciais do armazenamento.

## Desenvolvimento com Docker

1. Copie `.env.example` para `.env` e troque todas as senhas e segredos.
2. Para desenvolvimento local, mantenha `APP_URL=http://127.0.0.1`, `NEXTAUTH_URL=http://127.0.0.1`, `S3_PUBLIC_ENDPOINT=http://127.0.0.1:9000`, `CADDY_APP_ADDRESS=http://127.0.0.1` e `CADDY_STORAGE_ADDRESS=http://127.0.0.1:9000`. Em produção, configure os dois endereços do Caddy com os domínios HTTPS reais.
3. Execute `docker compose up --build`.
4. Abra `http://localhost`. O Mailpit está na rede Docker; exponha sua interface apenas no perfil de desenvolvimento se precisar inspecionar e-mails.

O schema inicial é aplicado ao criar o volume do PostgreSQL por meio de `db/migrations/001_initial.sql`. Em uma base existente, execute novas migrations explicitamente antes de publicar a nova aplicação.

## Primeiro administrador

Cadastre e confirme uma conta e, em seguida, promova-a diretamente no PostgreSQL:

```sql
UPDATE users SET role = 'admin' WHERE email = 'administrador@instituicao.br';
```

## Arquivos

O bucket `certificados` é privado. Uploads e downloads usam URLs pré-assinadas com validade de cinco minutos pelo host `storage.<domínio>`, que é encaminhado ao MinIO pelo Caddy. PDFs são limitados a 5 MB; o registro da atividade preserva o hash SHA-256 único.

## E-mail

Em desenvolvimento, o SMTP padrão é `mailpit:1025`. Em produção, configure `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD` e `SMTP_FROM` com o servidor institucional.

## Backup

O Compose mantém dumps do PostgreSQL em `postgres_backups` e um espelho diário dos certificados em `minio_backups`. Esses dois volumes precisam ser replicados para armazenamento externo; volumes Docker isoladamente não são backup. Teste restaurações regularmente.

## Migração de instalações antigas

Exporte usuários, cursos, projetos, tipos e atividades da instalação anterior, normalize os IDs para UUID e importe-os em uma transação, respeitando a ordem das chaves estrangeiras. Copie os PDFs para `certificados/{userId}/{activityId}.pdf` e grave essa chave em `activities.file_key`. Como hashes de senha externos não são importados, crie tokens de redefinição para esses usuários. Valide contagens, hashes e uma amostra de downloads antes da troca de DNS.

## Verificação

```bash
npm ci
npm test
npx tsc --noEmit
npm run build
```

Antes de publicar sobre uma base existente, aplique todas as migrations ainda não executadas em ordem. A migration `002_notifications.sql` adiciona as notificações de avaliação destinadas aos estudantes.
