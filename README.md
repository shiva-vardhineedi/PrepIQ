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

should be able to see this dashboard on successful login:

![image](https://github.com/user-attachments/assets/39ac95d1-1209-4718-ab5e-92990eec545f)

Then upon clicking **BROWSE TOPICS** you should land on the below screen where you can:
* search topics
* create new topic
* favourite your topic
* select topic and create quiz with below mockups


![image](https://github.com/user-attachments/assets/07aa9f39-9ba4-4723-a4db-b9323fd9febe)
![image](https://github.com/user-attachments/assets/be9672f8-d823-4319-9ff7-054836f216a8)
![image](https://github.com/user-attachments/assets/1375ad98-ff07-476c-aace-1e6b702e6997)
![image](https://github.com/user-attachments/assets/eea0cd80-8431-4e9a-956d-9ab7da4ed3ac)

Then upon completion...you get your scores with answers to review and feedback

![image](https://github.com/user-attachments/assets/74c00d1a-eed9-4fc6-8e15-fc2faa132a16)
![image](https://github.com/user-attachments/assets/20ec5046-6d4b-462c-9cd3-69a9cd8fa06d)

You can also access your previous quiz from the list in dashboard:

![image](https://github.com/user-attachments/assets/2a79d005-2b28-4d69-a0a4-47a46130c0b9)








