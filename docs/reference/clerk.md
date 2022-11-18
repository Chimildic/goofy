# Clerk {docsify-ignore}

Методы выполнения нескольких функций в разное время за один триггер. Подробнее в [полезном опыте](/best-practices?id=Продвинутый-триггер)

| Метод | Тип результата | Краткое описание |
|-------|----------------|------------------|
| [runOnceAfter](/reference/clerk?id=runonceafter) | Булево | Выполнять задачу каждый день после заданного времени. |
| [runOnceAWeek](/reference/clerk?id=runonceaweek) | Булево | Выполнять задачу в определенный день недели. |

## runOnceAfter

Выполнять задачу каждый день после заданного времени.

### Аргументы :id=runonceafter-arguments {docsify-ignore}

| Имя | Тип | Описание |
|-----|-----|----------|
| `timeStr` | Строка | Время, после которого задача запускается один раз. |
| `callback` | Функция | Выполняемая функция. Имя функции обязано быть уникальным среди всех функций, вызываемых _Clerk_. |

### Возврат :id=runonceafter-return {docsify-ignore}

`isRun` (булево) - при `true` функция выполнялась, при `false` функция не запускалась.

### Примеры :id=runonceafter-examples {docsify-ignore}

1. Выполнить три функции в разное время за один триггер

```js
// Триггер каждый час
function updatePlaylists() {
    updateEveryHour() // каждый час
    Clerk.runOnceAfter('15:00', updateInDay) // раз в день
    Clerk.runOnceAfter('21:00', updateInEvening) // раз в день

    function updateEveryHour() {
        // ...
    }

    function updateInDay() {
        // ...
    }

    function updateInEvening() {
        // ...
    }
}
```

## runOnceAWeek

Выполнять задачу в определенный день недели.

### Аргументы :id=runonceaweek-arguments {docsify-ignore}

| Имя | Тип | Описание |
|-----|-----|----------|
| `dayStr` | Строка | День недели на английском. |
| `timeStr` | Строка | Время, после которого задача запускается один раз. |
| `callback` | Функция | Выполняемая функция. Имя функции обязано быть уникальным среди всех функций, вызываемых _Clerk_. |

### Возврат :id=runonceaweek-return {docsify-ignore}

`isRun` (булево) - при `true` функция выполнялась, при `false` функция не запускалась.

### Примеры :id=runonceaweek-examples {docsify-ignore}

1. Выполнить три функции в разное время за один триггер

```js
// Триггер каждые 15 минут
function updatePlaylists() {
    update15() // каждые 15 минут
    Clerk.runOnceAWeek('monday', '12:00', updateMonday) // каждый понедельник после 12
    Clerk.runOnceAWeek('saturday', '16:00', updateSaturday) // каждую субботу после 16

    function update15() {
        // ...
    }

    function updateMonday() {
        // ...
    }

    function updateSaturday() {
        // ...
    }
}
```