// ── Types ───────────────────────────────────────────────────────────

export interface LearningSection {
  title: string;
  description: string;
  code?: string;
  codeComment?: string;
  goCode?: string;
  goComment?: string;
  jsCode?: string;
  jsComment?: string;
}

export interface ComparisonRow {
  go: string;
  js: string;
  note: string;
}

export interface BestPractice {
  type: "do" | "avoid" | "tip";
  title: string;
  description: string;
}

export interface StepItem {
  num: number;
  title: string;
  description: string;
  code?: string;
  codeComment?: string;
  files?: string[];
}

export interface TroubleshootRow {
  problem: string;
  cause: string;
  fix: string;
}

// ── Mermaid Diagrams ────────────────────────────────────────────────

export const goroutineLifecycleMermaid = `flowchart LR
  MAIN["main goroutine"] -->|"go func()"| GR["new goroutine"]
  GR -->|"ch <- result"| CH["channel"]
  CH -->|"<-ch"| MAIN2["main receives"]

  style MAIN fill:#1a1a2e,stroke:#7c6fcd,color:#c4bfef,stroke-width:2px
  style GR fill:#1a1a2e,stroke:#58b87a,color:#b8f0cb,stroke-width:2px
  style CH fill:#1a1a2e,stroke:#e8a83a,color:#f0ddb0,stroke-width:2px
  style MAIN2 fill:#1a1a2e,stroke:#7c6fcd,color:#c4bfef,stroke-width:2px`;

export const fanOutFanInMermaid = `flowchart TD
  INPUT["Input Tasks"] --> DISPATCH["Dispatcher"]
  DISPATCH --> W1["Worker 1"]
  DISPATCH --> W2["Worker 2"]
  DISPATCH --> W3["Worker N"]
  W1 --> COLLECT["Fan-in Collector"]
  W2 --> COLLECT
  W3 --> COLLECT
  COLLECT --> OUTPUT["Combined Results"]

  style INPUT fill:#1a1a2e,stroke:#4a8fe8,color:#b8d4f0,stroke-width:2px
  style DISPATCH fill:#1a1a2e,stroke:#e8a83a,color:#f0ddb0,stroke-width:2px
  style W1 fill:#1a1a2e,stroke:#58b87a,color:#b8f0cb,stroke-width:2px
  style W2 fill:#1a1a2e,stroke:#58b87a,color:#b8f0cb,stroke-width:2px
  style W3 fill:#1a1a2e,stroke:#58b87a,color:#b8f0cb,stroke-width:2px
  style COLLECT fill:#1a1a2e,stroke:#e8a83a,color:#f0ddb0,stroke-width:2px
  style OUTPUT fill:#1a1a2e,stroke:#4a8fe8,color:#b8d4f0,stroke-width:2px`;

export const contextPropagationMermaid = `flowchart LR
  REQ["HTTP Request"] --> MW["Middleware<br/><i>ctx + timeout</i>"]
  MW --> HANDLER["Handler<br/><i>ctx passed</i>"]
  HANDLER --> SVC["Service<br/><i>ctx passed</i>"]
  SVC --> CONN["Connector<br/><i>ctx passed</i>"]
  CONN --> EXT["External API<br/><i>ctx deadline</i>"]

  style REQ fill:#1a1a2e,stroke:#4a8fe8,color:#b8d4f0,stroke-width:2px
  style MW fill:#1a1a2e,stroke:#7c6fcd,color:#c4bfef,stroke-width:2px
  style HANDLER fill:#1a1a2e,stroke:#58b87a,color:#b8f0cb,stroke-width:2px
  style SVC fill:#1a1a2e,stroke:#e8a83a,color:#f0ddb0,stroke-width:2px
  style CONN fill:#1a1a2e,stroke:#e8705a,color:#f0c4bb,stroke-width:2px
  style EXT fill:#1a1a2e,stroke:#6b7590,color:#e8e8f0,stroke-width:2px`;

export const errorPropagationMermaid = `flowchart TD
  CONN["Connector<br/><i>returns error</i>"] --> SVC["Service<br/><i>wraps: fmt.Errorf</i>"]
  SVC --> HANDLER["Handler<br/><i>maps to HTTP status</i>"]
  HANDLER --> RESP["HTTP Response<br/><i>JSON error body</i>"]

  style CONN fill:#1a1a2e,stroke:#e8705a,color:#f0c4bb,stroke-width:2px
  style SVC fill:#1a1a2e,stroke:#e8a83a,color:#f0ddb0,stroke-width:2px
  style HANDLER fill:#1a1a2e,stroke:#7c6fcd,color:#c4bfef,stroke-width:2px
  style RESP fill:#1a1a2e,stroke:#4a8fe8,color:#b8d4f0,stroke-width:2px`;

export const middlewareChainMermaid = `flowchart LR
  REQ["Request"] --> AUTH["Auth"]
  AUTH --> LOG["Logging"]
  LOG --> TRACE["Tracing"]
  TRACE --> RATE["Rate Limit"]
  RATE --> HANDLER["Handler"]
  HANDLER --> RESP["Response"]

  style REQ fill:#1a1a2e,stroke:#4a8fe8,color:#b8d4f0,stroke-width:2px
  style AUTH fill:#1a1a2e,stroke:#e8705a,color:#f0c4bb,stroke-width:2px
  style LOG fill:#1a1a2e,stroke:#58b87a,color:#b8f0cb,stroke-width:2px
  style TRACE fill:#1a1a2e,stroke:#7c6fcd,color:#c4bfef,stroke-width:2px
  style RATE fill:#1a1a2e,stroke:#e8a83a,color:#f0ddb0,stroke-width:2px
  style HANDLER fill:#1a1a2e,stroke:#3eb89a,color:#b8f0e0,stroke-width:2px
  style RESP fill:#1a1a2e,stroke:#4a8fe8,color:#b8d4f0,stroke-width:2px`;

export const dataOwnershipMermaid = `flowchart TD
  subgraph Services
    SUB["Subscription Service"]
    BILL["Billing Service"]
    USER["User Service"]
    NOTIF["Notification Service"]
  end

  subgraph DataStores["Data Stores"]
    SUBDB["Subscription DB<br/><i>PostgreSQL</i>"]
    BILLDB["Billing DB<br/><i>PostgreSQL</i>"]
    USERDB["User DB<br/><i>PostgreSQL</i>"]
    CACHE["Redis Cache"]
  end

  SUB --> SUBDB
  BILL --> BILLDB
  USER --> USERDB
  NOTIF --> CACHE

  style SUB fill:#1a1a2e,stroke:#4a8fe8,color:#b8d4f0,stroke-width:2px
  style BILL fill:#1a1a2e,stroke:#58b87a,color:#b8f0cb,stroke-width:2px
  style USER fill:#1a1a2e,stroke:#7c6fcd,color:#c4bfef,stroke-width:2px
  style NOTIF fill:#1a1a2e,stroke:#e8a83a,color:#f0ddb0,stroke-width:2px
  style SUBDB fill:#1a1a2e,stroke:#4a8fe8,color:#b8d4f0
  style BILLDB fill:#1a1a2e,stroke:#58b87a,color:#b8f0cb
  style USERDB fill:#1a1a2e,stroke:#7c6fcd,color:#c4bfef
  style CACHE fill:#1a1a2e,stroke:#e8a83a,color:#f0ddb0`;

