# Установка

Вы создаете собственную копию библиотеки. Только вы имеете доступ ко всему, что происходит в этой копии. 

Выполняется один раз. 

1. Перейдите в [Spotify Dashboard](https://developer.spotify.com/dashboard/) и нажмите `Log in`.

2. Нажмите кнопку `create app` и заполните форму как на скриншоте:

   ![Создание приложения](/img/install-step-create-app.png ':size=40%')

3. Перейдите к [библиотеке в Apps Script](https://script.google.com/d/1DnC4H7yjqPV2unMZ_nmB-1bDSJT9wQUJ7Wq-ijF4Nc7Fl3qnbT0FkPSr/edit?usp=sharing). Войдите в Google аккаунт, если потребуется.

4. Выберите слева в раскрывающемся меню `Общие сведения`. 

   ![Открыть меню](/img/general-property.gif ':size=60%')

   На открывшейся странице, справа `Создать копию`. Откроется копия, созданная на вашем аккаунте. Переименуйте, если нужно (нажать на имя вверху страницы).
   
    ![Создать копию](/img/install-step-copy.png)

5. Перейдите в файл `config.gs`. Вставьте `CLIENT_ID` и `CLIENT_SECRET` вместо слов `вашеЗначение`. Значения брать в созданном приложении Spotify на шаге 2 (кнопка settings).

   ![Client ID и Client Secret](/img/install-step-client-id2.png)

   Сохраните изменение <kbd>Ctrl</kbd><kbd>S</kbd> или иконка дискеты на панели действий

6. Запустите в редакторе выполнение функции `setProperties`. 

   ![run setProperties](/img/install-run-setProperties.png)

   Увидите всплывающее сообщение с необходимость предоставить права доступа. Согласитесь на выдачу.

   ![запрос прав](/img/install-permission-request.png ':size=50%')

   Выберите Google аккаунт, на котором создали копию библиотеки.

   ![Выбор аккаунта](/img/install-step-account.png)

   Нажмите `Дополнительные настройки`, затем `Перейти на страницу "Копия Goofy (Ver. 1)"`

   ![Выбор аккаунта](/img/install-step-warning.png ':size=50%')

   Нажмите кнопку `Разрешить` внизу окна.

   ![Выбор аккаунта](/img/install-step-grant-permissions.png)

7. Окно закроется. Выберите `Начать развертывание` - `Пробные развертывания`

   ![Развернуть веб-приложение](/img/install-step-webapp.png ':size=40%')

   В появившимся окне скопируйте ссылку. Должно заканчиваться на `dev`.

   ![Скопировать ссылку](/img/install-step-link.png)

8. В **новой вкладке** перейдите по скопированной ссылке. На открывшийся странице скопируйте ссылку внизу страницы. Оканчивается на `usercallback`.

   ![Callback-ссылка](/img/install-step-callback-link.png)

9. Вернитесь в [Spotify Dashboad](https://developer.spotify.com/dashboard/). В настройках вашего приложения `settings` спуститесь вниз и нажмите кнопку `edit`
    
    Вставьте в поле `Redirect URIs` скопированную ссылку из шага 8. Нажмите кнопку `ADD` справа, затем внизу кнопку `Save`.

10. Перейдите на вкладку из шага 8 и обновите страницу (`F5`).

    Нажмите кнопку `Выдать права доступа`.

    ![Callback-ссылка](/img/install-step-callback-link.png)

    Разрешите доступ к аккаунту Spotify.

    ![Разрешения Spotify](/img/install-step-grant-spotify.png)

    Первая установка и настройка завершены. Переходите к [первому плейлисту](/first-playlist).