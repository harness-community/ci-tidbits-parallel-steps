# CI | Tidbits | Parallel Steps

> **Bite-sized how-to** | ~10 min setup

---

## What are Parallel Steps?

Harness Parallel Steps let you run multiple pipeline steps at the same time inside a single stage. Instead of waiting for each step to finish before the next one starts, all steps in a `parallel` block kick off simultaneously and the pipeline moves on only when every one of them has passed.

The most common use case is test splitting — breaking a large test suite into independent groups and running each group in its own container concurrently. Harness typically reports **3–5× faster CI runtimes** when a sequential test run is replaced with parallel steps.

**How it works:**

1. You identify independent units of work — test groups, linting, security scans, or any tasks that don't depend on each other.
2. You wrap those steps in a `parallel:` block in your pipeline YAML.
3. Harness spins up a separate container for each step at the same time.
4. The pipeline waits for all parallel steps to complete before continuing to the next sequential step.

---

## What can you run in parallel?

**Tests** — Split a large test suite into independent groups and run each group in its own container simultaneously, so total pipeline time equals the slowest group rather than the sum of all groups.

**Scans** — Run SAST, dependency checks, and container image scans at the same time instead of queuing them one after another, since none of them depend on each other's output.

**Split workloads** — Anything heavy and independent qualifies: building multiple Docker images, deploying to multiple environments, or processing data in chunks. If two steps don't need each other's output, they can run in parallel.

---

## Prerequisites

Before you start, make sure you have:

- A Harness CI pipeline (Cloud or self-hosted runner)
- A Java project using **Maven** with the Surefire plugin
- JUnit 5 tests annotated with `@Tag` so they can be filtered by group
- Maven profiles defined in `pom.xml` to select each tag group
- A Git connector pointed at your repo

---

## Step 1 — Tag your tests by group

Annotate each test class with a `@Tag` so Maven Surefire can filter them independently.

```java
@Tag("product")
class ProductServiceTest { ... }

@Tag("cart")
class CartServiceTest { ... }

@Tag("order")
class OrderServiceTest { ... }
```

---

## Step 2 — Add Maven profiles to `pom.xml`

Each profile passes its tag name to the Surefire `groups` property, so only the matching tests run.

```xml
<plugin>
  <groupId>org.apache.maven.plugins</groupId>
  <artifactId>maven-surefire-plugin</artifactId>
  <version>3.2.5</version>
  <configuration>
    <groups>${test.groups}</groups>
  </configuration>
</plugin>

<profiles>
  <profile>
    <id>product-tests</id>
    <properties><test.groups>product</test.groups></properties>
  </profile>
  <profile>
    <id>cart-tests</id>
    <properties><test.groups>cart</test.groups></properties>
  </profile>
  <profile>
    <id>order-tests</id>
    <properties><test.groups>order</test.groups></properties>
  </profile>
  <profile>
    <id>user-tests</id>
    <properties><test.groups>user</test.groups></properties>
  </profile>
  <profile>
    <id>integration-tests</id>
    <properties><test.groups>integration</test.groups></properties>
  </profile>
</profiles>
```

Verify each profile locally before wiring it into the pipeline:

```bash
mvn test -P product-tests -B
mvn test -P cart-tests -B
```

---

## Step 3 — Pipeline YAML reference

Wrap your test steps inside a `parallel:` block. Each step runs in its own container simultaneously.

```yaml
- parallel:
    - step:
        name: "Tests: Product"
        identifier: test_product
        type: Run
        spec:
          connectorRef: <YOUR_DOCKER_CONNECTOR>
          image: maven:3.9-eclipse-temurin-17
          command: mvn test -P product-tests -B
          reports:
            type: JUnit
            spec:
              paths:
                - "target/surefire-reports/*.xml"

    - step:
        name: "Tests: Cart"
        identifier: test_cart
        type: Run
        spec:
          connectorRef: <YOUR_DOCKER_CONNECTOR>
          image: maven:3.9-eclipse-temurin-17
          command: mvn test -P cart-tests -B
          reports:
            type: JUnit
            spec:
              paths:
                - "target/surefire-reports/*.xml"

    - step:
        name: "Tests: Order"
        identifier: test_order
        type: Run
        spec:
          connectorRef: <YOUR_DOCKER_CONNECTOR>
          image: maven:3.9-eclipse-temurin-17
          command: mvn test -P order-tests -B
          reports:
            type: JUnit
            spec:
              paths:
                - "target/surefire-reports/*.xml"
```

> **Tip:** Replace `<YOUR_DOCKER_CONNECTOR>` with your actual connector identifier. For Harness Cloud runners, you can omit `connectorRef` and `image`.

---

## Step 4 — Separate report directories (recommended)

When multiple steps write JUnit XML reports to the same directory, files can overwrite each other. Give each step its own output directory to avoid this.

```yaml
command: |
  mvn test -P product-tests -B \
    -Dsurefire.reportsDirectory=target/surefire-reports/product
reports:
  type: JUnit
  spec:
    paths:
      - "target/surefire-reports/product/*.xml"
```