export const deploymentPipelineMermaid = `flowchart LR
  GIT["Git Push"] --> CI["CI Pipeline<br/><i>lint + test + build</i>"]
  CI --> IMG["Container Image<br/><i>Docker registry</i>"]
  IMG --> ARGO["ArgoCD<br/><i>GitOps sync</i>"]
  ARGO --> K8S["Kubernetes<br/><i>rolling deploy</i>"]

  style GIT fill:#1a1a2e,stroke:#6b7590,color:#e8e8f0,stroke-width:2px
  style CI fill:#1a1a2e,stroke:#58b87a,color:#b8f0cb,stroke-width:2px
  style IMG fill:#1a1a2e,stroke:#4a8fe8,color:#b8d4f0,stroke-width:2px
  style ARGO fill:#1a1a2e,stroke:#e8a83a,color:#f0ddb0,stroke-width:2px
  style K8S fill:#1a1a2e,stroke:#7c6fcd,color:#c4bfef,stroke-width:2px`;

export const tracePropagationMermaid = `sequenceDiagram
  participant Browser
  participant BFF
  participant ServiceA as Service A
  participant ServiceB as Service B

  Browser->>BFF: Request
  Note right of BFF: Generate trace-id
  BFF->>ServiceA: + trace-id header
  ServiceA->>ServiceB: + trace-id header
  ServiceB-->>ServiceA: Response + trace-id
  ServiceA-->>BFF: Response + trace-id
  BFF-->>Browser: Response`;

// ── Go Syntax: Variables, Types & Zero Values ───────────────────────

export const typesComparisons: ComparisonRow[] = [
  { go: `var x int          // 0`, js: `let x: number      // undefined`, note: "Go has zero values; JS has undefined" },
  { go: `var s string       // ""`, js: `let s: string       // undefined`, note: "Go strings default to empty string" },
  { go: `var ok bool        // false`, js: `let ok: boolean     // undefined`, note: "Go booleans default to false" },
  { go: `name := "Alice"    // inferred`, js: `const name = "Alice"`, note: ":= is Go's shorthand for declare + assign" },
  { go: `var p *int         // nil`, js: `let p: number | null // null`, note: "Go pointers default to nil" },
];

export const zeroValuesTable: { type: string; zeroValue: string }[] = [
  { type: "int, float64", zeroValue: "0" },
  { type: "string", zeroValue: `"" (empty string)` },
  { type: "bool", zeroValue: "false" },
  { type: "*T (pointer)", zeroValue: "nil" },
  { type: "[]T (slice)", zeroValue: "nil" },
  { type: "map[K]V", zeroValue: "nil" },
  { type: "struct", zeroValue: "all fields zero-valued" },
];

export const typeInferenceCode = `// Explicit type declaration
var count int = 42
var name string = "Alice"

// Short declaration with := (type inferred)
count := 42          // int
name := "Alice"      // string
ratio := 3.14        // float64
active := true       // bool

// Constants
const maxRetries = 3
const apiURL = "https://api.example.com"

// Multiple declarations
var (
    host     string = "localhost"
    port     int    = 8080
    debug    bool   = false
)`;

// ── Go Syntax: Functions & Multiple Returns ─────────────────────────

export const functionsCode = `// Basic function
func Add(a, b int) int {
    return a + b
}

// Multiple return values — the Go way
func Divide(a, b float64) (float64, error) {
    if b == 0 {
        return 0, fmt.Errorf("division by zero")
    }
    return a / b, nil
}

// Named return values
func ParseConfig(path string) (cfg Config, err error) {
    data, err := os.ReadFile(path)
    if err != nil {
        return  // returns zero Config and the error
    }
    err = json.Unmarshal(data, &cfg)
    return      // returns cfg and err
}

// Variadic function (like JS ...rest)
func Sum(nums ...int) int {
    total := 0
    for _, n := range nums {
        total += n
    }
    return total
}

// Closures work the same as JS
func makeCounter() func() int {
    count := 0
    return func() int {
        count++
        return count
    }
}`;

export const functionsJsComparison = `// JS equivalent patterns
function divide(a, b) {
  if (b === 0) throw new Error("division by zero");
  return a / b;
}

// JS has no multiple returns — use objects or arrays
function parseConfig(path) {
  try {
    const data = fs.readFileSync(path);
    return { config: JSON.parse(data), error: null };
  } catch (err) {
    return { config: null, error: err };
  }
}

// JS rest params
function sum(...nums) {
  return nums.reduce((a, b) => a + b, 0);
}`;

// ── Go Syntax: Structs & Composition ────────────────────────────────

export const structsCode = `// Struct definition — Go's "class"
type Subscription struct {
    ID        string
    UserID    string
    PlanID    string
    Status    string
    CreatedAt time.Time
}

// Constructor pattern (NewXxx)
func NewSubscription(userID, planID string) *Subscription {
    return &Subscription{
        ID:        uuid.New().String(),
        UserID:    userID,
        PlanID:    planID,
        Status:    "pending",
        CreatedAt: time.Now(),
    }
}

// Methods are defined outside the struct
func (s *Subscription) Activate() error {
    if s.Status != "pending" {
        return fmt.Errorf("cannot activate: status is %s", s.Status)
    }
    s.Status = "active"
    return nil
}

// Embedding (composition over inheritance)
type AuditableSubscription struct {
    Subscription          // embedded — all fields/methods promoted
    UpdatedBy  string
    UpdatedAt  time.Time
}`;

export const structsJsComparison = `// JS/TS equivalent
class Subscription {
  constructor(userID, planID) {
    this.id = crypto.randomUUID();
    this.userID = userID;
    this.planID = planID;
    this.status = "pending";
    this.createdAt = new Date();
  }

  activate() {
    if (this.status !== "pending") {
      throw new Error(\`cannot activate: status is \${this.status}\`);
    }
    this.status = "active";
  }
}

// JS uses class extends (inheritance)
class AuditableSubscription extends Subscription {
  updatedBy = "";
  updatedAt = new Date();
}`;

// ── Go Syntax: Pointers, Slices & Maps ──────────────────────────────

