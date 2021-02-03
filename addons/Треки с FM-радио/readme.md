## Описание

Аддон позволяет получить треки с радиостанций в двух категориях: топ-100 и за день (не более недели).

## Установка

1. Создайте новый скрипт и скопируйте в него содержимое `radio.js`.
2. Добавьте внешнюю библиотеку к проекту Apps Script, указав идентификатор `1ReeQ6WO8kKNxoaA_O0XEQ589cIrRvEBA9qcWpNqdOP17i47u6N9M5Xh0`. В новом интерфейсе, кнопка `+` в левом блоке `Библиотеки`.

![Распределение значений acousticness](/docs/img/cheerio.png)

## Пример использования

Данные берутся с сайта [top-radio](https://top-radio.ru). Найдите на нем желаемую станцию и скопируйте ее название из адресной строки. 

Например, для ссылки: `https://top-radio.ru/web/evropa-plyus` названием будет `evropa-plyus`

```js
let topTracks = Radio.getTopTracks('energy');
let tracks = Radio.getTracks('evropa-plyus', '2021-02-01');
```