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
├── infra/
│   └── terraform/
│       ├── modules/       # vpc, eks, rds, s3-cloudfront, api-gateway
│       └── envs/          # dev, prod configurations
├── k8s/
│   ├── base/              # core K8s manifests
│   └── overlays/          # dev/prod Kustomize patches
├── argocd/                # ArgoCD application + KEDA config
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

## Deploy to AWS

### Prerequisites
- AWS CLI configured
- Terraform >= 1.5
- kubectl
- ArgoCD CLI (optional)

### Steps

1. **Create Terraform state bucket:**
   ```bash
   aws s3 mb s3://chess-puzzle-terraform-state --region us-east-1
   aws dynamodb create-table \
     --table-name terraform-locks \
     --attribute-definitions AttributeName=LockID,AttributeType=S \
     --key-schema AttributeName=LockID,KeyType=HASH \
     --billing-mode PAY_PER_REQUEST
   ```

2. **Apply Terraform:**
   ```bash
   cd infra/terraform/envs/dev
   terraform init
   terraform plan
   terraform apply
   ```

3. **Configure kubectl:**
   ```bash
   aws eks update-kubeconfig --name chess-puzzle-dev --region us-east-1
   ```

4. **Install ArgoCD:**
   ```bash
   kubectl create namespace argocd
   kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
   kubectl apply -f argocd/application.yaml
   ```

5. **Deploy frontend to S3:**
   ```bash
   cd app/frontend
   npm run build
   aws s3 sync dist/ s3://chess-puzzle-dev-frontend --delete
   ```

### Tear Down (stop billing)
```bash
cd infra/terraform/envs/dev
terraform destroy
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

## GitHub Secrets Required

| Secret | Description |
|--------|-------------|
| `AWS_ROLE_ARN` | IAM role for GitHub Actions OIDC |
| `S3_BUCKET_NAME` | Frontend S3 bucket name |
| `CLOUDFRONT_DISTRIBUTION_ID` | CloudFront distribution ID |

## License

MIT
