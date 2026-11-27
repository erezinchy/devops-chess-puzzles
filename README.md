# Chess Puzzle Trainer

A mobile-first Progressive Web App for chess puzzle training, built to showcase modern DevOps practices and cloud-native architecture.

## Architecture

```
                    ┌─────────────┐
                    │  CloudFront │
                    │   (CDN)     │
                    └──────┬──────┘
                           │
              ┌────────────┴────────────┐
              │                         │
      ┌───────▼───────┐       ┌────────▼────────┐
      │  S3 Bucket    │       │  API Gateway    │
      │  (Frontend)   │       │                 │
      └───────────────┘       └────────┬────────┘
                                       │
                              ┌────────▼────────┐
                              │   EKS Cluster   │
                              │                 │
                              │  ┌───────────┐  │
                              │  │  Backend  │  │
                              │  │  Pods     │  │
                              │  └─────┬─────┘  │
                              │        │        │
                              │  ┌─────▼─────┐  │
                              │  │  ArgoCD   │  │
                              │  │  KEDA     │  │
                              │  │  Karpenter│  │
                              │  └───────────┘  │
                              └────────┬────────┘
                                       │
                              ┌────────▼────────┐
                              │  RDS PostgreSQL │
                              └─────────────────┘
```

## Tech Stack

### Application
- **Frontend:** React + Vite (PWA with offline support)
- **Backend:** Node.js + Express
- **Database:** PostgreSQL
- **Chess Logic:** chess.js + react-chessboard

### Infrastructure (AWS)
- **IaC:** Terraform (modular, multi-environment)
- **Container Orchestration:** EKS (Kubernetes)
- **Container Registry:** ECR
- **CDN:** CloudFront + S3
- **API Gateway:** AWS API Gateway (HTTP API)
- **Database:** RDS PostgreSQL

### DevOps
- **CI/CD:** GitHub Actions
- **GitOps:** ArgoCD (auto-sync from manifests repo)
- **Autoscaling:** Karpenter (nodes) + KEDA (pods)
- **Monitoring:** Prometheus + Grafana (planned)
- **Containerization:** Docker (multi-stage builds)

## Project Structure

```
devops-portfolio-project/
├── app/
│   ├── frontend/          # React PWA
│   │   ├── src/
│   │   │   ├── components/  # ChessBoard, Layout
│   │   │   ├── pages/       # Home, Puzzle, Leaderboard, Profile, Login
│   │   │   └── services/    # API client
│   │   ├── Dockerfile
│   │   └── vite.config.js
│   └── backend/           # Node.js API
│       ├── src/
│       │   ├── routes/      # health, puzzles, users, scores
│       │   ├── models/      # db connection, SQL schema
│       │   └── services/    # puzzle importer
│       └── Dockerfile
├── terraform/
│   ├── modules/           # vpc, eks
│   └── environments/      # dev, prod configurations
├── k8s/
│   ├── base/              # core K8s manifests
│   └── overlays/          # dev/prod Kustomize patches
├── helm/                  # Helm chart (chess-puzzle)
├── k8s/argocd/            # ArgoCD application + project
├── k8s/autoscaling/       # KEDA + Karpenter configs
├── .github/
│   └── workflows/         # CI pipeline + Terraform automation
├── docker-compose.yaml    # Local development
└── README.md
```

## Quick Start (Local Development)

### Prerequisites
- Docker & Docker Compose
- Node.js 20+

### Run locally with Docker Compose
```bash
docker-compose up -d
```
This starts PostgreSQL, the backend API, and the frontend. Open http://localhost:5173.

### Run without Docker
```bash
# Terminal 1 - Backend
cd app/backend
cp .env.example .env
npm install
npm run dev

# Terminal 2 - Frontend
cd app/frontend
npm install
npm run dev
```

## Deploy to EKS

Infra: Terraform creates VPC + EKS + Spot nodes. App: Helm deploys backend/frontend/postgres pods. Data: seeded from git on each spin-up.

```bash
# 1. Provision infrastructure (~15 min)
cd terraform/environments/dev
terraform init && terraform apply

# 2. Connect kubectl
aws eks update-kubeconfig --region us-east-1 --name chess-puzzle-dev

# 3. Build & push images to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com
docker build -t <ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/chess-backend app/backend
docker build -t <ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/chess-frontend app/frontend
docker push <ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/chess-backend
docker push <ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/chess-frontend

# 4. Deploy with Helm
helm install chess-puzzle helm/chess-puzzle -f helm/chess-puzzle/values-dev.yaml -n chess-puzzle --create-namespace

# 5. Seed database
cat app/backend/src/models/schema.sql | kubectl exec -i postgres-0 -n chess-puzzle -- psql -U chess -d chess_puzzles
cat app/backend/src/models/seed.sql | kubectl exec -i postgres-0 -n chess-puzzle -- psql -U chess -d chess_puzzles

# 6. Get public URL (open on phone too)
kubectl get svc frontend -n chess-puzzle

# 7. Tear down when done ($0 after destroy)
cd terraform/environments/dev && terraform destroy
```

## Features

- **Daily Puzzle** — A new chess puzzle every day
- **Random Puzzles** — Practice at any difficulty level
- **Scoring & Streaks** — Track your solving stats
- **Leaderboard** — Compete with other players
- **PWA** — Install on your phone, works offline
- **Puzzle Database** — Powered by Lichess open puzzles

## Cost Estimate

| Running | Dormant | Destroyed |
|---------|---------|-----------|
| ~$150/mo (24/7) | ~$75/mo (EKS control plane) | $0/mo |
| ~$5-10/weekend demo | — | — |

Recommended: `terraform apply` when demoing, `terraform destroy` when done.

## Planned Improvements

- Replace nginx Ingress with **Gateway API** + AWS LB Controller for native K8s routing
- Add **Istio Ambient Mesh** for mTLS and traffic management (no sidecar overhead)
- Migrate from HPA to **KEDA** for event-driven autoscaling (HTTP rate, queue depth)
- Add **Karpenter** for intelligent node autoscaling with Spot instances
- Replace Cluster Autoscaler with Karpenter-managed node pools
- Add **OpenTelemetry** → Grafana for unified observability (traces, metrics, logs)
- Add **External Secrets Operator** + IRSA for secure secret management
- Add **Cognito** authentication with JWT for user accounts and progress tracking
- Add **ArgoCD** auto-sync for zero-touch GitOps deployments
- Add **Crossplane** for managing AWS resources as K8s CRDs

## GitHub Secrets Required

| Secret | Description |
|--------|-------------|
| `AWS_ROLE_ARN` | IAM role for GitHub Actions OIDC |
| `S3_BUCKET_NAME` | Frontend S3 bucket name |
| `CLOUDFRONT_DISTRIBUTION_ID` | CloudFront distribution ID |

## License

MIT
