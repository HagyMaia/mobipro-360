import { createBrowserClient } from '@supabase/ssr'

type DemoUser = {
  id: string;
  email: string;
  app_metadata?: Record<string, unknown>;
  user_metadata?: Record<string, unknown>;
};

type DemoSession = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  expires_at: number;
  token_type: string;
  user: DemoUser;
};

type DemoDriver = {
  id: string;
  email: string;
  password?: string;
  nome: string;
  nome_social?: string;
  nome_completo?: string;
  avatar_url?: string;
  cpf: string;
  cnh: string;
  telefone: string;
  marca_veiculo: string;
  modelo_veiculo: string;
  ano_veiculo: string;
  placa_veiculo: string;
  cor_veiculo?: string;
  categoria: string;
  status: 'Pendente' | 'Aprovado' | 'Reprovado';
  vehicle_status?: 'Pendente' | 'Aprovado' | 'Reprovado';
  work_status?: 'ONLINE' | 'OFFLINE' | 'BUSY';
  created_at: string;
};

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(
  rawUrl &&
  supabaseAnonKey &&
  !rawUrl.includes('placeholder') &&
  !rawUrl.includes('example') &&
  !supabaseAnonKey.includes('placeholder') &&
  rawUrl.startsWith('http')
)

function normalizeSupabaseUrl(url: string) {
  try {
    const u = new URL(url)
    return u.origin
  } catch {
    return url.replace(/\/rest\/v1.*$/i, '').replace(/\/+$/g, '')
  }
}

export const browserUrl = isSupabaseConfigured ? normalizeSupabaseUrl(rawUrl as string) : 'https://placeholder.supabase.co'
const browserKey = supabaseAnonKey || 'placeholder-anon-key'

const DEMO_DRIVERS_KEY = 'mobipro-demo-drivers'
const DEMO_ACCOUNTS_KEY = 'mobipro-demo-accounts'
const DEMO_SESSION_KEY = 'mobipro-demo-session'
const DEFAULT_DEMO_EMAIL = 'motorista@demo.local'
const DEFAULT_DEMO_PASSWORD = 'demo123'

function readStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback

  try {
    const rawValue = window.localStorage.getItem(key)
    return rawValue ? (JSON.parse(rawValue) as T) : fallback
  } catch {
    return fallback
  }
}

function writeStorage<T>(key: string, value: T) {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Ignora falhas locais de armazenamento
  }
}

function setDemoCookie(userId: string) {
  if (typeof document !== 'undefined') {
    document.cookie = `sb-demo-token=${userId}; path=/; max-age=86400; SameSite=Lax`
  }
}

function clearDemoCookie() {
  if (typeof document !== 'undefined') {
    document.cookie = 'sb-demo-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax'
  }
}

function getDemoDrivers(): DemoDriver[] {
  return readStorage(DEMO_DRIVERS_KEY, [])
}

function setDemoDrivers(drivers: DemoDriver[]) {
  writeStorage(DEMO_DRIVERS_KEY, drivers)
}

function getDemoAccounts(): Array<{ email: string; password?: string; userId: string }> {
  return readStorage(DEMO_ACCOUNTS_KEY, [])
}

function setDemoAccounts(accounts: Array<{ email: string; password?: string; userId: string }>) {
  writeStorage(DEMO_ACCOUNTS_KEY, accounts)
}

function createDemoSession(user: DemoUser): DemoSession {
  const session: DemoSession = {
    access_token: `demo-access-token-${user.id}`,
    refresh_token: `demo-refresh-token-${user.id}`,
    expires_in: 86400,
    expires_at: Date.now() + 86400 * 1000,
    token_type: 'bearer',
    user,
  }

  writeStorage(DEMO_SESSION_KEY, session)
  setDemoCookie(user.id)
  return session
}

function readDemoSession(): DemoSession | null {
  return readStorage<DemoSession | null>(DEMO_SESSION_KEY, null)
}

function clearDemoSession() {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(DEMO_SESSION_KEY)
    clearDemoCookie()
  }
}

