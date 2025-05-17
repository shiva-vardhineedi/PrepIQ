# 🚀 PrepIQ Deployment Guide (AWS ECS + EC2 + ECR + Route53)

This guide ensures your full-stack EduRAG project is correctly deployed using AWS services via GitHub Actions.

---

## ✅ Prerequisites (Before Deployment)

### 1. 🛠️ AWS Resource Setup

#### a. Create ECR Repositories:
```bash
aws ecr create-repository --repository-name majorproject/backend-prepiq
aws ecr create-repository --repository-name majorproject/frontend-prepiq
```

#### b. Default VPC and Subnets:
Ensure your AWS account has a default VPC in `us-east-2`:
```bash
aws ec2 describe-vpcs --filters Name=isDefault,Values=true
aws ec2 describe-subnets --filters Name=vpc-id,Values=<vpc-id>
```
Save:
- `DEFAULT_VPC_ID`
- `DEFAULT_SUBNET_IDS` (comma-separated, e.g. `subnet-abc,subnet-def`)

#### c. Hosted Zone in Route 53:
- Domain: `prepiq.online`
- Save: `HOSTED_ZONE_ID`

Ensure domain points to Route 53 name servers.

---

### 2. 🔑 GitHub Secrets

Navigate to **GitHub Repo > Settings > Secrets and variables > Actions** and add:

| Name                     | Value                            |
|--------------------------|----------------------------------|
| `AWS_ACCESS_KEY_ID`      | IAM user's access key ID         |
| `AWS_SECRET_ACCESS_KEY`  | IAM user's secret key            |
| `DEFAULT_VPC_ID`         | VPC ID                           |
| `DEFAULT_SUBNET_IDS`     | Subnet IDs (comma-separated)     |
| `HOSTED_ZONE_ID`         | Hosted Zone ID                   |
| `GROQ_API_KEY`           | Groq model API key               |

---

### 3. 🛣️ Project Structure

```
.
├── .github/workflows/deploy.yml
├── Backend/
├── Frontend/quiz_application/
├── infra-provision/
│   ├── infra.yaml
│   └── infra-ui.yaml
```

Ensure all folder paths are accurate.

---

## 🚀 Deployment Process

### Trigger:
Triggered on push to `main` branch:
```yaml
on:
  push:
    branches: [main]
```

### Steps:
1. Checkout code  
2. Install AWS CLI  
3. Configure AWS credentials  
4. Login to ECR  
5. Build and push backend image  
6. Deploy backend ECS + ALB stack  
7. Get ALB DNS for backend  
8. Build and push frontend image  
9. Get latest Amazon Linux AMI  
10. Deploy frontend EC2 + ALB + Route53 stack  

---

## 🔮 Post-Deployment

- Visit `https://prepiq.online`  
- Test backend via ALB DNS + `/api/`  
- Check ECS Cluster: `EduRAG-Cluster`  
- Monitor logs: CloudWatch `/ecs/edurag-backend`  
- Confirm EC2 instance is running  

---

## 🛠️ Troubleshooting

- **Domain not resolving?**
  - Check DNS propagation, Route53 alias

- **Frontend not connecting to backend?**
  - Verify `REACT_APP_API_URL` points to ALB DNS

- **ECS not stable?**
  - Confirm `/api/` returns HTTP 200

- **Frontend EC2 unreachable?**
  - Check `/var/log/user-data.log` in EC2 instance
  - Verify `docker run` command succeeded

---

You're now ready to confidently deploy and manage your EduRAG full-stack project on AWS!