export const pointersCode = `// Pointers — a variable that holds a memory address
x := 42
p := &x        // p is *int, points to x
fmt.Println(*p) // 42 — dereference to get the value
*p = 100        // x is now 100

// Why pointers? Avoid copying large structs
func UpdateStatus(s *Subscription, status string) {
    s.Status = status  // modifies the original, not a copy
}

// Slices — Go's dynamic arrays
names := []string{"Alice", "Bob", "Charlie"}
names = append(names, "Dave")
first := names[0]           // "Alice"
sub := names[1:3]           // ["Bob", "Charlie"]

// make() for pre-allocated slices
ids := make([]string, 0, 100)  // len=0, cap=100

// Maps — like JS objects/Map
ages := map[string]int{
    "Alice": 30,
    "Bob":   25,
}
ages["Charlie"] = 35
age, ok := ages["Dave"]     // ok=false if key doesn't exist
delete(ages, "Bob")

// make() for maps
cache := make(map[string]*Subscription)`;

export const pointersJsComparison = `// JS: objects are always passed by reference
const sub = { status: "pending" };
function updateStatus(s, status) {
  s.status = status;  // modifies original
}

// JS: arrays are dynamic by default
const names = ["Alice", "Bob", "Charlie"];
names.push("Dave");

// JS: objects/Map for key-value pairs
const ages = { Alice: 30, Bob: 25 };
ages.Charlie = 35;
const age = ages.Dave;  // undefined (not a two-value return)
delete ages.Bob;

// JS Map for non-string keys
const cache = new Map();`;

// ── Error Handling: if err != nil ───────────────────────────────────

export const errBasicsCode = `// The Go pattern: check error immediately after call
result, err := doSomething()
if err != nil {
    return fmt.Errorf("doSomething failed: %w", err)
}
// continue with result...

// vs JavaScript try/catch
// try {
//     const result = await doSomething();
// } catch (err) {
//     throw new Error(\`doSomething failed: \${err.message}\`);
// }

// Why no exceptions?
// 1. Errors are values — you can inspect, compare, wrap them
// 2. Explicit control flow — no hidden jumps up the call stack
// 3. Compiler forces you to handle (or explicitly ignore with _)
// 4. No performance cost of stack unwinding

// Explicitly ignoring an error (use sparingly!)
_ , _ = fmt.Fprintf(w, "hello")  // discard both return values`;

export const errBasicsJsCode = `// JavaScript: errors are exceptions (hidden control flow)
async function getUser(id) {
  try {
    const resp = await fetch(\`/api/users/\${id}\`);
    if (!resp.ok) throw new Error("not found");
    return await resp.json();
  } catch (err) {
    // Could be network error, JSON parse error, or our error
    // Hard to tell without checking err.message
    throw new Error(\`getUser failed: \${err.message}\`);
  }
}

// Go equivalent:
// func GetUser(ctx context.Context, id string) (*User, error) {
//     resp, err := http.Get(fmt.Sprintf("/api/users/%s", id))
//     if err != nil {
//         return nil, fmt.Errorf("fetching user: %w", err)
//     }
//     var user User
//     if err := json.NewDecoder(resp.Body).Decode(&user); err != nil {
//         return nil, fmt.Errorf("decoding user: %w", err)
//     }
//     return &user, nil
// }`;

// ── Error Handling: Wrapping & Sentinel Errors ──────────────────────

export const errWrappingCode = `// Wrapping errors with context using %w
func GetSubscription(ctx context.Context, id string) (*Subscription, error) {
    sub, err := s.repo.FindByID(ctx, id)
    if err != nil {
        return nil, fmt.Errorf("GetSubscription(%s): %w", id, err)
    }
    return sub, nil
}

// Sentinel errors — predefined error values
var (
    ErrNotFound      = errors.New("not found")
    ErrAlreadyExists = errors.New("already exists")
    ErrUnauthorized  = errors.New("unauthorized")
)

// Checking errors with errors.Is (works through wrapping)
if errors.Is(err, ErrNotFound) {
    // handle not found case
}

// Custom error types with errors.As
type ValidationError struct {
    Field   string
    Message string
}

func (e *ValidationError) Error() string {
    return fmt.Sprintf("validation: %s — %s", e.Field, e.Message)
}

var valErr *ValidationError
if errors.As(err, &valErr) {
    fmt.Printf("field %s: %s\\n", valErr.Field, valErr.Message)
}`;

// ── Error Handling: Errors in This Codebase ─────────────────────────

export const errCodebaseCode = `// Connector returns raw errors
func (c *MerchantClient) GetMerchant(ctx context.Context, id string) (*Merchant, error) {
    resp, err := c.httpClient.Get(ctx, "/merchants/"+id)
    if err != nil {
        return nil, fmt.Errorf("merchant API: %w", err)
    }
    if resp.StatusCode == 404 {
        return nil, ErrNotFound
    }
    // ...
}

// Service wraps with business context
func (s *SubscriptionService) Activate(ctx context.Context, req ActivateReq) (*Result, error) {
    merchant, err := s.merchantConn.GetMerchant(ctx, req.MerchantID)
    if err != nil {
        return nil, fmt.Errorf("activating subscription: %w", err)
    }
    // ...
}

// Handler maps to HTTP status codes
func (h *Handler) HandleActivate(w http.ResponseWriter, r *http.Request) {
    result, err := h.svc.Activate(r.Context(), req)
    if err != nil {
        switch {
        case errors.Is(err, ErrNotFound):
            http.Error(w, "not found", http.StatusNotFound)
        case errors.Is(err, ErrUnauthorized):
            http.Error(w, "unauthorized", http.StatusUnauthorized)
        default:
            http.Error(w, "internal error", http.StatusInternalServerError)
        }
        return
    }
    json.NewEncoder(w).Encode(result)
}`;

// ── Concurrency: Goroutines & Channels ──────────────────────────────

export const goroutinesCode = `// Launch a goroutine — like a lightweight thread
go func() {
    result := expensiveComputation()
    fmt.Println(result)
}()

// Channels — typed pipes for goroutine communication
ch := make(chan string)           // unbuffered channel
buffered := make(chan int, 10)    // buffered: holds up to 10 values

// Send and receive
go func() {
    ch <- "hello"     // send into channel (blocks until receiver ready)
}()
msg := <-ch           // receive from channel (blocks until sender ready)

// Practical example: parallel API calls
func FetchAll(ctx context.Context, ids []string) ([]*Subscription, error) {
    results := make(chan *Subscription, len(ids))
    errs := make(chan error, len(ids))

    for _, id := range ids {
        go func(id string) {
            sub, err := fetchSubscription(ctx, id)
            if err != nil {
                errs <- err
                return
            }
            results <- sub
        }(id)
    }

    var subs []*Subscription
    for range ids {
        select {
        case sub := <-results:
            subs = append(subs, sub)
        case err := <-errs:
            return nil, err
        }
    }
    return subs, nil
}`;