function buildDemoUser(id: string, email: string): DemoUser {
  return {
    id,
    email: email.trim().toLowerCase(),
    app_metadata: { provider: 'demo' },
    user_metadata: { source: 'local-demo' },
  }
}

function ensureDemoDriverRecord(userId: string, email: string, password = 'demo123', status: DemoDriver['status'] = 'Aprovado') {
  const records = getDemoDrivers()
  const normalizedEmail = email.trim().toLowerCase()

  const existingIndex = records.findIndex((r) => r.id === userId || r.email === normalizedEmail)
  if (existingIndex >= 0) {
    records[existingIndex].status = status
    if (!records[existingIndex].nome_social && records[existingIndex].nome) {
      records[existingIndex].nome_social = records[existingIndex].nome
    }
    setDemoDrivers([...records])
    return
  }

  const defaultSocial = normalizedEmail.includes('demo') ? 'Carlos' : normalizedEmail.split('@')[0] || 'Motorista'
  const defaultFull = normalizedEmail.includes('demo') ? 'Carlos Eduardo da Silva' : defaultSocial

  setDemoDrivers([
    ...records,
    {
      id: userId,
      email: normalizedEmail,
      password,
      nome: defaultSocial,
      nome_social: defaultSocial,
      nome_completo: defaultFull,
      cpf: '000.000.000-00',
      cnh: '00000000000',
      telefone: '(92) 98492-3316',
      marca_veiculo: 'Chevrolet',
      modelo_veiculo: 'Onix Plus',
      ano_veiculo: '2024',
      placa_veiculo: 'ABC1D23',
      cor_veiculo: 'Prata',
      categoria: 'POPULAR',
      status,
      vehicle_status: 'Aprovado',
      work_status: 'OFFLINE',
      created_at: new Date().toISOString(),
    },
  ])
}

function ensureDefaultDemoAccount() {
  const accounts = getDemoAccounts()
  const existing = accounts.find((account) => account.email === DEFAULT_DEMO_EMAIL)

  if (existing) {
    ensureDemoDriverRecord(existing.userId, existing.email, existing.password, 'Aprovado')
    return
  }

  const userId = 'demo-driver-default'
  const nextAccounts = [...accounts, {
    email: DEFAULT_DEMO_EMAIL,
    password: DEFAULT_DEMO_PASSWORD,
    userId,
  }]

  setDemoAccounts(nextAccounts)
  ensureDemoDriverRecord(userId, DEFAULT_DEMO_EMAIL, DEFAULT_DEMO_PASSWORD, 'Aprovado')
}

const MOCK_TABLES_KEY = 'mobipro-mock-tables'

function getMockTablesData(): Record<string, any[]> {
  if (typeof window === 'undefined') {
    return { motoristas: getDemoDrivers(), rides: [], vehicles: [], 'driver-documents': [] }
  }

  try {
    const raw = window.localStorage.getItem(MOCK_TABLES_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      return {
        motoristas: parsed.motoristas || getDemoDrivers(),
        rides: parsed.rides || [],
        vehicles: parsed.vehicles || [],
        'driver-documents': parsed['driver-documents'] || [],
      }
    }
  } catch {
    // fallback
  }

  return { motoristas: getDemoDrivers(), rides: [], vehicles: [], 'driver-documents': [] }
}

function setMockTableData(tableName: string, records: any[]) {
  if (tableName === 'motoristas') {
    setDemoDrivers(records)
  }

  if (typeof window === 'undefined') return

  try {
    const current = getMockTablesData()
    current[tableName] = records
    window.localStorage.setItem(MOCK_TABLES_KEY, JSON.stringify(current))
  } catch {
    // fallback
  }
}

function loadTableData(tableName: string): any[] {
  if (tableName === 'motoristas') {
    const drivers = getDemoDrivers()
    if (drivers.length === 0) {
      ensureDefaultDemoAccount()
      return getDemoDrivers()
    }
    return drivers
  }

  const tables = getMockTablesData()
  return tables[tableName] || []
}

