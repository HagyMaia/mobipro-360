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
  cpf: string;
  cnh: string;
  telefone: string;
  marca_veiculo: string;
  modelo_veiculo: string;
  ano_veiculo: string;
  placa_veiculo: string;
  categoria: string;
  status: 'Pendente' | 'Aprovado' | 'Reprovado';
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
    setDemoDrivers([...records])
    return
  }

  setDemoDrivers([
    ...records,
    {
      id: userId,
      email: normalizedEmail,
      password,
      nome: normalizedEmail.split('@')[0] || 'Motorista SR',
      cpf: '000.000.000-00',
      cnh: '00000000000',
      telefone: '(92) 99999-0000',
      marca_veiculo: 'Chevrolet',
      modelo_veiculo: 'Onix Plus',
      ano_veiculo: '2024',
      placa_veiculo: 'ABC1D23',
      categoria: 'POPULAR',
      status,
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

    from(table: string) {
      const loadTable = (): DemoDriver[] => {
        if (table === 'motoristas') {
          const drivers = getDemoDrivers()
          if (drivers.length === 0) {
            ensureDefaultDemoAccount()
            return getDemoDrivers()
          }
          return drivers
        }
        return []
      }

      const persistTable = (records: DemoDriver[]) => {
        if (table === 'motoristas') {
          setDemoDrivers(records)
        }
      }

      return {
        async insert(values: Array<Record<string, unknown>>) {
          const records = loadTable()
          const nextRecords = values.map((item) => ({
            ...(item as DemoDriver),
            id: String((item as DemoDriver).id || `demo-driver-${Date.now()}`),
            email: String((item as DemoDriver).email || ''),
            password: String((item as DemoDriver).password || 'demo123'),
            status: ((item as DemoDriver).status as 'Pendente' | 'Aprovado' | 'Reprovado') || 'Aprovado',
            work_status: ((item as DemoDriver).work_status as 'ONLINE' | 'OFFLINE') || 'OFFLINE',
            created_at: new Date().toISOString(),
          }))

          persistTable([...records, ...nextRecords])
          return { error: null, data: nextRecords }
        },

        select(columns?: string) {
          const baseFilters: Array<(record: DemoDriver) => boolean> = []

          const queryChain: any = {
            eq(column: string, value: string) {
              baseFilters.push((record) => String((record as Record<string, unknown>)[column] ?? '') === String(value))
              return queryChain
            },
            order(column: string) {
              return queryChain
            },
            single() {
              const records = loadTable().filter((record) => baseFilters.every((predicate) => predicate(record)))
              const record = records[0] || getDemoDrivers()[0] || {
                id: 'demo-driver-default',
                email: DEFAULT_DEMO_EMAIL,
                nome: 'Motorista SR',
                status: 'Aprovado',
                work_status: 'OFFLINE'
              }
              return Promise.resolve({ data: record, error: null })
            },
            maybeSingle() {
              const records = loadTable().filter((record) => baseFilters.every((predicate) => predicate(record)))
              const record = records[0] || getDemoDrivers()[0] || {
                id: 'demo-driver-default',
                email: DEFAULT_DEMO_EMAIL,
                nome: 'Motorista SR',
                status: 'Aprovado',
                work_status: 'OFFLINE'
              }
              return Promise.resolve({ data: record, error: null })
            },
            then(onfulfilled?: any, onrejected?: any) {
              const records = loadTable().filter((record) => baseFilters.every((predicate) => predicate(record)))
              return Promise.resolve({ data: records, error: null }).then(onfulfilled, onrejected)
            }
          }

          return queryChain
        },

        update(values: Record<string, unknown>) {
          const baseFilters: Array<(record: DemoDriver) => boolean> = []

          const updateChain: any = {
            eq(column: string, value: string) {
              baseFilters.push((record) => String((record as Record<string, unknown>)[column] ?? '') === String(value))

              const records = loadTable().map((record) => {
                if (String((record as Record<string, unknown>)[column] ?? '') === String(value)) {
                  return { ...record, ...values }
                }
                return record
              })
              persistTable(records)

              const updatedRecord = records.find((r) => String((r as Record<string, unknown>)[column] ?? '') === String(value)) || null

              const chainedResult: any = {
                select(cols?: string) {
                  return {
                    single() {
                      return Promise.resolve({ data: updatedRecord, error: null })
                    },
                    maybeSingle() {
                      return Promise.resolve({ data: updatedRecord, error: null })
                    },
                    then(onfulfilled?: any, onrejected?: any) {
                      return Promise.resolve({ data: updatedRecord ? [updatedRecord] : [], error: null }).then(onfulfilled, onrejected)
                    }
                  }
                },
                single() {
                  return Promise.resolve({ data: updatedRecord, error: null })
                },
                maybeSingle() {
                  return Promise.resolve({ data: updatedRecord, error: null })
                },
                then(onfulfilled?: any, onrejected?: any) {
                  return Promise.resolve({ data: updatedRecord, error: null }).then(onfulfilled, onrejected)
                }
              }

              return chainedResult
            },
            then(onfulfilled?: any, onrejected?: any) {
              return Promise.resolve({ data: null, error: null }).then(onfulfilled, onrejected)
            }
          }

          return updateChain
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
