# Установка и настройка

Вы создаете собственную копию библиотеки. Только вы имеете доступ ко всему, что происходит в этой копии. 

## Первая установка

Выполняется один раз. [Видео инструкция](https://drive.google.com/file/d/13I_E9g5x_Gb-G-KANmzUxLgDv-bPkQsu/view).

1. Перейдите в [Spotify Dashboard](https://developer.spotify.com/dashboard/). Нажмите `Log in` и авторизируйтесь в Spotify. Примите условия использования.

   ![Условия использования](/img/install-step-dashboard-term.png)

2. Нажмите кнопку `Create an app`. Введите произвольное имя и описание. Поставьте галочки. Нажмите кнопку `Create`.

   ![Создание приложения](/img/install-step-create-app.png)

3. Перейдите к [библиотеке в Apps Script](https://script.google.com/d/1DnC4H7yjqPV2unMZ_nmB-1bDSJT9wQUJ7Wq-ijF4Nc7Fl3qnbT0FkPSr/edit?usp=sharing). Войдите в Google аккаунт, если потребуется.

4. Выберите `Файл` - `Создать копию`. Откроется копия, созданная на вашем аккаунте. Переименуйте, если нужно (`Файл` - `Переименовать`).

    ![Создать копию](/img/install-step-copy.png)

5. Перейдите в файл `config.gs`. Вставьте `CLIENT_ID` и `CLIENT_SECRET` вместо слов `вашеЗначение`. Значения брать в созданном приложении на шаге 2.

   Сохраните изменение `Файл` - `Сохранить` или `Ctrl + S`

   ![Client ID и Client Secret](/img/install-step-client-id2.png)

6. Запустите в редакторе выполнение функции `setProperties`. 

   ![run setProperties](/img/install-run-setProperties.png)

   Увидите всплывающее сообщение с необходимость предоставить права доступа. Согласитесь на выдачу.

   ![запрос прав](/img/install-permission-request.png)

   Выберите Google аккаунт, на котором создали копию библиотеки.

   ![Выбор аккаунта](/img/install-step-account.png)

   Нажмите `Дополнительные настройки`, затем `Перейти на страницу "Копия Goofy (Ver. 1)"`

   ![Выбор аккаунта](/img/install-step-warning.png)

   Нажмите кнопку `Разрешить` внизу окна.

   ![Выбор аккаунта](/img/install-step-grant-permissions.png)

7. Окно закроется. Выберите `Опубликовать` - `Развернуть как веб-приложение`

   ![Развернуть веб-приложение](/img/install-step-webapp.png)

   В появившимся окне выделите и скопируйте всю ссылку в первом поле. Должно заканчиваться на `exec`.

   ![Скопировать ссылку](/img/install-step-link.png)

   Закройте форму (кнопка `Отмена` или крестик).

8. В **новой вкладке** перейдите по скопированной ссылке. На открывшийся странице скопируйте ссылку внизу страницы. Оканчивается на `usercallback`.

   ![Callback-ссылка](/img/install-step-callback-link.png)

9. Вернитесь в [Spotify Dashboad](https://developer.spotify.com/dashboard/). Нажмите кнопку `EDIT SETTINGS` у вашего приложения.
    
    Вставьте в поле `Redirect URIs` скопированную ссылку из шага 8. Нажмите кнопку `ADD`. Затем внизу кнопку `Save`.
    
    ![Добавить callback](/img/install-step-dashboard-redirect.png)

10. Перейдите на вкладку из шага 8 и обновите эту страницу (`F5`).

    Нажмите кнопку `Authorize`.

    ![Callback-ссылка](/img/install-step-callback-link.png)

    Разрешите доступ к аккаунту Spotify.

    ![Разрешения Spotify](/img/install-step-grant-spotify.png)

    Должны появиться слова о успешном выполнении.

    Первая установка и настройка завершены.

## Настройка Lastfm

Если не используется, выполнять не нужно.

1. Создайте точку входа [здесь](https://www.last.fm/api/account/create). Заполните название и описание произвольно. Остальное пропустить, оставить пустым.
2. Полученный `API key` присвоить параметру `LASTFM_API_KEY`. 
3. Запустить в редакторе выполнение функции `setProperties`.

![Lastfm account api](/img/lastfm_account_api3.png)

## Обновить библиотеку

1. Замените все содержимое файла `library.gs` на новое (Ctrl + A, Ctrl + V), которое берется [здесь](https://github.com/Chimildic/Goofy/blob/main/library.gs) или [здесь](https://script.google.com/d/1DnC4H7yjqPV2unMZ_nmB-1bDSJT9wQUJ7Wq-ijF4Nc7Fl3qnbT0FkPSr/edit?usp=sharing) (Ctrl + A, Ctrl + C)
2. Сохраните файл: `Файл` - `Сохранить` или Ctrl + S

## Обновить параметры

1. Измените требуемый параметр в файле `config.gs`
2. Запустите в редакторе функцию `setProperties`

## Обновить права доступа

1. Вставьте следующую функцию и запустите в редакторе один раз. После можно ее удалить.
    ```js
    function resetAuth(){
        Auth.reset();
    }
    ```
2. Нажмите в верхнем меню редактора `Опубликовать` - `Развернуть как веб приложение`
3. Скопируйте ссылку из открывшегося окна и перейдите по ней в новой вкладке
4. Нажмите `Authorize` и подтвердите новые права доступа