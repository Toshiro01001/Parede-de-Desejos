# A Parede de Desejos

Site estático (HTML/CSS/JS) que concede desejos e cobra um preço por cada um, com o preço gerado ao vivo por um modelo de IA. O preço cresce conforme **o nível escolhido (0 a 6)** e **quantos desejos aquele suplicante já fez**.

A IA roda atrás de um **Cloudflare Worker** (caminho A): a sua chave da API fica no Worker, nunca no navegador. O GitHub Pages serve só a parte visível.

```
parede-de-desejos/
├── index.html        ← a página
├── style.css         ← a estética
├── app.js            ← a lógica (cole aqui a URL do Worker)
├── worker/
│   ├── worker.js     ← o backend (vai para o Cloudflare)
│   └── wrangler.toml ← configuração do Worker
└── README.md
```

---

## Parte 1 — Publicar o site no GitHub Pages

1. Crie um repositório no GitHub e suba `index.html`, `style.css` e `app.js` na **raiz** (a pasta `worker/` não precisa ir, mas não atrapalha).
2. No repositório: **Settings → Pages → Branch: `main` / `/root` → Save**.
3. Em um minuto o site fica no ar em `https://SEU-USUARIO.github.io/NOME-DO-REPO/`.

Nesse ponto o visual já funciona, mas a Parede ainda está "adormecida": ela só concede desejos depois da Parte 2.

---

## Parte 2 — Acordar a Parede (Cloudflare Worker)

Precisa ser feito uma vez. É gratuito para uso pessoal.

**1. Instale o Wrangler** (ferramenta da Cloudflare; exige Node.js):
```bash
npm install -g wrangler
wrangler login
```

**2. Entre na pasta do Worker:**
```bash
cd parede-de-desejos/worker
```

**3. Crie o KV** (a "pedra" que lembra a contagem) e copie o `id` que aparecer:
```bash
wrangler kv namespace create WISHES
```
Abra `wrangler.toml` e cole esse `id` no lugar de `COLE_AQUI_O_ID_DO_KV_NAMESPACE`.

**4. Guarde a sua chave da API como segredo** (não vai para o código):
```bash
wrangler secret put ANTHROPIC_API_KEY
```
Cole a chave quando for pedido. Pegue a sua em https://console.anthropic.com/ .

**5. Publique o Worker:**
```bash
wrangler deploy
```
Ao final, ele mostra a URL, algo como
`https://parede-de-desejos.SEU-SUBDOMINIO.workers.dev`. Guarde-a.

---

## Parte 3 — Ligar o site ao Worker

1. Abra `app.js` e troque a primeira linha de `CONFIG`:
   ```js
   WORKER_URL: "https://parede-de-desejos.SEU-SUBDOMINIO.workers.dev",
   ```
2. Suba o `app.js` atualizado para o GitHub. Pronto: a Parede acordou.
3. **Recomendado:** em `worker/wrangler.toml`, troque `ALLOWED_ORIGIN = "*"` pela sua origem real (`"https://SEU-USUARIO.github.io"`) e rode `wrangler deploy` de novo, para que só o seu site possa falar com o Worker.

---

## Sobre o modelo

O Worker usa, por padrão, `claude-sonnet-4-6` (bom equilíbrio de qualidade, velocidade e custo). Para respostas mais densas, troque `MODEL` em `wrangler.toml` para um modelo Opus e rode `wrangler deploy`. Confirme o identificador exato do modelo na documentação da Anthropic, pois esses nomes mudam com o tempo.

## Como o preço é calculado

O Worker incrementa o contador do suplicante no KV e envia ao modelo: quem pediu, **qual o nível 0–6** e **qual reincidência** (1º, 2º, 9º desejo…). O modelo devolve um preço clínico e ritualístico, com a atmosfera dos cinco elementos do Outro Lado destilada, mas **sem nunca nomear o sistema**. Quanto maior o nível e a reincidência, mais atroz o preço.

## Privacidade e custo

Cada desejo é uma chamada à API (você paga por uso). Como só você usa, mantenha `ALLOWED_ORIGIN` restrito e não divulgue a URL do Worker.
