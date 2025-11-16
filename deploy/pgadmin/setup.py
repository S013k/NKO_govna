#!/usr/bin/env python3
import os
import json

# Читаем переменные окружения
postgres_user = os.environ.get('POSTGRES_USER', 'postgres')
postgres_password = os.environ.get('POSTGRES_PASSWORD', '')

# Читаем шаблон и подставляем переменные
with open('/tmp/servers.template.json', 'r') as f:
    template = f.read()

servers_json = template.replace('${POSTGRES_USER}', postgres_user)

# Сохраняем servers.json во временный файл
with open('/tmp/servers.json', 'w') as f:
    f.write(servers_json)

# Создаем pgpass файл
pgpass_content = f"pg-cora:5432:*:{postgres_user}:{postgres_password}\n"
with open('/tmp/pgpassfile', 'w') as f:
    f.write(pgpass_content)

os.chmod('/tmp/pgpassfile', 0o600)