function persistTableData(tableName: string, records: any[]) {
  setMockTableData(tableName, records)
}

export function createMockSupabase() {
  ensureDefaultDemoAccount()

  return {
    auth: {
      async signUp({ email, password }: { email: string; password: string }) {
        const normalizedEmail = email.trim().toLowerCase()
        const accounts = getDemoAccounts()
        let account = accounts.find((a) => a.email === normalizedEmail)

        if (!account) {
          const userId = `demo-driver-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
          account = { email: normalizedEmail, password, userId }
          setDemoAccounts([...accounts, account])
          ensureDemoDriverRecord(userId, normalizedEmail, password, 'Aprovado')
        }

        const user = buildDemoUser(account.userId, normalizedEmail)
        const session = createDemoSession(user)

        return { data: { user, session }, error: null }
      },

      async signInWithPassword({ email, password }: { email: string; password: string }) {
        const normalizedEmail = email.trim().toLowerCase()
        const accounts = getDemoAccounts()
        let account = accounts.find((entry) => entry.email === normalizedEmail)

        // No modo demo/preview, se o usuário digitar qualquer email e senha, autentica como motorista aprovado!
        if (!account) {
          const userId = `demo-driver-${Date.now()}`
          account = { email: normalizedEmail, password, userId }
          setDemoAccounts([...accounts, account])
        }

        ensureDemoDriverRecord(account.userId, normalizedEmail, password || 'demo123', 'Aprovado')

        const user = buildDemoUser(account.userId, normalizedEmail)
        const session = createDemoSession(user)

        return {
          data: { user, session },
          error: null,
        }
      },

      async signOut() {
        clearDemoSession()
        return { error: null }
      },

      async getSession() {
        return {
          data: { session: readDemoSession() },
          error: null,
        }
      },

      async getUser() {
        const session = readDemoSession()
        return {
          data: { user: session?.user ?? null },
          error: null,
        }
      },

      async resetPasswordForEmail(email: string) {
        return {
          data: { user: null },
          error: null,
          email,
        }
      },

      onAuthStateChange(callback: (event: string, session: DemoSession | null) => void) {
        const session = readDemoSession()
        if (session) {
          setTimeout(() => callback('SIGNED_IN', session), 0)
        }

        return {
          data: {
            subscription: {
              unsubscribe: () => undefined,
            },
          },
        }
      },
    },

    storage: {
      from(bucket: string) {
        return {
          async upload(path: string, file: any, options?: any) {
            return { data: { path }, error: null }
          },
          getPublicUrl(path: string) {
            return { data: { publicUrl: `https://placeholder-storage.local/${bucket}/${path}` } }
          },
          async download(path: string) {
            return { data: new Blob([]), error: null }
          },
          async remove(paths: string[]) {
            return { data: paths, error: null }
          },
        }
      },
    },

    channel(name: string) {
      const channelObj = {
        on(event: string, filter: any, callback: (payload: any) => void) {
          return channelObj
        },
        subscribe(callback?: (status: string) => void) {
          if (callback) {
            setTimeout(() => callback('SUBSCRIBED'), 0)
          }
          return channelObj
        },
        unsubscribe() {
          return Promise.resolve()
        },
      }
      return channelObj
    },

    removeChannel(channel: any) {
      return Promise.resolve()
    },

    from(table: string) {
      const executeOperation = (
        filters: Array<(row: any) => boolean>,
        pendingUpdate: Record<string, any> | null,
        pendingDelete: boolean,
        orderCol: string | null,
        orderAsc: boolean,
        limitCount: number | null
      ) => {
        let current = loadTableData(table)
        let filtered = current.filter((row) => filters.every((fn) => fn(row)))

        if (pendingUpdate) {
          current = current.map((row) => {
            const matches = filters.every((fn) => fn(row))
            if (matches) {
              return { ...row, ...pendingUpdate }
            }
            return row
          })
          persistTableData(table, current)
          filtered = current.filter((row) => filters.every((fn) => fn(row)))
        } else if (pendingDelete) {
          current = current.filter((row) => !filters.every((fn) => fn(row)))
          persistTableData(table, current)
        }

        if (orderCol) {
          filtered = [...filtered].sort((a, b) => {
            const valA = a[orderCol!] ?? ''
            const valB = b[orderCol!] ?? ''
            const comp = String(valA).localeCompare(String(valB), undefined, { numeric: true })
            return orderAsc ? comp : -comp
          })
        }

        if (limitCount !== null) {
          filtered = filtered.slice(0, limitCount)
        }

        return filtered
      }

      const createQueryBuilder = (initialFilters: Array<(row: any) => boolean> = []) => {
        const filters = [...initialFilters]
        let pendingUpdate: Record<string, any> | null = null
        let pendingDelete = false
        let orderCol: string | null = null
        let orderAsc = true
        let limitCount: number | null = null

        const builder: any = {
          select(columns?: string) {
            return builder
          },
          update(values: Record<string, any>) {
            pendingUpdate = values
            return builder
          },
          delete() {
            pendingDelete = true
            return builder
          },
          eq(column: string, value: any) {
            filters.push((row) => String(row[column] ?? '') === String(value ?? ''))
            return builder
          },
          neq(column: string, value: any) {
            filters.push((row) => String(row[column] ?? '') !== String(value ?? ''))
            return builder
          },
          in(column: string, values: any[]) {
            filters.push((row) => values.map(String).includes(String(row[column] ?? '')))
            return builder
          },
          order(column: string, options?: { ascending?: boolean }) {
            orderCol = column
            orderAsc = options?.ascending !== false
            return builder
          },
          limit(count: number) {
            limitCount = count
            return builder
          },
          single() {
            const results = executeOperation(filters, pendingUpdate, pendingDelete, orderCol, orderAsc, limitCount)
            const row = results[0] || (table === 'motoristas' ? getDemoDrivers()[0] : null) || {
              id: 'demo-driver-default',
              email: DEFAULT_DEMO_EMAIL,
              nome: 'Motorista SR',
              status: 'Aprovado',
              work_status: 'ONLINE',
            }
            return Promise.resolve({ data: row, error: null })
          },
          maybeSingle() {
            const results = executeOperation(filters, pendingUpdate, pendingDelete, orderCol, orderAsc, limitCount)
            const row = results[0] || (table === 'motoristas' ? getDemoDrivers()[0] : null) || {
              id: 'demo-driver-default',
              email: DEFAULT_DEMO_EMAIL,
              nome: 'Motorista SR',
              status: 'Aprovado',
              work_status: 'ONLINE',
            }
            return Promise.resolve({ data: row, error: null })
          },
          then(onfulfilled?: any, onrejected?: any) {
            const results = executeOperation(filters, pendingUpdate, pendingDelete, orderCol, orderAsc, limitCount)
            return Promise.resolve({ data: results, error: null }).then(onfulfilled, onrejected)
          },
        }

        return builder
      }

      return {
        async insert(values: any) {
          const records = loadTableData(table)
          const itemsToInsert = Array.isArray(values) ? values : [values]

          const nextRecords = itemsToInsert.map((item) => ({
            ...item,
            id: String(item.id || `demo-${table}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`),
            status: item.status || (table === 'motoristas' ? 'Aprovado' : 'PENDING'),
            work_status: item.work_status || 'OFFLINE',
            created_at: item.created_at || new Date().toISOString(),
          }))

          persistTableData(table, [...records, ...nextRecords])
          return { error: null, data: nextRecords }
        },

        select(columns?: string) {
          return createQueryBuilder().select(columns)
        },

        update(values: Record<string, any>) {
          return createQueryBuilder().update(values)
        },

        delete() {
          return createQueryBuilder().delete()
        },
      }
    },
  }
}

const browserClient = isSupabaseConfigured
  ? createBrowserClient(browserUrl, browserKey)
  : createMockSupabase()

export const supabase = browserClient as any
export const createClient = () => (isSupabaseConfigured ? createBrowserClient(browserUrl, browserKey) : createMockSupabase()) as any
