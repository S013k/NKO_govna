#!/bin/bash

# Скрипт для загрузки логотипов Росатома в S3 хранилище через API приложения
# Проверяет наличие файлов в бакете и загружает только отсутствующие

set -e  # Выход при ошибке

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Логирование
LOG_FILE="scripts/upload_logos.log"
exec > >(tee -a "$LOG_FILE")
exec 2>&1

# Функция для вывода с меткой времени
log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Проверка зависимостей
check_dependencies() {
    log "Проверка зависимостей..."
    
    if ! command -v curl &> /dev/null; then
        error "curl не найден"
        exit 1
    fi
    
    if ! command -v jq &> /dev/null; then
        warning "jq не найден. Установите для парсинга JSON: brew install jq"
    fi
    
    success "Все зависимости найдены"
}

# Настройка переменных
setup_variables() {
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
    
    # Список логотипов
    LOGOS=(
        "LOGO_ROSATOM_rus_HOR_COLOR_PNG.png"
        "LOGO_ROSATOM_rus_HOR_WHITE_PNG.png"
        "LOGO_ROSATOM_rus_VERT_COLOR_PNG.png"
        "LOGO_ROSATOM_rus_VERT_WHITE_PNG.png"
    )
    
    # Возможные пути к логотипам
    LOGO_PATHS=(
        "$PROJECT_ROOT/logos"
        "$PROJECT_ROOT/frontend/public/images"
        "$PROJECT_ROOT/shrifty"
        "$PROJECT_ROOT/frontend/public/fonts"
    )
    
    # API настройки
    BUCKET_NAME="nko-logo"
    API_BASE_URL="http://localhost"
    
    # Загрузка переменных окружения
    if [ -f "$PROJECT_ROOT/backend/.env" ]; then
        source "$PROJECT_ROOT/backend/.env"
        log "Загружены переменные из backend/.env"
    else
        error "Файл backend/.env не найден"
        exit 1
    fi
    
    # Проверка переменных для API
    if [ -n "$API_HOST" ]; then
        API_BASE_URL="http://$API_HOST"
        if [ -n "$API_PORT" ]; then
            API_BASE_URL="$API_BASE_URL:$API_PORT"
        fi
    fi
    
    log "API endpoint: $API_BASE_URL"
    log "Bucket: $BUCKET_NAME"
}

# Проверка доступности API
check_api_availability() {
    log "Проверка доступности API..."
    
    if curl -s -o /dev/null -w "%{http_code}" "$API_BASE_URL/health" | grep -q "200"; then
        success "API доступен"
    else
        error "API недоступен по адресу $API_BASE_URL"
        error "Убедитесь, что приложение запущено"
        exit 1
    fi
}

# Поиск логотипов
find_logos() {
    log "Поиск файлов логотипов..."
    
    declare -A FOUND_LOGOS
    
    for logo in "${LOGOS[@]}"; do
        found=false
        for path in "${LOGO_PATHS[@]}"; do
            if [ -f "$path/$logo" ]; then
                FOUND_LOGOS["$logo"]="$path/$logo"
                log "Найден логотип: $logo в $path/$logo"
                found=true
                break
            fi
        done
        
        if [ "$found" = false ]; then
            warning "Логотип не найден: $logo"
        fi
    done
    
    if [ ${#FOUND_LOGOS[@]} -eq 0 ]; then
        error "Логотипы не найдены ни в одной из директорий"
        exit 1
    fi
    
    success "Найдено логотипов: ${#FOUND_LOGOS[@]}"
}

# Проверка и создание бакета через API
setup_bucket() {
    log "Проверка бакета: $BUCKET_NAME"
    
    # Проверяем существование бакета
    if curl -s -o /dev/null -w "%{http_code}" "$API_BASE_URL/s3/buckets/$BUCKET_NAME" | grep -q "200"; then
        log "Бакет уже существует"
    else
        log "Создание бакета: $BUCKET_NAME"
        if curl -s -X POST "$API_BASE_URL/s3/buckets/$BUCKET_NAME" | grep -q "created"; then
            success "Бакет создан"
        else
            error "Ошибка создания бакета"
            exit 1
        fi
    fi
}

# Получение списка файлов в бакете через API
get_existing_files() {
    log "Получение списка файлов в бакете..."
    
    EXISTING_FILES=()
    
    # Получаем список объектов и парсим JSON
    response=$(curl -s "$API_BASE_URL/s3/buckets/$BUCKET_NAME/objects")
    
    if command -v jq &> /dev/null; then
        # Используем jq для парсинга JSON
        while IFS= read -r filename; do
            EXISTING_FILES+=("$filename")
        done < <(echo "$response" | jq -r '.[].name' 2>/dev/null || true)
    else
        # Fallback: простой парсинг без jq
        while IFS= read -r line; do
            if [[ $line =~ \"name\":\s*\"([^\"]+)\" ]]; then
                EXISTING_FILES+=("${BASH_REMATCH[1]}")
            fi
        done < <(echo "$response")
    fi
    
    log "Файлов в бакете: ${#EXISTING_FILES[@]}"
}

# Загрузка логотипов через API
upload_logos() {
    log "Загрузка логотипов через API..."
    
    uploaded_count=0
    skipped_count=0
    
    for logo in "${LOGOS[@]}"; do
        if [ -n "${FOUND_LOGOS[$logo]}" ]; then
            logo_path="${FOUND_LOGOS[$logo]}"
            
            # Проверяем, есть ли файл уже в бакете
            if [[ " ${EXISTING_FILES[*]} " =~ " ${logo} " ]]; then
                log "Файл уже существует в S3, пропускаем: $logo"
                ((skipped_count++))
                continue
            fi
            
            log "Загрузка: $logo ($(stat -f%z "$logo_path" 2>/dev/null || stat -c%s "$logo_path" 2>/dev/null || echo "unknown") bytes)"
            
            # Загружаем файл через API
            response=$(curl -s -X POST \
                -F "bucket_name=$BUCKET_NAME" \
                -F "object_name=$logo" \
                -F "file_data=@$logo_path" \
                -F "content_type=image/png" \
                "$API_BASE_URL/s3/upload")
            
            # Проверяем результат загрузки
            if echo "$response" | grep -q "uploaded successfully\|success\|created"; then
                success "Загружен: $logo"
                ((uploaded_count++))
            else
                error "Ошибка загрузки: $logo"
                error "Ответ API: $response"
            fi
        fi
    done
    
    log "Загрузка завершена. Загружено: $uploaded_count, пропущено: $skipped_count"
}

# Показ итогового состояния
show_final_status() {
    log "Итоговое состояние бакета $BUCKET_NAME:"
    
    response=$(curl -s "$API_BASE_URL/s3/buckets/$BUCKET_NAME/objects")
    
    if command -v jq &> /dev/null; then
        echo "$response" | jq -r '.[] | "  - \(.name) (\(.size // "unknown") bytes)"' 2>/dev/null || true
    else
        # Fallback вывод
        while IFS= read -r line; do
            if [[ $line =~ \"name\":\s*\"([^\"]+)\" ]]; then
                filename="${BASH_REMATCH[1]}"
                log "  - $filename"
            fi
        done < <(echo "$response")
    fi
}

# Главная функция
main() {
    log "Начало загрузки логотипов Росатома в S3 через API"
    echo "========================================"
    
    check_dependencies
    setup_variables
    check_api_availability
    find_logos
    setup_bucket
    get_existing_files
    upload_logos
    show_final_status
    
    echo "========================================"
    success "Загрузка логотипов завершена"
}

# Запуск
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi