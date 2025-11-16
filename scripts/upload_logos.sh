#!/bin/bash

# ===================================================================================
# УНИВЕРСАЛЬНЫЙ СКРИПТ ДЛЯ СИНХРОНИЗАЦИИ ЛОКАЛЬНЫХ ПАПОК С S3 БАКЕТАМИ
#
# Что он делает:
# 1. Находит все папки в директории S3_INIT_DIR.
# 2. Для каждой папки (которая является именем бакета) находит все файлы внутри.
# 3. Загружает в соответствующий бакет только те файлы, которых там еще нет.
# ===================================================================================

# --=[ Настройки цветов для красивого вывода ]=--
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# --=[ Настройки логирования ]=--
LOG_FILE="s3_sync.log"
> "$LOG_FILE" # Очищаем старый лог-файл перед запуском
exec > >(tee -a "$LOG_FILE") # Весь вывод будет и в консоль, и в файл
exec 2>&1

# --=[ Вспомогательные функции для вывода сообщений ]=--
log()     { echo -e "${BLUE}[INFO]${NC}  [$(date '+%H:%M:%S')] $1"; }
success() { echo -e "${GREEN}[OK]${NC}    [$(date '+%H:%M:%S')] $1"; }
warning() { echo -e "${YELLOW}[WARN]${NC}  [$(date '+%H:%M:%S')] $1"; }
error()   { echo -e "${RED}[ERROR]${NC} [$(date '+%H:%M:%S')] $1"; }
header()  { echo -e "\n${YELLOW}==================== $1 ====================${NC}"; }

### ================================================================================
### ГЛАВНЫЕ НАСТРОЙКИ
### ================================================================================

# Определяем, где лежит сам скрипт, чтобы найти корень проекта
SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
PROJECT_ROOT="$SCRIPT_DIR/.."

# ПАПКА, ИЗ КОТОРОЙ БУДЕМ БРАТЬ ДАННЫЕ ДЛЯ ЗАГРУЗКИ
# Имена подпапок здесь должны совпадать с именами бакетов.
S3_INIT_DIR="$PROJECT_ROOT/s3init"

API_BASE_URL="http://localhost:9990"

### ================================================================================