Repeat for each parallel step using its own subdirectory (`cart`, `order`, `user`, `integration`).

---

## Step 5 — Run your pipeline and compare

1. **Trigger your pipeline.** Watch the execution graph — all five test steps start at the same time.

2. **Check the execution view.** The parallel block shows each step running concurrently with its own log stream and status indicator.

3. **Compare the timings.** The pipeline wall-clock time should be close to the slowest single group, not the sum of all groups.

```
Sequential (before):   ~50s  (10s × 5 suites, one after another)
Parallel  (after):     ~12s  (all 5 suites running at the same time)
Time saved:            ~38s  (~75% faster)
```

4. **Review test reports.** Each group's JUnit XML is collected separately and surfaced in the Harness test results tab.

---

## Common Issues & Tips

**All parallel steps show the same test results**
- Confirm each step uses a different Maven profile (`-P product-tests`, `-P cart-tests`, etc.).
- Check that `<groups>${test.groups}</groups>` is set in your Surefire configuration and that each profile sets a different value for `test.groups`.

**Tests from multiple groups appear in the same step**
- Make sure every test class has a `@Tag` annotation matching exactly one profile's group name.
- Tags are case-sensitive — `@Tag("Product")` will not match `groups=product`.

**One parallel step failing blocks the others**
- By default, Harness waits for all parallel steps to finish before marking the block as failed. All steps always run to completion — a failure in one does not cancel the others.

**Report XML files are missing or empty**
- Add `-Dsurefire.reportsDirectory=target/surefire-reports/<group>` to each command and update the `paths` in the `reports` block to match.
- Ensure `maven-surefire-plugin` version `2.22+` is specified for JUnit 5 compatibility.

---

## Other Use Cases for Parallel Steps

Parallel steps are not limited to tests. Anything that is independent can run in parallel.

### Running Scans in Parallel

Security and quality scans are a natural fit — SAST, dependency checks, and container image scans have no dependency on each other and each takes time. Running them one after another is pure waste.

```yaml
- parallel:
    - step:
        name: SAST Scan
        identifier: sast_scan
        type: Run
        spec:
          connectorRef: <YOUR_DOCKER_CONNECTOR>
          image: semgrep/semgrep
          command: semgrep scan --config auto --json > semgrep-report.json

    - step:
        name: Dependency Check
        identifier: dependency_check
        type: Run
        spec:
          connectorRef: <YOUR_DOCKER_CONNECTOR>
          image: owasp/dependency-check
          command: |
            dependency-check.sh --project myapp \
              --scan . --format JSON \
              --out dependency-report.json

    - step:
        name: Container Image Scan
        identifier: image_scan
        type: Run
        spec:
          connectorRef: <YOUR_DOCKER_CONNECTOR>
          image: aquasec/trivy
          command: trivy image --format json myapp:latest > trivy-report.json
```

All three scans run simultaneously. The pipeline moves to the next step only when all three complete, and any failure is flagged independently so you know exactly which scan caught a problem.

---

### Splitting Workloads in Parallel

Beyond tests and scans, parallel steps can split any heavy workload — building multiple Docker images, running database migrations on different environments, or processing data in chunks.

A common example is building and pushing images for multiple services at once:

```yaml
- parallel:
    - step:
        name: Build Service A
        identifier: build_service_a
        type: Run
        spec:
          connectorRef: <YOUR_DOCKER_CONNECTOR>
          image: docker:24-dind
          command: |
            docker build -t myorg/service-a:${HARNESS_BUILD_ID} ./service-a
            docker push myorg/service-a:${HARNESS_BUILD_ID}

    - step:
        name: Build Service B
        identifier: build_service_b
        type: Run
        spec:
          connectorRef: <YOUR_DOCKER_CONNECTOR>
          image: docker:24-dind
          command: |
            docker build -t myorg/service-b:${HARNESS_BUILD_ID} ./service-b
            docker push myorg/service-b:${HARNESS_BUILD_ID}

    - step:
        name: Build Service C
        identifier: build_service_c
        type: Run
        spec:
          connectorRef: <YOUR_DOCKER_CONNECTOR>
          image: docker:24-dind
          command: |
            docker build -t myorg/service-c:${HARNESS_BUILD_ID} ./service-c
            docker push myorg/service-c:${HARNESS_BUILD_ID}
```

The rule of thumb is simple: **if two steps don't need each other's output, they can run in parallel.**

---

## What's next?

- **Dynamic parallelism** — Use Harness matrix strategies to generate parallel steps from a list without repeating YAML blocks.
- **Mix all three** — Combine test splitting, security scans, and workload splitting in a single `parallel:` block. Tests, SAST, and Docker builds all fire at once — the pipeline only moves forward when everything is green.

---

## Resources

