import { createClient } from '@supabase/supabase-js'
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
  password: string;
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
  created_at: string;
};

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(rawUrl && supabaseAnonKey)

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
    // Ignora falhas locais de armazenamento em ambientes restritos.
  }
}

function getDemoDrivers(): DemoDriver[] {
  return readStorage(DEMO_DRIVERS_KEY, [])
}

function setDemoDrivers(drivers: DemoDriver[]) {
  writeStorage(DEMO_DRIVERS_KEY, drivers)
}

function getDemoAccounts(): Array<{ email: string; password: string; userId: string }> {
  return readStorage(DEMO_ACCOUNTS_KEY, [])
}

function setDemoAccounts(accounts: Array<{ email: string; password: string; userId: string }>) {
  writeStorage(DEMO_ACCOUNTS_KEY, accounts)
}

function createDemoSession(user: DemoUser): DemoSession {
  const session: DemoSession = {
    access_token: `demo-access-token-${user.id}`,
    refresh_token: `demo-refresh-token-${user.id}`,
    expires_in: 3600,
    expires_at: Date.now() + 3600 * 1000,
    token_type: 'bearer',
    user,
  }

  writeStorage(DEMO_SESSION_KEY, session)
  return session
}

function readDemoSession(): DemoSession | null {
  return readStorage<DemoSession | null>(DEMO_SESSION_KEY, null)
}

function clearDemoSession() {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(DEMO_SESSION_KEY)
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

function createMockSupabase() {
  return {
    auth: {
      async signUp({ email, password }: { email: string; password: string }) {
        const normalizedEmail = email.trim().toLowerCase()
        const accounts = getDemoAccounts()
        const alreadyExists = accounts.some((account) => account.email === normalizedEmail)

        if (alreadyExists) {
          return {
            data: { user: null },
            error: { message: 'Este e-mail já está cadastrado no ambiente local.' },
          }
        }

        const userId = `demo-driver-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
        const nextAccounts = [...accounts, { email: normalizedEmail, password, userId }]
        setDemoAccounts(nextAccounts)

        const user = buildDemoUser(userId, normalizedEmail)
        const session = createDemoSession(user)

        return { data: { user, session }, error: null }
      },

      async signInWithPassword({ email, password }: { email: string; password: string }) {
        const normalizedEmail = email.trim().toLowerCase()
        const account = getDemoAccounts().find(
          (entry) => entry.email === normalizedEmail && entry.password === password,
        )

        if (!account) {
          return {
            data: { user: null, session: null },
            error: { message: 'E-mail ou senha incorretos.' },
          }
        }

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
          callback('SIGNED_IN', session)
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
      const loadTable = () => {
        if (table === 'motoristas') {
          return getDemoDrivers()
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
            id: String((item as DemoDriver).id || `demo-driver-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`),
            email: String((item as DemoDriver).email || ''),
            password: String((item as DemoDriver).password || 'demo123'),
            status: ((item as DemoDriver).status as 'Pendente' | 'Aprovado' | 'Reprovado') || 'Pendente',
            created_at: new Date().toISOString(),
          }))

          persistTable([...records, ...nextRecords])
          return { error: null }
        },

        select() {
          const baseFilters: Array<(record: DemoDriver) => boolean> = []

          const methods = {
            eq(column: string, value: string) {
              baseFilters.push((record) => String((record as Record<string, unknown>)[column] ?? '') === String(value))
              return methods
            },
            order(column: string) {
              const records = loadTable().filter((record) => baseFilters.every((predicate) => predicate(record)))
              const sorted = [...records].sort((a, b) => {
                const left = String((a as Record<string, unknown>)[column] ?? '')
                const right = String((b as Record<string, unknown>)[column] ?? '')
                return left.localeCompare(right)
              })
              return Promise.resolve({ data: sorted, error: null })
            },
            maybeSingle() {
              const records = loadTable().filter((record) => baseFilters.every((predicate) => predicate(record)))
              return Promise.resolve({ data: records[0] ?? null, error: null })
            },
          }

          return methods
        },

        update(values: Record<string, unknown>) {
          return {
            async eq(column: string, value: string) {
              const records = loadTable().map((record) => {
                if (String((record as Record<string, unknown>)[column] ?? '') === String(value)) {
                  return { ...record, ...values }
                }
                return record
              })

              persistTable(records)
              return { error: null }
            },
          }
        },
      }
    },
  }
}

const browserClient = isSupabaseConfigured ? createBrowserClient(browserUrl, browserKey) : createMockSupabase()

export const supabase = browserClient as any
