#!/bin/sh
# Поднимает версию кэша в sw.js и index.html. Запускать перед КАЖДЫМ коммитом, который меняет файлы приложения:
# новый sw.js — это сигнал для установленных приложений обновиться само (без кнопок).
set -e
cd "$(dirname "$0")"
cur=$(grep -o "wx-v[0-9]*" sw.js | head -1 | tr -dc 0-9)
new=$((cur + 1))
sed -i "s/wx-v$cur/wx-v$new/; s/?v=$cur/?v=$new/g" sw.js
sed -i "s/?v=$cur/?v=$new/g" index.html
echo "версия $cur -> $new"
