import os
from pathlib import Path
from dotenv import load_dotenv

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# Chargement des variables d'environnement depuis le fichier .env
load_dotenv(BASE_DIR / ".env")


# 1. Clé secrète obligatoire (lève une erreur claire si absente du .env)
SECRET_KEY = os.environ["DJANGO_SECRET_KEY"]

# 2. Mode Debug basé uniquement sur DJANGO_DEBUG (conforme au .env.example)
DEBUG = os.environ.get("DJANGO_DEBUG", "False") == "True"

# 3. ALLOWED_HOSTS nettoyé avec .strip() pour éviter les erreurs d'espaces
ALLOWED_HOSTS = [h.strip() for h in os.environ.get("ALLOWED_HOSTS", "localhost,127.0.0.1").split(",")]


# Application definition

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # Third party apps
    'corsheaders',
    'rest_framework',
    'rest_framework_simplejwt',

    # Apps locales
    'users',
    'organisation',
    'conges',
    'notifications',
    'audit',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    # CsrfViewMiddleware désactivé intentionnellement : l'API utilise une authentification Stateless par jetons JWT
    # 'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'


# Database configuration dynamique via .env (DB_PASSWORD est maintenant obligatoire)
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.environ.get("DB_NAME", "gestion_conges"),
        'USER': os.environ.get("DB_USER", "postgres"),
        'PASSWORD': os.environ["DB_PASSWORD"],
        'HOST': os.environ.get("DB_HOST", "localhost"),
        'PORT': os.environ.get("DB_PORT", "5432"),
    }
}


# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# Internationalization
LANGUAGE_CODE = 'fr-fr'

TIME_ZONE = 'Africa/Casablanca'

USE_I18N = True

USE_TZ = True

# Type de clé primaire par défaut (évite les avertissements W042)
DEFAULT_AUTO_FIELD = 'django.db.models.AutoField'


# Static & Media files
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'


# Custom User Model
AUTH_USER_MODEL = 'users.Utilisateur'


# Configuration Email pour le développement
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'


# Configuration CORS explicite pour React/Vite
CORS_ALLOWED_ORIGINS = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:3000',
]

CSRF_TRUSTED_ORIGINS = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
]


# Rest Framework & JWT
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
}