export const goroutinesJsComparison = `// JS equivalent: Promise.all for parallel operations
async function fetchAll(ids) {
  const promises = ids.map(id => fetchSubscription(id));
  return Promise.all(promises);
}

// Key difference:
// - JS is single-threaded — "concurrency" via event loop
// - Go has real parallelism — goroutines run on multiple CPU cores
// - Channels are like typed, blocking message queues
// - No callback hell, no .then() chains`;

// ── Concurrency: Fan-out, Workers & Select ──────────────────────────

export const patternsCode = `// Worker pool pattern
func ProcessBatch(ctx context.Context, items []Item) error {
    jobs := make(chan Item, len(items))
    results := make(chan error, len(items))

    // Start N workers
    for w := 0; w < 5; w++ {
        go func() {
            for item := range jobs {
                results <- processItem(ctx, item)
            }
        }()
    }

    // Send jobs
    for _, item := range items {
        jobs <- item
    }
    close(jobs)

    // Collect results
    for range items {
        if err := <-results; err != nil {
            return err
        }
    }
    return nil
}

// select statement — like Promise.race but for channels
select {
case msg := <-msgCh:
    handleMessage(msg)
case err := <-errCh:
    handleError(err)
case <-ctx.Done():
    return ctx.Err()  // timeout or cancellation
case <-time.After(5 * time.Second):
    return fmt.Errorf("operation timed out")
}`;

// ── Concurrency: Context & Cancellation ─────────────────────────────

export const contextCode = `// Every function takes ctx as first parameter — this is convention
func (s *Service) GetUser(ctx context.Context, id string) (*User, error) {
    // ctx carries deadlines, cancellation signals, and request-scoped values

    // Check if already cancelled
    if ctx.Err() != nil {
        return nil, ctx.Err()
    }

    return s.repo.FindByID(ctx, id)
}

// Creating contexts with timeout
ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
defer cancel()  // always defer cancel to release resources

result, err := service.GetUser(ctx, "user-123")
// If GetUser takes > 5s, ctx is cancelled and all downstream calls abort

// Creating contexts with cancellation
ctx, cancel := context.WithCancel(context.Background())
go func() {
    <-shutdownSignal
    cancel()  // cancels ctx and all children
}()

// Passing values in context (use sparingly — for request-scoped data only)
type contextKey string
const traceIDKey contextKey = "trace-id"

ctx = context.WithValue(ctx, traceIDKey, "abc-123")
traceID := ctx.Value(traceIDKey).(string)`;

// ── Concurrency: sync Primitives ────────────────────────────────────

export const syncCode = `// sync.WaitGroup — wait for N goroutines to finish
var wg sync.WaitGroup
for _, url := range urls {
    wg.Add(1)
    go func(url string) {
        defer wg.Done()
        fetch(url)
    }(url)
}
wg.Wait()  // blocks until all goroutines call Done()

// sync.Mutex — protect shared state
type SafeCounter struct {
    mu sync.Mutex
    v  map[string]int
}

func (c *SafeCounter) Inc(key string) {
    c.mu.Lock()
    defer c.mu.Unlock()
    c.v[key]++
}

// sync.Once — run initialization exactly once
var once sync.Once
var instance *Database

func GetDB() *Database {
    once.Do(func() {
        instance = connectToDatabase()
    })
    return instance
}

// Race detector — finds data races at test time
// go test -race ./...
// Detects when two goroutines access the same variable
// without synchronization and at least one is a write.

// t.Parallel() — run subtests concurrently
func TestOperations(t *testing.T) {
    t.Run("create", func(t *testing.T) {
        t.Parallel()
        // runs concurrently with other parallel subtests
    })
    t.Run("update", func(t *testing.T) {
        t.Parallel()
    })
}`;

// ── Interfaces & DI: Implicit Interfaces ────────────────────────────

export const interfacesCode = `// Go interfaces are IMPLICIT — no "implements" keyword
type Reader interface {
    Read(p []byte) (n int, err error)
}

// Any type with a Read method satisfies io.Reader — automatically
type MyFile struct { data []byte; pos int }

func (f *MyFile) Read(p []byte) (int, error) {
    n := copy(p, f.data[f.pos:])
    f.pos += n
    return n, nil
}
// MyFile now implements io.Reader without declaring it!

// Small interfaces are idiomatic Go
type Stringer interface {
    String() string
}

type Closer interface {
    Close() error
}

// In this codebase: connector interfaces
type MerchantConnector interface {
    GetMerchant(ctx context.Context, id string) (*Merchant, error)
}

// Real implementation satisfies it:
type MerchantClient struct { baseURL string }
func (c *MerchantClient) GetMerchant(ctx context.Context, id string) (*Merchant, error) {
    // real HTTP call
}

// Mock also satisfies it (generated by mockery):
// type MockMerchantConnector struct { mock.Mock }
// func (m *MockMerchantConnector) GetMerchant(...) ...`;

export const interfacesJsComparison = `// TypeScript: interfaces are EXPLICIT — compile-time only
interface Reader {
  read(p: Uint8Array): { n: number; err: Error | null };
}

// Must explicitly declare: class MyFile implements Reader { ... }
class MyFile implements Reader {
  read(p: Uint8Array) { /* ... */ }
}

// Key difference:
// - TS interfaces are erased at compile time
// - Go interfaces are checked at runtime too
// - Go interfaces are satisfied automatically (duck typing)
// - "Accept interfaces, return structs" — Go proverb`;

// ── Interfaces & DI: Connector Pattern Deep Dive ────────────────────

export const connectorDeepCode = `// The connector pattern in depth:
// 1. Define an interface for each external dependency
// 2. Service accepts the interface (not the concrete type)
// 3. Production main.go wires in real implementations
// 4. Tests wire in mocks generated by mockery

// Step 1: Interface
type BillingConnector interface {
    CreateCharge(ctx context.Context, req ChargeReq) (*Charge, error)
    GetCharge(ctx context.Context, id string) (*Charge, error)
    RefundCharge(ctx context.Context, id string) error
}

// Step 2: Service depends on interface
type SubscriptionService struct {
    billing  BillingConnector
    merchant MerchantConnector
    repo     SubscriptionRepository
}

func NewSubscriptionService(
    billing BillingConnector,
    merchant MerchantConnector,
    repo SubscriptionRepository,
) *SubscriptionService {
    return &SubscriptionService{
        billing:  billing,
        merchant: merchant,
        repo:     repo,
    }
}

// Step 3: Production wiring
// billing := billingclient.New(cfg.BillingURL)
// merchant := merchantclient.New(cfg.MerchantURL)
// repo := postgres.NewSubscriptionRepo(db)
// svc := service.NewSubscriptionService(billing, merchant, repo)

// Step 4: Test wiring
// mockBilling := mocks.NewMockBillingConnector(t)
// mockMerchant := mocks.NewMockMerchantConnector(t)
// mockRepo := mocks.NewMockSubscriptionRepository(t)
// svc := service.NewSubscriptionService(mockBilling, mockMerchant, mockRepo)`;

