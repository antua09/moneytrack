# 💰 MoneyTrack

Tracker de gastos semanal. Funciona como PWA (se puede agregar a la pantalla de inicio del cel).

## Cómo deployar en Vercel

### Opción A — Desde GitHub (recomendada)

1. Sube esta carpeta a un repo en GitHub
2. Ve a vercel.com → "Add New Project"
3. Conecta tu repo
4. Vercel detecta Vite automáticamente → clic en **Deploy**
5. En ~1 minuto tienes tu URL (ej: `moneytrack.vercel.app`)

### Opción B — Desde la terminal (Vercel CLI)

```bash
npm install
npm run build
npx vercel --prod
```

## Cómo correrlo local

```bash
npm install
npm run dev
```

Abre http://localhost:5173

## Agregar a pantalla de inicio (cel)

**Android (Chrome):**
1. Abre la URL en Chrome
2. Menú (3 puntos) → "Añadir a pantalla de inicio"

**iPhone (Safari):**
1. Abre la URL en Safari
2. Botón compartir → "Agregar a pantalla de inicio"

## Stack
- React 18 + Vite
- Recharts (gráficas)
- localStorage (persistencia de datos)
