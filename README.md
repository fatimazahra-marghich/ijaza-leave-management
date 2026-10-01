# Ijaza (إجازة) – Système de Gestion des Congés Administratifs

Application web sur mesure pour la gestion et le suivi automatisé des congés administratifs au sein de la Wilaya, en conformité avec la réglementation de la fonction publique marocaine.

---

## 🚀 Rôles et Fonctionnalités

L'application repose sur un contrôle d'accès basé sur les rôles (RBAC) avec **4 profils utilisateurs** :

* 👤 **Employé** : Consultation des soldes (acquis, consommés, report $N-1$), dépôt de demandes avec calcul des jours ouvrables, upload de justificatifs, suivi et annulation.
* 👨‍💼 **Chef de Service** : Validation hiérarchique au **Niveau 1**, calendrier d'équipe, notifications des arrêts maladie et régularisation des soldes.
* ⚖️ **Gestionnaire RH** : Validation finale au **Niveau 2**, procédure d'expertise des arrêts maladie $> 4$ jours, gestion globale des soldes et des autorisations (pèlerinage), rapports statistiques.
* 🛠️ **Administrateur** : Annuaire des agents (matricules), gestion de la structure organisationnelle (divisions/services), calendrier des jours fériés marocains et paramétrage des types de congé.

---

## 🛠️ Stack Technique

* **Backend** : Django REST Framework (Python)
* **Frontend** : React.js, Tailwind CSS
* **Base de données** : PostgreSQL
* **Authentification** : JWT (JSON Web Tokens)

---

## ⚙️ Installation Rapide

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Sur Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env      # Configurer vos identifiants PostgreSQL
python manage.py migrate
python manage.py runserver