// ── Interfaces & DI: Interface Composition ──────────────────────────

export const compositionCode = `// Compose small interfaces into larger ones
type Reader interface {
    Read(p []byte) (n int, err error)
}

type Writer interface {
    Write(p []byte) (n int, err error)
}

type Closer interface {
    Close() error
}

// Compose by embedding
type ReadWriter interface {
    Reader
    Writer
}

type ReadWriteCloser interface {
    Reader
    Writer
    Closer
}

// In the codebase: compose connector interfaces
type MerchantReader interface {
    GetMerchant(ctx context.Context, id string) (*Merchant, error)
    ListMerchants(ctx context.Context, f Filter) ([]Merchant, error)
}

type MerchantWriter interface {
    CreateMerchant(ctx context.Context, m *Merchant) error
    UpdateMerchant(ctx context.Context, m *Merchant) error
}

// A service that only reads doesn't need write access
type ReportService struct {
    merchants MerchantReader  // only needs read methods
}

// A service that manages merchants needs full access
type AdminService struct {
    merchants interface {
        MerchantReader
        MerchantWriter
    }
}`;

// ── API & HTTP Patterns: Router & Middleware ─────────────────────────

export const routerCode = `// Router setup with chi (most common Go router)
func NewRouter(h *Handler, mw *Middleware) http.Handler {
    r := chi.NewRouter()

    // Global middleware
    r.Use(mw.RequestID)
    r.Use(mw.Logger)
    r.Use(mw.Recoverer)
    r.Use(mw.Timeout(30 * time.Second))

    // API routes
    r.Route("/api/v1", func(r chi.Router) {
        r.Use(mw.Auth)  // all /api/v1 routes require auth

        r.Route("/subscriptions", func(r chi.Router) {
            r.Get("/", h.ListSubscriptions)
            r.Post("/", h.CreateSubscription)
            r.Route("/{id}", func(r chi.Router) {
                r.Get("/", h.GetSubscription)
                r.Put("/", h.UpdateSubscription)
                r.Post("/activate", h.ActivateSubscription)
            })
        })
    })

    // Health check (no auth)
    r.Get("/health", h.HealthCheck)

    return r
}

// Path parameters
func (h *Handler) GetSubscription(w http.ResponseWriter, r *http.Request) {
    id := chi.URLParam(r, "id")  // extract {id} from URL
    // ...
}`;

// ── API & HTTP Patterns: Handler Patterns ───────────────────────────

export const handlersCode = `// Thin handler, fat service pattern
// Handler: parse request, call service, write response
// Service: all business logic

func (h *Handler) CreateSubscription(w http.ResponseWriter, r *http.Request) {
    // 1. Parse request
    var req CreateSubscriptionReq
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        http.Error(w, "invalid request body", http.StatusBadRequest)
        return
    }

    // 2. Validate
    if req.UserID == "" || req.PlanID == "" {
        http.Error(w, "userID and planID required", http.StatusBadRequest)
        return
    }

    // 3. Call service (all business logic lives here)
    result, err := h.svc.CreateSubscription(r.Context(), req)
    if err != nil {
        handleError(w, err)
        return
    }

    // 4. Write response
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(http.StatusCreated)
    json.NewEncoder(w).Encode(result)
}

// Centralized error handler
func handleError(w http.ResponseWriter, err error) {
    switch {
    case errors.Is(err, ErrNotFound):
        http.Error(w, "not found", http.StatusNotFound)
    case errors.Is(err, ErrConflict):
        http.Error(w, "conflict", http.StatusConflict)
    default:
        slog.Error("unhandled error", "err", err)
        http.Error(w, "internal error", http.StatusInternalServerError)
    }
}`;

// ── API & HTTP Patterns: Request/Response Encoding ──────────────────

export const encodingCode = `// Struct tags control JSON field names
type SubscriptionResponse struct {
    ID        string    \`json:"id"\`
    UserID    string    \`json:"userId"\`
    Status    string    \`json:"status"\`
    PlanID    string    \`json:"planId"\`
    CreatedAt time.Time \`json:"createdAt"\`
    ExpiresAt *time.Time \`json:"expiresAt,omitempty"\`  // omitted if nil
}

// Decoding request body
var req CreateReq
if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
    http.Error(w, "invalid JSON", http.StatusBadRequest)
    return
}

// Encoding response
w.Header().Set("Content-Type", "application/json")
json.NewEncoder(w).Encode(response)

// Custom marshaling
type Status int

const (
    StatusPending Status = iota
    StatusActive
    StatusCancelled
)

func (s Status) MarshalJSON() ([]byte, error) {
    names := map[Status]string{
        StatusPending:   "pending",
        StatusActive:    "active",
        StatusCancelled: "cancelled",
    }
    return json.Marshal(names[s])
}`;

// ── Database & Data ─────────────────────────────────────────────────

export const dataArchDescription = "Each microservice owns its own data store. Services never read another service's database directly — they call the owning service's API instead. This ensures each service can evolve its schema independently.";

export const queriesCode = `// Raw SQL with database/sql
func (r *SubscriptionRepo) FindByID(ctx context.Context, id string) (*Subscription, error) {
    var sub Subscription
    err := r.db.QueryRowContext(ctx,
        \`SELECT id, user_id, plan_id, status, created_at
         FROM subscriptions WHERE id = $1\`, id,
    ).Scan(&sub.ID, &sub.UserID, &sub.PlanID, &sub.Status, &sub.CreatedAt)

    if err == sql.ErrNoRows {
        return nil, ErrNotFound
    }
    if err != nil {
        return nil, fmt.Errorf("finding subscription %s: %w", id, err)
    }
    return &sub, nil
}

// Transactions
func (r *SubscriptionRepo) ActivateWithCharge(ctx context.Context, subID string, charge Charge) error {
    tx, err := r.db.BeginTx(ctx, nil)
    if err != nil {
        return fmt.Errorf("beginning transaction: %w", err)
    }
    defer tx.Rollback()  // no-op if committed

    _, err = tx.ExecContext(ctx,
        \`UPDATE subscriptions SET status = 'active' WHERE id = $1\`, subID)
    if err != nil {
        return fmt.Errorf("activating subscription: %w", err)
    }

    _, err = tx.ExecContext(ctx,
        \`INSERT INTO charges (id, sub_id, amount) VALUES ($1, $2, $3)\`,
        charge.ID, subID, charge.Amount)
    if err != nil {
        return fmt.Errorf("inserting charge: %w", err)
    }

    return tx.Commit()
}`;