setup_variables() {
    header "ШАГ 1: НАСТРОЙКА ПЕРЕМЕННЫХ"
    
    ENV_FILE="$PROJECT_ROOT/backend/.env"
    if [ -f "$ENV_FILE" ]; then
        log "Читаем переменные из файла: $ENV_FILE"
        while IFS= read -r line || [[ -n "$line" ]]; do
            if [[ ! "$line" =~ ^# && "$line" ]]; then
                export "$line"
            fi
        done < <(sed 's/\r$//' "$ENV_FILE")
    else
        error "Файл окружения не найден по пути: $ENV_FILE"; exit 1;
    fi
        
    API_BASE_URL="$HOST:$PORT/api"

    success "Настройка завершена. API endpoint: $API_BASE_URL"
}

check_api_availability() {
    header "ШАГ 2: ПРОВЕРКА ДОСТУПНОСТИ API"
    
    HEALTH_CHECK_URL="$API_BASE_URL/s3/health"
    log "Проверяю URL: $HEALTH_CHECK_URL"
    
    if curl --connect-timeout 5 -s -f "$HEALTH_CHECK_URL" > /dev/null; then
        success "API сервер доступен."
    else
        error "Не могу достучаться до API по адресу $HEALTH_CHECK_URL"
        error "Убедитесь, что ваше backend-приложение запущено."
        exit 1;
    fi
}

# --=[ 3. ОСНОВНОЙ ЦИКЛ СИНХРОНИЗАЦИИ ]=--
sync_all_buckets() {
    header "ШАГ 3: СИНХРОНИЗАЦИЯ ПАПОК И БАКЕТОВ"
    
    if [ ! -d "$S3_INIT_DIR" ]; then
        warning "Директория для инициализации '$S3_INIT_DIR' не найдена. Пропускаем синхронизацию."
        return
    fi

    # Проходимся по каждой подпапке в S3_INIT_DIR
    for BUCKET_DIR in "$S3_INIT_DIR"/*; do
        if [ -d "$BUCKET_DIR" ]; then
            # Имя папки = имя бакета
            local BUCKET_NAME
            BUCKET_NAME=$(basename "$BUCKET_DIR")
            
            log "--- Начало работы с бакетом: '$BUCKET_NAME' ---"
            
            # 3.1 Проверяем, что бакет существует на сервере
            local BUCKET_URL="$API_BASE_URL/s3/$BUCKET_NAME/"
            local http_code
            http_code=$(curl -s -o /dev/null -w "%{http_code}" "$BUCKET_URL")
            
            if [ "$http_code" -ne 200 ]; then
                error "Бакет '$BUCKET_NAME' не найден (код: $http_code). Пропускаем."
                warning "  Убедитесь, что имя папки совпадает с именем бакета в .env"
                continue
            fi
            
            # 3.2 Получаем список файлов, которые уже есть в бакете
            log "Получаем список существующих файлов в бакете..."
            local response
            response=$(curl -s "$BUCKET_URL")
            
            local EXISTING_FILES=()
            if command -v jq &> /dev/null && echo "$response" | jq . > /dev/null 2>&1; then
                mapfile -t EXISTING_FILES < <(echo "$response" | jq -r '.[].filename')
            else
                EXISTING_FILES=($(echo "$response" | grep -o '"filename": *"[^"]*"' | cut -d '"' -f 4))
            fi
            log "Найдено ${#EXISTING_FILES[@]} файлов в бакете."

            # 3.3 Проходимся по локальным файлам и загружаем недостающие
            log "Поиск и загрузка новых файлов из '$BUCKET_DIR'..."
            local uploaded_count=0
            local skipped_count=0
            
            # ИЗМЕНЕНО: Исправлена конструкция цикла, чтобы он не "ломал" внешний цикл for.
            # Вместо `find | while` используется `while < <(find)`.
            while IFS= read -r FILE_PATH; do
                # Пропускаем пустые строки, которые может вернуть find
                if [ -z "$FILE_PATH" ]; then
                    continue
                fi

                # Получаем относительный путь файла, который будет именем объекта в S3
                local OBJECT_NAME
                OBJECT_NAME=$(realpath --relative-to="$BUCKET_DIR" "$FILE_PATH")

                if [[ " ${EXISTING_FILES[*]} " =~ " ${OBJECT_NAME} " ]]; then
                    # Файл уже есть, пропускаем
                    ((skipped_count++))
                else
                    # Файла нет, загружаем
                    log "  -> Загрузка: '$OBJECT_NAME'"
                    local UPLOAD_URL="$API_BASE_URL/s3/upload/$BUCKET_NAME"
                    
                    local upload_response
                    upload_response=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
                        -X POST \
                        -F "file=@$FILE_PATH;filename=$OBJECT_NAME" \
                        "$UPLOAD_URL")
                        
                    if echo "$upload_response" | grep -q "HTTP_CODE:201"; then
                        ((uploaded_count++))
                    else
                        error "    Ошибка загрузки '$OBJECT_NAME'. Ответ сервера:"
                        echo "$upload_response"
                    fi
                fi
            done < <(find "$BUCKET_DIR" -type f) # Конец исправленной конструкции
            
            success "Бакет '$BUCKET_NAME': загружено $uploaded_count новых файлов, пропущено $skipped_count существующих."
        fi
    done
}

# --=[ ГЛАВНАЯ ФУНКЦИЯ ]=--
main() {
    header "ЗАПУСК СКРИПТА СИНХРОНИЗАЦИИ S3"
    
    setup_variables
    check_api_availability
    sync_all_buckets
    
    header "РАБОТА ЗАВЕРШЕНА"
    success "Скрипт успешно отработал."
}

# --=[ Запуск скрипта ]=--
main
