# Player

Методы управления плеером.

| Метод | Тип результата | Краткое описание |
|-------|----------------|------------------|
| [addToQueue](/reference/player?id=addtoqueue) | - | Добавить треки в очередь воспроизведения. |
| [getAvailableDevices](/reference/player?id=getavailabledevices) | Массив | Получить список доступных устройств. |
| [getPlayback](/reference/player?id=getplayback) | Объект | Получить данные плеера, включая играющий трек. |
| [next](/reference/player?id=next) | - | Перейти к следующему треку в очереди. |
| [pause](/reference/player?id=pause) | - | Остановить воспроизведение текущего плеера. |
| [previous](/reference/player?id=previous) | - | Перейти к предыдущему треку в очереди. |
| [resume](/reference/player?id=resume) | - | Продолжить воспроизведение текущей очереди или создать новую очередь. |
| [setRepeatMode](/reference/player?id=setrepeatmode) | - | Установить режим повтора. |
| [toggleShuffle](/reference/player?id=toggleshuffle) | - | Переключить режим перемешивания очереди. |
| [transferPlayback](/reference/player?id=transferplayback) | - | Отправить текущий плейбэк на другое устройство. |

## addToQueue

Добавить треки в очередь воспроизведения. Эквивалент _играть следующим_ в интерфейсе Spotify.

### Аргументы :id=addtoqueue-arguments {docsify-ignore}

| Имя | Тип | Описание |
|-----|-----|----------|
| `items` | Массив/Объект | Массив треков или объект трека для добавления в очередь. Значимо только _id_. |
| `deviceId` | Строка | Идентификатор устройства. Необязательно при активном воспроизведении. |

### Возврат :id=addtoqueue-return {docsify-ignore}

Нет возвращаемого значения.

### Примеры :id=addtoqueue-examples {docsify-ignore}

1. Играть следующим последний добавленный лайк.

```js
let tracks = Source.getSavedTracks(1);
Player.addToQueue(tracks[0]);
```

## getAvailableDevices

Получить список доступных устройств (подключены к Spotify в данный момент). Используйте для получения _id_ устройства. Значение из `getPlayback` достаточно быстро становится пустым при паузе.

### Аргументы :id=getavailabledevices-arguments {docsify-ignore}

Аргументов нет.

### Возврат :id=getavailabledevices-return {docsify-ignore}

`devices` (массив) - доступные устройства. [Пример массива](https://developer.spotify.com/documentation/web-api/reference/#endpoint-get-a-users-available-devices).

### Примеры :id=getavailabledevices-examples {docsify-ignore}

1. Отбор устройства по типу. `Smartphone` для телефона, `Computer` для ПК.

```js
let device = Player.getAvailableDevices().find(d => d.type == 'Smartphone');
// device.id
```

## getPlayback

Получить данные плеера, включая играющий трек. При паузе достаточно быстро становится пустым.

### Аргументы :id=getplayback-arguments {docsify-ignore}

Аргументов нет.

### Возврат :id=getplayback-return {docsify-ignore}

`playback` (объект) - данные плеера. [Пример объекта](https://developer.spotify.com/documentation/web-api/reference/#endpoint-get-information-about-the-users-current-playback).

### Примеры :id=getplayback-examples {docsify-ignore}

[Пример использования](https://github.com/Chimildic/goofy/discussions/102)

## next

Перейти к следующему треку в очереди.

### Аргументы :id=next-arguments {docsify-ignore}

Аргументов нет.

### Возврат :id=next-return {docsify-ignore}

Нет возвращаемого значения.

## pause

Остановить воспроизведение текущего плеера.

### Аргументы :id=pause-arguments {docsify-ignore}

Аргументов нет.

### Возврат :id=pause-return {docsify-ignore}

Нет возвращаемого значения.

## previous

Перейти к предыдущему треку в очереди.

### Аргументы :id=previous-arguments {docsify-ignore}

Аргументов нет.

### Возврат :id=previous-return {docsify-ignore}

Нет возвращаемого значения.

## resume

Продолжить воспроизведение текущей очереди или создать новую очередь.

### Аргументы :id=resume-arguments {docsify-ignore}

| Имя | Тип | Описание |
|-----|-----|----------|
| `params` | Объект | Параметры очереди. |

#### Параметры очереди :id=resume-arguments {docsify-ignore}

| Имя | Тип | Описание |
|-----|-----|----------|
| `deviceId` | Строка | Идентификатор устройства. Необязательно при активном воспроизведении. |
| `context_uri` | Строка | Воспроизведение по URI, например плейлист или альбом. |
| `tracks` | Массив | Создать новую очередь с треками. Используется либо `context_uri`, либо `tracks`. |
| `position_ms` | Число | Задать прогресс трека в миллисекундах. |
| `offset` | Число | Задать активный трек в очереди `{ "position": 5 }`. Отсчет от нуля. |

### Возврат :id=resume-return {docsify-ignore}

Нет возвращаемого значения.

### Примеры :id=resume-examples {docsify-ignore}

1. Продолжить воспроизведение после паузы.

```js
Player.pause();
Utilities.sleep(5000);
Player.resume();
```

2. Создать очередь из любимых треков

```js
let tracks = Source.getSavedTracks();
Player.resume({
    tracks: tracks
});
```

3. Воспроизвести плейлист по URI

```js
let playlistId = '37i9dQZF1DWYmDNATMglFU';
Player.resume({
    context_uri: `spotify:playlist:${playlistId}`,
});
```

## setRepeatMode

Установить режим повтора.

### Аргументы :id=setrepeatmode-arguments {docsify-ignore}

| Имя | Тип | Описание |
|-----|-----|----------|
| `state` | Строка | При `track` повторяет текущий трек, при `context` текущую очередь, при `off` отключено. |
| `deviceId` | Строка | Идентификатор устройства. Необязательно при активном воспроизведении. |

### Возврат :id=setrepeatmode-return {docsify-ignore}

Нет возвращаемого значения.

## toggleShuffle

Переключить режим перемешивания очереди.

### Аргументы :id=toggleshuffle-arguments {docsify-ignore}

| Имя | Тип | Описание |
|-----|-----|----------|
| `state` | Строка | При `true` включает перемешивание, при `false` выключает. |
| `deviceId` | Строка | Идентификатор устройства. Необязательно при активном воспроизведении. |

### Возврат :id=toggleshuffle-return {docsify-ignore}

Нет возвращаемого значения.

## transferPlayback

Отправить текущий плейбэк на другое устройство (т.е. очередь и играющий трек, [getPlayback](/reference/player?id=getplayback)).

### Аргументы :id=transferplayback-arguments {docsify-ignore}

| Имя | Тип | Описание |
|-----|-----|----------|
| `deviceId` | Строка | _id_ нового устройства. Доступные значения можно получить, например, через [getAvailableDevices](/reference/player?id=getavailabledevices). |
| `isPlay` | Булево | При `true` начнется воспроизведение на новом устройстве. Когда не указано или `false` состояние останется таким же, как на прошлом устройстве. |

### Возврат :id=transferplayback-return {docsify-ignore}

Нет возвращаемого значения.

### Примеры :id=transferplayback-examples {docsify-ignore}

[Пример использования](https://github.com/Chimildic/goofy/discussions/126)