export const migrationsCode = `// Migration file naming convention:
// migrations/
//   000001_create_subscriptions.up.sql
//   000001_create_subscriptions.down.sql
//   000002_add_status_index.up.sql
//   000002_add_status_index.down.sql

// Up migration: apply the change
-- 000001_create_subscriptions.up.sql
CREATE TABLE subscriptions (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    VARCHAR(255) NOT NULL,
    plan_id    VARCHAR(255) NOT NULL,
    status     VARCHAR(50) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);

// Down migration: reverse the change
-- 000001_create_subscriptions.down.sql
DROP TABLE IF EXISTS subscriptions;

// Running migrations
// task migrate-up          # apply all pending migrations
// task migrate-down        # rollback last migration
// task migrate-create NAME # create new migration files`;

// ── Config & Secrets ────────────────────────────────────────────────

export const configCode = `// Config struct loaded from environment variables
type Config struct {
    Port           int    \`env:"PORT"            envDefault:"8080"\`
    DatabaseURL    string \`env:"DATABASE_URL"    required:"true"\`
    MerchantAPIURL string \`env:"MERCHANT_API_URL" required:"true"\`
    BillingAPIURL  string \`env:"BILLING_API_URL"  required:"true"\`
    LogLevel       string \`env:"LOG_LEVEL"       envDefault:"info"\`
    ReadTimeout    time.Duration \`env:"READ_TIMEOUT" envDefault:"30s"\`
}

// Load and validate at startup
func LoadConfig() (*Config, error) {
    var cfg Config
    if err := env.Parse(&cfg); err != nil {
        return nil, fmt.Errorf("parsing config: %w", err)
    }

    // Validate
    if cfg.Port < 1 || cfg.Port > 65535 {
        return nil, fmt.Errorf("invalid port: %d", cfg.Port)
    }

    return &cfg, nil
}

// Usage in main.go
func main() {
    cfg, err := LoadConfig()
    if err != nil {
        log.Fatalf("config error: %v", err)
    }
    // Wire dependencies using cfg values...
}`;

export const secretsCode = `// Secrets management
// - Local dev: .env file (never committed)
// - Staging/Prod: AWS Secrets Manager or Vault

// .env.example (committed — shows required vars without values)
PORT=8080
DATABASE_URL=postgres://user:pass@localhost:5432/mydb
MERCHANT_API_URL=http://localhost:8081
BILLING_API_URL=http://localhost:8082
LOG_LEVEL=debug

// Adding a new config value:
// 1. Add field to Config struct with env tag
// 2. Add to .env.example with a sample value
// 3. Add to docker-compose.yml environment section
// 4. Add to Kubernetes deployment manifest (or Sealed Secret)
// 5. Update the config validation if needed
// 6. Document in README if it affects local dev setup`;

// ── Observability: Logging ──────────────────────────────────────────

export const loggingCode = `// Structured logging with slog (Go 1.21+)
import "log/slog"

// Use structured fields — not string interpolation
slog.Info("subscription activated",
    "subscriptionID", sub.ID,
    "userID", sub.UserID,
    "plan", sub.PlanID,
)
// Output: {"time":"...","level":"INFO","msg":"subscription activated",
//          "subscriptionID":"sub-123","userID":"u-42","plan":"plan-std"}

// Log levels and when to use them:
slog.Debug("cache hit", "key", cacheKey)       // Dev debugging only
slog.Info("request processed", "status", 200)   // Normal operations
slog.Warn("retry attempt", "attempt", 3)        // Something unexpected
slog.Error("failed to connect", "err", err)     // Action needed

// Adding context to logger
logger := slog.With("service", "subscription", "traceID", traceID)
logger.Info("processing request")  // includes service + traceID in every log

// DON'T: slog.Info(fmt.Sprintf("user %s created subscription %s", userID, subID))
// DO:    slog.Info("subscription created", "userID", userID, "subID", subID)`;

// ── Observability: Tracing ──────────────────────────────────────────

export const tracingCode = `// Distributed tracing: follow a request across services
// Trace ID is generated at the edge (BFF/gateway) and propagated

// Adding a span to a function
func (s *Service) Activate(ctx context.Context, req ActivateReq) (*Result, error) {
    ctx, span := tracer.Start(ctx, "SubscriptionService.Activate")
    defer span.End()

    span.SetAttributes(
        attribute.String("subscription.merchantID", req.MerchantID),
        attribute.String("subscription.userID", req.UserID),
    )

    merchant, err := s.merchantConn.GetMerchant(ctx, req.MerchantID)
    if err != nil {
        span.RecordError(err)
        span.SetStatus(codes.Error, err.Error())
        return nil, err
    }

    // ... rest of business logic
    return result, nil
}

// Middleware automatically creates root spans for HTTP requests
// and extracts trace-id from incoming headers`;

// ── Observability: Debugging ────────────────────────────────────────

export const debuggingScenarios: { scenario: string; tool: string; command: string }[] = [
  { scenario: "Race condition", tool: "go test -race", command: "go test -race ./..." },
  { scenario: "Memory leak", tool: "pprof heap", command: "go tool pprof http://localhost:6060/debug/pprof/heap" },
  { scenario: "CPU bottleneck", tool: "pprof cpu", command: "go tool pprof http://localhost:6060/debug/pprof/profile?seconds=30" },
  { scenario: "Deadlock", tool: "goroutine dump", command: "go tool pprof http://localhost:6060/debug/pprof/goroutine" },
  { scenario: "Test debugging", tool: "delve", command: "dlv test ./internal/service/... -- -test.run TestActivate" },
  { scenario: "Slow request", tool: "trace viewer", command: "Check Jaeger/Zipkin UI with the trace-id from logs" },
];

export const debuggingCode = `// Delve debugger — the Go equivalent of Chrome DevTools
// Install: go install github.com/go-delve/delve/cmd/dlv@latest

// Debug a test
dlv test ./internal/service/... -- -test.run TestActivate

// Debug a running service
dlv attach <pid>

// VS Code: just press F5 with the Go extension installed
// launch.json is usually pre-configured

// pprof — built-in profiling
import _ "net/http/pprof"  // register pprof handlers

// Then visit: http://localhost:6060/debug/pprof/
// - /heap         — memory allocations
// - /goroutine    — all goroutines and their stacks
// - /profile      — CPU profile (30s by default)
// - /trace        — execution trace`;

// ── Local Dev Setup ─────────────────────────────────────────────────

