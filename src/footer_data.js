window.addEventListener('load', (event) => {
    document.getElementById("portal_title").innerHTML = '«Электронное образование Республики Татарстан»';
    document.getElementById("rights_usage_conds").innerHTML = 'Все права защищены. <a href="/policies/terms">Общие условия использования</a>';
    document.getElementById("conf_policy").innerHTML = '<a href="https://edu.tatar.ru/privacy.html">Политика конфиденциальности</a>';
    document.getElementById("tech_assistance").innerHTML = 'Техподдержка: тел.: 8 (843) 525-70-99, e-mail: <a style="color:#5F9CD1" href="mailto:help.edu@tatar.ru">help.edu@tatar.ru</a>';
    document.getElementById('currentYear').innerHTML = new Date().getFullYear().toString();
});
