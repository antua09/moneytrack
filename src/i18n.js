export const LANGS = {
  es: "Español",
  en: "English",
  zh: "中文",
};

export const TR = {
  // Auth
  appTagline:       { es:"Control de gastos semanal", en:"Weekly expense tracker", zh:"每周支出追踪" },
  signIn:           { es:"Iniciar sesión", en:"Sign in", zh:"登录" },
  signUp:           { es:"Crear cuenta", en:"Create account", zh:"注册" },
  signOut:          { es:"Cerrar sesión", en:"Sign out", zh:"退出" },
  email:            { es:"Correo electrónico", en:"Email", zh:"电子邮件" },
  emailOrUser:      { es:"Email o nombre de usuario", en:"Email or username", zh:"邮箱或用户名" },
  password:         { es:"Contraseña", en:"Password", zh:"密码" },
  yourName:         { es:"Tu nombre completo", en:"Your full name", zh:"你的全名" },
  username:         { es:"Nombre de usuario", en:"Username", zh:"用户名" },
  usernameTip:      { es:"3–20 caracteres, sin espacios", en:"3–20 chars, no spaces", zh:"3-20个字符，无空格" },
  enter:            { es:"Entrar", en:"Enter", zh:"进入" },
  loading:          { es:"Cargando...", en:"Loading...", zh:"加载中..." },
  saving:           { es:"Guardando...", en:"Saving...", zh:"保存中..." },
  howPrivate:       { es:"¿Cómo se protegen mis datos?", en:"How is my data protected?", zh:"我的数据如何被保护？" },
  hidePrivacy:      { es:"Ocultar", en:"Hide", zh:"隐藏" },
  syncedCloud:      { es:"☁️ Sincronizado · 🔒 Cifrado AES-256", en:"☁️ Synced · 🔒 AES-256 Encrypted", zh:"☁️ 已同步 · 🔒 AES-256加密" },

  // Errors
  errFields:        { es:"Completa todos los campos.", en:"Fill in all fields.", zh:"请填写所有字段。" },
  errName:          { es:"Escribe tu nombre.", en:"Enter your name.", zh:"请输入您的姓名。" },
  errUsername:      { es:"El nombre de usuario debe tener 3–20 caracteres alfanuméricos.", en:"Username must be 3–20 alphanumeric characters.", zh:"用户名必须为3-20个字母数字字符。" },
  errUserTaken:     { es:"Ese nombre de usuario ya está en uso.", en:"That username is already taken.", zh:"该用户名已被使用。" },
  errEmailUsed:     { es:"Este email ya está registrado.", en:"Email already in use.", zh:"该邮箱已注册。" },
  errCreds:         { es:"Email/usuario o contraseña incorrectos.", en:"Wrong email/username or password.", zh:"邮箱/用户名或密码错误。" },
  errInvalidEmail:  { es:"Email inválido.", en:"Invalid email.", zh:"无效邮箱。" },
  errWeakPass:      { es:"Contraseña mínimo 6 caracteres.", en:"Password min 6 characters.", zh:"密码至少6个字符。" },
  errNetwork:       { es:"Sin conexión. Revisa tu internet.", en:"No connection. Check your internet.", zh:"无网络连接。" },
  errGeneric:       { es:"Ocurrió un error. Intenta de nuevo.", en:"An error occurred. Try again.", zh:"发生错误，请重试。" },
  errUserNotFound:  { es:"Usuario no encontrado.", en:"User not found.", zh:"用户未找到。" },

  // Nav
  week:             { es:"Semana", en:"Week", zh:"本周" },
  analysis:         { es:"Análisis", en:"Analysis", zh:"分析" },
  incomes:          { es:"Ingresos", en:"Income", zh:"收入" },
  add:              { es:"Agregar", en:"Add", zh:"添加" },
  history:          { es:"Historial", en:"History", zh:"历史" },

  // Header
  budget:           { es:"Presupuesto", en:"Budget", zh:"预算" },
  configHere:       { es:"— Configura aquí", en:"— Configure here", zh:"— 在此配置" },
  spent:            { es:"Gastado", en:"Spent", zh:"已花费" },
  remaining:        { es:"Quedan", en:"Remaining", zh:"剩余" },
  exceeded:         { es:"Excedido", en:"Exceeded", zh:"超出" },
  used:             { es:"% usado", en:"% used", zh:"% 已用" },
  idealDay:         { es:"/día ideal", en:"/day ideal", zh:"/天理想" },
  thisWeek:         { es:"Esta semana", en:"This week", zh:"本周" },

  // Dashboard
  noExpenses:       { es:"Sin gastos esta semana", en:"No expenses this week", zh:"本周没有支出" },
  tapAdd:           { es:"Toca ➕ para registrar", en:"Tap ➕ to add one", zh:"点击 ➕ 添加" },
  expByDay:         { es:"Gastos por Día (MXN)", en:"Expenses by Day (MXN)", zh:"每日支出 (MXN)" },
  byCategory:       { es:"Por Categoría", en:"By Category", zh:"按类别" },
  distributionMXN:  { es:"Distribución MXN", en:"Distribution MXN", zh:"MXN分布" },
  cashVsCard:       { es:"Efectivo vs Tarjetas", en:"Cash vs Cards", zh:"现金 vs 卡" },
  cash:             { es:"Efectivo", en:"Cash", zh:"现金" },

  // Analysis
  noData:           { es:"Sin datos aún", en:"No data yet", zh:"暂无数据" },
  thisMonth:        { es:"Este mes", en:"This month", zh:"本月" },
  days:             { es:"días", en:"days", zh:"天" },
  avgDay:           { es:"Prom/día", en:"Avg/day", zh:"日均" },
  currentMonth:     { es:"mes actual", en:"current month", zh:"当前月份" },
  bestWeek:         { es:"Mejor sem.", en:"Best week", zh:"最佳周" },
  noDataShort:      { es:"sin datos", en:"no data", zh:"无数据" },
  avgWeek:          { es:"Prom/sem.", en:"Avg/week", zh:"周均" },
  historical:       { es:"histórico", en:"historical", zh:"历史" },
  last5Weeks:       { es:"Últimas 5 Semanas", en:"Last 5 Weeks", zh:"最近5周" },
  catHistorical:    { es:"Categorías — Histórico", en:"Categories — Historical", zh:"类别 — 历史" },

  // Income dashboard
  incomeWeek:       { es:"Ingresos sem.", en:"Income week", zh:"本周收入" },
  expWeek:          { es:"Gastos sem.", en:"Expenses week", zh:"本周支出" },
  balanceWeek:      { es:"Balance sem.", en:"Balance week", zh:"本周结余" },
  surplus:          { es:"Superávit", en:"Surplus", zh:"盈余" },
  deficit:          { es:"Déficit", en:"Deficit", zh:"亏损" },
  savingsRate:      { es:"Tasa ahorro", en:"Savings rate", zh:"储蓄率" },
  ofIncome:         { es:"de tus ingresos", en:"of your income", zh:"收入占比" },
  last6Weeks:       { es:"Últimas 6 Semanas", en:"Last 6 Weeks", zh:"最近6周" },
  last6Months:      { es:"Últimos 6 Meses", en:"Last 6 Months", zh:"最近6个月" },
  monthlyBalance:   { es:"Balance Mensual", en:"Monthly Balance", zh:"月度结余" },
  incomeSources:    { es:"Fuentes de Ingreso", en:"Income Sources", zh:"收入来源" },
  totalIncome:      { es:"Total ingresos", en:"Total income", zh:"总收入" },
  totalExpenses:    { es:"Total gastos", en:"Total expenses", zh:"总支出" },
  totalBalance:     { es:"Balance total", en:"Total balance", zh:"总结余" },
  incomesWeek:      { es:"📥 Ingresos esta semana", en:"📥 Income this week", zh:"📥 本周收入" },

  // Add expense/income
  registerExpense:  { es:"Registrar gasto", en:"Register expense", zh:"记录支出" },
  registerIncome:   { es:"Registrar ingreso", en:"Register income", zh:"记录收入" },
  amount:           { es:"Monto", en:"Amount", zh:"金额" },
  category:         { es:"Categoría", en:"Category", zh:"类别" },
  method:           { es:"Método", en:"Method", zh:"方式" },
  date:             { es:"Fecha", en:"Date", zh:"日期" },
  note:             { es:"Nota (opcional)", en:"Note (optional)", zh:"备注（可选）" },
  noteExpPlaceholder:{ es:"¿En qué gastaste?", en:"What did you spend on?", zh:"花费了什么？" },
  noteIncPlaceholder:{ es:"Descripción del ingreso", en:"Income description", zh:"收入描述" },
  addExpense:       { es:"➕ Agregar Gasto", en:"➕ Add Expense", zh:"➕ 添加支出" },
  addIncome:        { es:"📥 Registrar Ingreso", en:"📥 Register Income", zh:"📥 记录收入" },
  cancel:           { es:"Cancelar", en:"Cancel", zh:"取消" },
  source:           { es:"Fuente", en:"Source", zh:"来源" },
  noCards:          { es:"No tienes tarjetas agregadas", en:"No cards added yet", zh:"还没有添加卡片" },
  addCard:          { es:"+ Agregar tarjeta", en:"+ Add card", zh:"+ 添加卡片" },
  manageCards:      { es:"+ Gestionar tarjetas", en:"+ Manage cards", zh:"+ 管理卡片" },
  expenseTab:       { es:"📤 Gasto", en:"📤 Expense", zh:"📤 支出" },
  incomeTab:        { es:"📥 Ingreso", en:"📥 Income", zh:"📥 收入" },

  // History
  historyTitle:     { es:"Historial", en:"History", zh:"历史" },
  expenses:         { es:"gastos", en:"expenses", zh:"支出" },
  noExpWeek:        { es:"Sin gastos esta semana", en:"No expenses this week", zh:"本周没有支出" },
  todayPrefix:      { es:"Hoy — ", en:"Today — ", zh:"今天 — " },
  delete:           { es:"🗑️ borrar", en:"🗑️ delete", zh:"🗑️ 删除" },

  // Settings
  settings:         { es:"⚙️ Ajustes", en:"⚙️ Settings", zh:"⚙️ 设置" },
  theme:            { es:"Tema", en:"Theme", zh:"主题" },
  dark:             { es:"🌙 Oscuro", en:"🌙 Dark", zh:"🌙 深色" },
  light:            { es:"☀️ Claro", en:"☀️ Light", zh:"☀️ 浅色" },
  fontSize:         { es:"Tamaño de letra", en:"Font size", zh:"字体大小" },
  small:            { es:"Pequeño", en:"Small", zh:"小" },
  normal:           { es:"Normal", en:"Normal", zh:"正常" },
  large:            { es:"Grande", en:"Large", zh:"大" },
  previewText:      { es:"Vista previa de texto normal", en:"Normal text preview", zh:"正常文字预览" },
  previewSub:       { es:"Así se verá el texto secundario", en:"This is how secondary text looks", zh:"次要文字的显示效果" },
  language:         { es:"Idioma", en:"Language", zh:"语言" },
  features:         { es:"Funciones", en:"Features", zh:"功能" },
  incomeMode:       { es:"💰 Modo Ingresos", en:"💰 Income Mode", zh:"💰 收入模式" },
  incomeModeDesc:   { es:"Registra tus ingresos y compáralos contra tus gastos", en:"Track income and compare against expenses", zh:"追踪收入并与支出对比" },
  incomeModeOn:     { es:"Activado — Aparecerán nuevas pestañas para ingresos y dashboards", en:"Enabled — New tabs for income tracking and dashboards", zh:"已启用 — 将显示收入追踪和仪表板的新标签" },
  privacySec:       { es:"🔒 Privacidad y seguridad", en:"🔒 Privacy & Security", zh:"🔒 隐私与安全" },
  privacyLines:     {
    es:["Cifrado AES-256 en reposo (Firebase/Google)","Transmisión protegida con TLS 1.3","Solo tú puedes acceder a tus datos","Aislamiento total por usuario en Firestore"],
    en:["AES-256 encryption at rest (Firebase/Google)","TLS 1.3 protected transmission","Only you can access your data","Complete user isolation in Firestore"],
    zh:["AES-256静态加密 (Firebase/Google)","TLS 1.3保护传输","只有您能访问您的数据","Firestore中完整的用户隔离"],
  },
  close:            { es:"✕ Cerrar", en:"✕ Close", zh:"✕ 关闭" },

  // Profile
  avatar:           { es:"Foto de perfil", en:"Profile picture", zh:"头像" },
  chooseAvatar:     { es:"Elige tu avatar", en:"Choose your avatar", zh:"选择你的头像" },
  saveProfile:      { es:"Guardar perfil", en:"Save profile", zh:"保存资料" },
  manageCards2:     { es:"💳 Gestionar tarjetas", en:"💳 Manage cards", zh:"💳 管理卡片" },
  dataPrivate:      { es:"Tus datos están", en:"Your data is", zh:"您的数据是" },
  encrypted:        { es:"cifrados", en:"encrypted", zh:"加密的" },
  andPrivate:       { es:"y son 100% privados", en:"and 100% private", zh:"且100%私密" },

  // Cards
  myCards:          { es:"💳 Mis Tarjetas", en:"💳 My Cards", zh:"💳 我的卡片" },
  noCardsYet:       { es:"No tienes tarjetas aún", en:"No cards yet", zh:"还没有卡片" },
  addCardTitle:     { es:"Agregar tarjeta", en:"Add card", zh:"添加卡片" },
  cardName:         { es:"Nombre (ej. BBVA Débito)", en:"Name (e.g. Chase Debit)", zh:"名称（例：招商借记卡）" },
  last4:            { es:"Últimos 4 dígitos (opcional)", en:"Last 4 digits (optional)", zh:"后4位（可选）" },
  color:            { es:"Color", en:"Color", zh:"颜色" },
  addCardBtn:       { es:"+ Agregar tarjeta", en:"+ Add card", zh:"+ 添加卡片" },
  card:             { es:"Tarjeta", en:"Card", zh:"银行卡" },
  errCardName:      { es:"Escribe el nombre.", en:"Enter a name.", zh:"请输入名称。" },
  errCard4:         { es:"4 dígitos numéricos.", en:"4 numeric digits.", zh:"4位数字。" },

  // Privacy block in login
  privacyBlock: {
    es:"• Cifrado AES-256 en reposo · TLS 1.3 en tránsito\n• Solo tú puedes ver tus datos con tu contraseña\n• Aislamiento total por usuario en Firestore",
    en:"• AES-256 encryption at rest · TLS 1.3 in transit\n• Only you can see your data with your password\n• Full user isolation in Firestore",
    zh:"• AES-256静态加密 · 传输中TLS 1.3\n• 只有您能用密码查看数据\n• Firestore中完整用户隔离",
  },
};

export const t = (key, lang = "es", ...args) => {
  const entry = TR[key];
  if (!entry) return key;
  if (typeof entry === "object" && !Array.isArray(entry)) {
    return entry[lang] ?? entry.es ?? key;
  }
  return key;
};