export const prereqsChecklist: { item: string; command: string; version: string }[] = [
  { item: "Go", command: "go version", version: "1.21+" },
  { item: "Docker & Docker Compose", command: "docker --version", version: "24+" },
  { item: "Task (task runner)", command: "task --version", version: "3+" },
  { item: "mockery", command: "mockery --version", version: "2.40+" },
  { item: "golangci-lint", command: "golangci-lint --version", version: "1.55+" },
  { item: "VS Code + Go extension", command: "code --version", version: "latest" },
];

export const runningCode = `# 1. Clone and enter the repo
git clone git@github.com:your-org/subscription-service.git
cd subscription-service

# 2. Install Go dependencies
go mod download

# 3. Start infrastructure (Postgres, Redis, Kafka)
docker-compose up -d

# 4. Run database migrations
task migrate-up

# 5. Start the service
task run
# or: go run cmd/main.go

# 6. Verify it's running
curl http://localhost:8080/health

# Useful Taskfile commands:
task run              # start the service
task test             # run all tests
task lint             # run golangci-lint
task migrate-up       # apply migrations
task migrate-down     # rollback last migration
task mock-gen         # regenerate mocks
task docker-build     # build Docker image`;

export const troubleshootTable: TroubleshootRow[] = [
  { problem: "Port 8080 already in use", cause: "Another process using the port", fix: "lsof -i :8080 | kill the PID, or change PORT in .env" },
  { problem: "go: module not found", cause: "Missing dependencies", fix: "go mod download && go mod tidy" },
  { problem: "connection refused (Postgres)", cause: "Docker containers not running", fix: "docker-compose up -d && docker-compose ps" },
  { problem: "migration failed", cause: "Dirty migration state", fix: "task migrate-down then task migrate-up, or fix the SQL" },
  { problem: "mockery: interface not found", cause: "Interface changed or moved", fix: "Check .mockery.yaml paths, then run task mock-gen" },
  { problem: "Missing env vars at startup", cause: ".env file not created", fix: "cp .env.example .env and fill in values" },
  { problem: "Tests pass locally, fail in CI", cause: "Race condition or env difference", fix: "Run go test -race -count=3 ./... locally" },
];

// ── Deployment ──────────────────────────────────────────────────────

export const deployPipelineSteps: StepItem[] = [
  { num: 1, title: "Git Push", description: "Push to main or merge a PR. This triggers the CI pipeline." },
  { num: 2, title: "CI Pipeline", description: "Lint → Unit tests → Coverage → Build Docker image. If any stage fails, the pipeline stops." },
  { num: 3, title: "Container Registry", description: "Docker image is pushed to the container registry with a tag matching the commit SHA." },
  { num: 4, title: "ArgoCD Sync", description: "ArgoCD detects the new image tag in the GitOps repo and syncs the Kubernetes manifests." },
  { num: 5, title: "Rolling Deploy", description: "Kubernetes performs a rolling update: new pods start, health checks pass, old pods terminate." },
];

export const k8sBasicsCode = `# Deployment — defines the desired state
apiVersion: apps/v1
kind: Deployment
metadata:
  name: subscription-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: subscription-service
  template:
    spec:
      containers:
      - name: app
        image: registry.example.com/subscription-service:abc123
        ports:
        - containerPort: 8080
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: url
        livenessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 5

# Service — internal load balancer
---
apiVersion: v1
kind: Service
metadata:
  name: subscription-service
spec:
  selector:
    app: subscription-service
  ports:
  - port: 80
    targetPort: 8080`;

export const rollbackCode = `# Check deployment status
kubectl rollout status deployment/subscription-service

# View deployment history
kubectl rollout history deployment/subscription-service

# Rollback to previous version
kubectl rollout undo deployment/subscription-service

# Rollback to specific revision
kubectl rollout undo deployment/subscription-service --to-revision=3

# Health checks in the codebase:
func (h *Handler) HealthCheck(w http.ResponseWriter, r *http.Request) {
    // Check database connection
    if err := h.db.PingContext(r.Context()); err != nil {
        w.WriteHeader(http.StatusServiceUnavailable)
        json.NewEncoder(w).Encode(map[string]string{
            "status": "unhealthy",
            "error":  "database unreachable",
        })
        return
    }

    w.WriteHeader(http.StatusOK)
    json.NewEncoder(w).Encode(map[string]string{
        "status": "healthy",
    })
}`;

// ── Code Review ─────────────────────────────────────────────────────

export const reviewGoPractices: BestPractice[] = [
  { type: "do", title: "Return errors, don't panic", description: "Panics crash the program. Return errors and let the caller decide how to handle them. Reserve panic for truly unrecoverable situations (e.g., programmer error in init)." },
  { type: "do", title: "Name interfaces by behavior", description: "Use -er suffix: Reader, Writer, Closer, Notifier. Keep interfaces small (1-3 methods). 'The bigger the interface, the weaker the abstraction.'" },
  { type: "do", title: "Use ctx as first parameter", description: "Every function that does I/O or may be cancelled should accept context.Context as its first parameter. This is a universal Go convention." },
  { type: "do", title: "Handle every error", description: "If you're not going to handle it, wrap it with context and return it. Never silently discard errors unless there's a documented reason (and use _ explicitly)." },
  { type: "avoid", title: "Don't use init() functions", description: "init() runs before main and makes testing harder. Prefer explicit initialization in main() or constructor functions." },
  { type: "avoid", title: "Don't export unnecessarily", description: "Start with unexported (lowercase) names. Only export what other packages actually need. This keeps the API surface small and easy to maintain." },
  { type: "avoid", title: "Don't use global state", description: "Global variables make testing hard and cause race conditions. Pass dependencies through constructor injection (the connector pattern)." },
  { type: "tip", title: "Run golangci-lint before pushing", description: "The linter catches many common mistakes. Run 'task lint' or 'golangci-lint run ./...' before every push. CI will catch it anyway, but faster to fix locally." },
];

export const reviewRepoPractices: BestPractice[] = [
  { type: "do", title: "Follow the layer structure", description: "handler → service → connector. Handlers don't call connectors directly. Services contain business logic. Connectors handle external communication." },
  { type: "do", title: "Add tests for new functions", description: "Every new public function should have a test. Use table-driven tests for multiple input scenarios. Aim for >80% coverage on service layer." },
  { type: "do", title: "Use meaningful commit messages", description: "Format: 'feat: add subscription activation endpoint' or 'fix: handle nil merchant in activation flow'. Include ticket number if applicable." },
  { type: "avoid", title: "Don't skip code review", description: "Even small changes benefit from a second pair of eyes. The reviewer might catch edge cases, naming issues, or missing tests." },
  { type: "tip", title: "Check the PR template", description: "Fill in all sections of the PR template: what changed, why, how to test, and any rollback considerations." },
];

