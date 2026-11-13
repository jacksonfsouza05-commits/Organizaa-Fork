# Servidor do OrganizaAI

## Rodar

```bash
cd codigo/servidor
npm install
cp .env.example .env     # depois preencha o .env
npm run migrate          # cria/atualiza as tabelas (pode rodar de novo sem medo)
npm run seed             # opcional: cria o usuário de teste lucas@email.com / senha123
npm run dev
```

## E-mails (Gmail)

O servidor manda dois tipos de e-mail:

1. **Recuperação de senha**: botão "Esqueci minha senha" na tela de login. O link vale 1 hora e só funciona uma vez.
2. **Aviso de prazo**: um e-mail por dia (a partir das 8h, horário de Brasília) listando as atividades
   não concluídas que estão dentro da antecedência escolhida em Configurações. Cada estudante liga/desliga
   em **Configurações → Notificações → Alertas por e-mail (Gmail)**.

Para ligar, preencha no `.env`:

- `GMAIL_USUARIO`: o Gmail que vai enviar.
- `GMAIL_SENHA_APP`: senha de app de 16 letras. Para criar: Conta Google → Segurança → ligar a verificação
  em duas etapas → <https://myaccount.google.com/apppasswords>. A senha normal da conta não funciona.
- `LINK_DO_APP`: endereço do site publicado (vai dentro do link de recuperação de senha).

Sem `GMAIL_USUARIO`/`GMAIL_SENHA_APP` o servidor sobe normalmente, só não manda e-mails
(em desenvolvimento, o link de recuperação aparece no terminal).

Depois de configurar, entre no site → Configurações → Notificações e clique em **Enviar e-mail de teste**.

Observações:

- O Gmail limita ~500 e-mails por dia em conta pessoal. Para um projeto de faculdade é mais que suficiente.
- Algumas hospedagens gratuitas bloqueiam a saída SMTP. Se o teste falhar só em produção e funcionar
  no seu computador, é isso: veja a documentação da hospedagem.
- O aviso diário só sai enquanto o servidor estiver ligado. Se ele "dormir" (planos gratuitos),
  o e-mail sai assim que ele acordar depois das 8h.