- [Harness Developer Hub — Parallel Steps](https://developer.harness.io/docs/continuous-integration/use-ci/optimize-and-more/parallelize-ci-pipelines/)
- [Run step reference](https://developer.harness.io/docs/continuous-integration/use-ci/run-step-settings/)
- [Harness CI overview](https://developer.harness.io/docs/continuous-integration/)

---

# E-Commerce Application — Harness Parallel Steps Demo

A Java Spring Boot e-commerce platform with a comprehensive unit test suite
designed to demonstrate **Harness Parallel Steps** in a CI pipeline.

---

## Project Structure

```
ecommerce-app/
├── .harness/
│   └── pipeline.yaml                    — Harness CI pipeline with parallel test steps
├── src/
│   ├── main/java/com/harness/ecommerce/
│   │   ├── model/
│   │   │   ├── Product.java             — Product entity with stock management
│   │   │   ├── User.java                — User entity
│   │   │   ├── Cart.java                — Shopping cart
│   │   │   ├── CartItem.java            — Cart line item
│   │   │   ├── Order.java               — Order with status lifecycle
│   │   │   └── OrderItem.java           — Order line item with price snapshot
│   │   ├── repository/                  — Spring Data JPA repositories
│   │   ├── service/
│   │   │   ├── ProductService.java      — Inventory, search, activate/deactivate
│   │   │   ├── CartService.java         — Cart management
│   │   │   ├── OrderService.java        — Checkout and order lifecycle
│   │   │   └── UserService.java         — User management
│   │   ├── controller/                  — REST controllers for all entities
│   │   ├── config/
│   │   │   └── CorsConfig.java          — CORS configuration
│   │   └── exception/                   — Custom exceptions
│   ├── main/resources/
│   │   ├── static/index.html            — Complete frontend (plain HTML/CSS/JS)
│   │   ├── data.sql                     — Seed data (1 user, 12 products)
│   │   └── application.properties      — H2 database and server config
│   └── test/java/com/harness/ecommerce/
│       ├── service/
│       │   ├── ProductServiceTest.java      — @Tag("product")
│       │   ├── CartServiceTest.java         — @Tag("cart")
│       │   ├── OrderServiceTest.java        — @Tag("order")
│       │   └── UserServiceTest.java         — @Tag("user")
│       └── integration/
│           └── CheckoutIntegrationTest.java — @Tag("integration")
└── pom.xml                              — Maven build with 5 Surefire profiles
```

---

## Test Coverage (55 tests across 5 groups)

| Test Class                    | Tag           | Tests | What it covers                                     |
| ----------------------------- | ------------- | ----- | -------------------------------------------------- |
| `ProductServiceTest`          | `product`     | 16    | CRUD, search, stock updates, activate/deactivate   |
| `CartServiceTest`             | `cart`        | 8     | Add/remove items, quantity updates, cart totals    |
| `OrderServiceTest`            | `order`       | 13    | Checkout, status transitions, cancellation, totals |
| `UserServiceTest`             | `user`        | 10    | Registration, lookup, update, deactivation         |
| `CheckoutIntegrationTest`     | `integration` | 8     | End-to-end cart → order → stock deduction flow     |

---

## Running the Tests

```bash
# Run all tests
mvn test

# Run a single group
mvn test -P product-tests -B
mvn test -P cart-tests -B
mvn test -P order-tests -B
mvn test -P user-tests -B
mvn test -P integration-tests -B
```

---

## Running the Application

```bash
mvn spring-boot:run
```

Open `http://localhost:8080`. No npm, no Node.js, no separate terminal — the plain HTML/CSS/JS frontend is served directly by Spring Boot. The H2 in-memory database seeds itself automatically from `data.sql` on every startup.

---

## How to Use with Harness Parallel Steps

1. Import `.harness/pipeline.yaml` into your Harness project
2. Replace the placeholder values in the YAML:
   - `<YOUR_PROJECT_ID>` — your Harness project identifier
   - `<YOUR_ORG_ID>` — your Harness org identifier
   - `<YOUR_DOCKER_CONNECTOR>` — a Docker Hub or registry connector
   - `<YOUR_GIT_CONNECTOR>` — a GitHub/GitLab connector pointing at this repo
3. Trigger the pipeline — the Compile step runs first, then all 5 test suites fire simultaneously
4. Watch the execution graph to see all parallel steps running at the same time
5. Compare the wall-clock time against running `mvn test` sequentially to see the savings

### Example Parallel Savings

| Run mode             | Execution time | Notes                                 |
| -------------------- | -------------- | ------------------------------------- |
| Sequential           | ~50s           | Each suite waits for the previous     |
| Parallel (5 steps)   | ~12s           | All suites run simultaneously         |
| Time saved           | ~38s (~75%)    | Limited by the slowest single suite   |

---

## Tech Stack

- **Java 17** + **Spring Boot 2.7**
- **JUnit 5** + **Mockito** + **AssertJ**
- **H2** in-memory database
- **Maven** with Surefire 3.2.5
- **Harness CI** with Parallel Steps