// ── Common Tasks ────────────────────────────────────────────────────

export const addEndpointSteps: StepItem[] = [
  { num: 1, title: "Define the request/response types", description: "Create structs with JSON tags in the handler or a shared types package.", files: ["internal/handler/types.go"] },
  { num: 2, title: "Add the handler method", description: "Write a thin handler: parse request, validate, call service, write response.", files: ["internal/handler/subscription_handler.go"] },
  { num: 3, title: "Add the service method", description: "Implement business logic. Accept context and typed request, return typed response and error.", files: ["internal/service/subscription_service.go"] },
  { num: 4, title: "Register the route", description: "Add the route to the chi router setup.", files: ["internal/router/router.go"] },
  { num: 5, title: "Write tests", description: "Table-driven tests for the service method. httptest for the handler.", files: ["internal/service/subscription_service_test.go", "internal/handler/subscription_handler_test.go"] },
  { num: 6, title: "Update API docs", description: "Add the endpoint to the OpenAPI/Swagger spec if applicable.", files: ["api/openapi.yaml"] },
];

export const addConsumerSteps: StepItem[] = [
  { num: 1, title: "Define the event struct", description: "Create a struct matching the Kafka message schema.", files: ["internal/events/types.go"] },
  { num: 2, title: "Create the consumer handler", description: "Implement the message handler function that processes each event.", files: ["internal/consumer/subscription_consumer.go"] },
  { num: 3, title: "Register with the consumer group", description: "Wire the handler into the Kafka consumer group configuration.", files: ["internal/consumer/setup.go"] },
  { num: 4, title: "Add error handling", description: "Handle deserialization errors, dead-letter queue for failed messages.", files: ["internal/consumer/subscription_consumer.go"] },
  { num: 5, title: "Write tests", description: "Unit test the handler with mock messages.", files: ["internal/consumer/subscription_consumer_test.go"] },
];

export const addConnectorSteps: StepItem[] = [
  { num: 1, title: "Define the interface", description: "Create an interface in the service package for the external dependency.", files: ["internal/service/interfaces.go"] },
  { num: 2, title: "Implement the client", description: "Create the real HTTP client that satisfies the interface.", files: ["internal/connector/newservice_client.go"] },
  { num: 3, title: "Generate the mock", description: "Add to .mockery.yaml and run 'task mock-gen'.", files: [".mockery.yaml", "mocks/"] },
  { num: 4, title: "Wire in main.go", description: "Create the real client and pass it to the service constructor.", files: ["cmd/main.go"] },
  { num: 5, title: "Write tests using the mock", description: "Use the generated mock in service tests.", files: ["internal/service/subscription_service_test.go"] },
];

export const addFlagSteps: StepItem[] = [
  { num: 1, title: "Create the flag in the flag system", description: "Add a new flag in Unleash (client-side) or Go Feature Flags (server-side)." },
  { num: 2, title: "Add the flag check in code", description: "Use the SDK to check the flag value. Default to the safe/old behavior if the flag is off." },
  { num: 3, title: "Add targeting rules", description: "Configure who sees the new behavior (percentage, user segments, etc.)." },
  { num: 4, title: "Test both paths", description: "Write tests for both flag-on and flag-off scenarios." },
  { num: 5, title: "Plan flag cleanup", description: "Set a reminder to remove the flag once the feature is fully rolled out." },
];

export const debugCISteps: StepItem[] = [
  { num: 1, title: "Check the pipeline logs", description: "Find the failing stage in the CI dashboard. Read the actual error message — don't guess." },
  { num: 2, title: "Reproduce locally", description: "Run the same command locally: 'task lint', 'go test -race ./...', or 'task docker-build'." },
  { num: 3, title: "Check for flaky tests", description: "Run tests multiple times: 'go test -count=5 -race ./...'. If it's intermittent, it's likely a race condition." },
  { num: 4, title: "Check environment differences", description: "CI might have different Go version, missing env vars, or network restrictions. Check the CI config." },
  { num: 5, title: "Check for timeout issues", description: "Long-running tests may timeout in CI. Add context.WithTimeout and check for context.DeadlineExceeded." },
];

export const debugLambdaSteps: StepItem[] = [
  { num: 1, title: "Check CloudWatch logs", description: "Lambda logs go to CloudWatch. Search for the request ID or error message." },
  { num: 2, title: "Check timeout setting", description: "Lambda has a max execution time. If your function takes longer, it's killed without a clean error." },
  { num: 3, title: "Check memory allocation", description: "More memory = more CPU. If computation is slow, try increasing memory." },
  { num: 4, title: "Check cold start", description: "First invocation is slow (loading dependencies). Use provisioned concurrency for latency-sensitive functions." },
  { num: 5, title: "Test locally with SAM/Docker", description: "Use AWS SAM CLI to run the Lambda locally with a test event." },
];

// ── Overview Topic Descriptions ─────────────────────────────────────

export const topicOverviews: { group: string; description: string; color: string }[] = [
  { group: "Go Syntax (JS → Go)", description: "Side-by-side comparisons of Go and JavaScript/TypeScript. Variables, functions, structs, pointers.", color: "teal" },
  { group: "Error Handling", description: "Go's 'if err != nil' pattern — why Go chose explicit errors over exceptions.", color: "coral" },
  { group: "Concurrency", description: "Goroutines, channels, context, and sync primitives. Go's killer feature.", color: "purple" },
  { group: "Interfaces & DI", description: "Implicit interfaces and the connector pattern that structures this codebase.", color: "amber" },
  { group: "Testing", description: "Unit testing, table-driven tests, mocking, integration & load testing.", color: "green" },
  { group: "API & HTTP Patterns", description: "Router setup, middleware chains, handler patterns, request/response encoding.", color: "blue" },
  { group: "Database & Data", description: "Data ownership, SQL patterns, transactions, and migrations.", color: "teal" },
  { group: "Config & Secrets", description: "Environment-based config loading and secrets management.", color: "amber" },
  { group: "Observability", description: "Structured logging, distributed tracing, and debugging/profiling tools.", color: "coral" },
  { group: "Local Dev Setup", description: "Prerequisites, running services, and troubleshooting common issues.", color: "green" },
  { group: "Deployment", description: "CI/CD pipeline, Kubernetes basics, rollbacks, and health checks.", color: "purple" },
  { group: "Code Review", description: "Go review checklist and repo conventions for pull requests.", color: "blue" },
  { group: "Common Tasks", description: "Step-by-step guides for adding endpoints, connectors, and debugging CI.", color: "amber" },
  { group: "Go Guides", description: "In-depth markdown guides: beginner's guide, glossary, code walkthroughs.", color: "green" },
];
