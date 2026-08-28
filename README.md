# Mahjong — projeto (JavaScript puro)

Convertido de TypeScript para JavaScript puro (ES Modules), sem `tsc` e sem
bundler. Organizado em três pastas:

```
engine/     motor do jogo (extraído do ffalt/mah, model/ original)
frontend/   HTML + CSS + JS que roda no navegador, usa o engine/ direto
backend/    API (Node + Express) — ainda só um esqueleto: rota de health-check
            e comentários indicando onde entram login/cadastro e ranking
```

## Rodar o frontend

```bash
cd frontend
npm run serve
```

Abre um servidor estático (necessário porque `<script type="module">` não
carrega direto de `file://`). O `frontend/main.js` importa o motor
diretamente de `../engine/*.js` — não tem passo de build, é só editar e
recarregar a página.

## Rodar o frontend

```bash
docker compose up -d (raiz do projeto)
criar banco mahjong_db (postgres)
cd backend
npm i
npm run migration:run
npm run dev
```

Testes no insomnia no arquivo na raiz do projeto