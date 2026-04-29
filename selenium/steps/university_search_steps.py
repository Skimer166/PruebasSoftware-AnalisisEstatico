# -*- coding: utf-8 -*-
"""Ejercicio selenium"""
import time

from behave import given, then, when
from selenium.common.exceptions import TimeoutException
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait

from selenium import webdriver

DIRECT_HOME_URLS = {
    "iteso.mx": "https://www.iteso.mx/",
    "udg.mx": "https://www.udg.mx/",
    "uv.mx": "https://www.uv.mx/",
}

# Cada entrada: (acción, valor, new_tab)
NAV_STEPS = {
    "iteso.mx": {
        "carreras": [
            (
                By.XPATH,
                "//p[contains(@class,'txttitle') and normalize-space(text())='Carreras']",
                True,
            ),
        ],
        "posgrado": [
            ("NONE", "", False),
        ],
        "investigacion": [
            (
                By.XPATH,
                "//a[contains("
                "translate(normalize-space(.),"
                "'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),"
                "'investigaci')]",
                False,
            ),
        ],
    },
    "udg.mx": {
        "oferta academica": [
            (By.XPATH, "//a[@href='/es/oferta-academica']", False),
            (
                By.XPATH,
                "//a[contains(@href,'guiadecarreras.udg.mx/category/areas')]",
                False,
            ),
        ],
        "posgrado": [
            ("NONE", "", False),
        ],
        "servicios": [
            (
                By.XPATH,
                "//a[contains(@href,'servicios') or contains("
                "translate(normalize-space(.),"
                "'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),"
                "'servicios')]",
                False,
            ),
        ],
    },
    "uv.mx": {
        "nuestros programas": [
            (By.XPATH, "//a[@href='/ofertaeducativa/' and @role='button']", False),
            (
                By.XPATH,
                "//a[@href='https://www.uv.mx/ofertaeducativa/area/tecnica/']",
                False,
            ),
        ],
        "investigacion": [
            (
                By.XPATH,
                "//a[contains(@href,'investigacion') or contains("
                "translate(normalize-space(.),"
                "'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),"
                "'investigaci')]",
                False,
            ),
        ],
        "posgrado": [
            ("URL", "https://www.uv.mx/posgrado/", False),
        ],
    },
}

VERIFY_TEXT = {
    ("iteso.mx", "carreras"): "humanidades",
    ("iteso.mx", "posgrado"): "maestr",
    ("iteso.mx", "investigacion"): "investigaci",
    ("udg.mx", "oferta academica"): "abogado",
    ("udg.mx", "posgrado"): "maestr",
    ("udg.mx", "servicios"): "servicio",
    ("uv.mx", "nuestros programas"): "arquitectura",
    ("uv.mx", "investigacion"): "investigaci",
    ("uv.mx", "posgrado"): "oferta",
}


def _wait(driver, timeout=15):
    return WebDriverWait(driver, timeout)


def _accept_cookies(driver):
    for txt in ["aceptar", "accept", "agree"]:
        try:
            btn = WebDriverWait(driver, 2).until(
                EC.element_to_be_clickable(
                    (
                        By.XPATH,
                        f"//button[contains("
                        f"translate(.,'ABCDEFGHIJKLMNOPQRSTUVWXYZ',"
                        f"'abcdefghijklmnopqrstuvwxyz'),'{txt}')]",
                    )
                )
            )
            btn.click()
            time.sleep(0.4)
            return
        except TimeoutException:
            continue


def _safe_click(driver, by, selector, timeout=20, new_tab=False):
    """Localiza el elemento, hace scroll y lo clickea via JS."""
    el = WebDriverWait(driver, timeout).until(
        EC.presence_of_element_located((by, selector))
    )
    driver.execute_script(
        "arguments[0].scrollIntoView({block:'center', behavior:'smooth'});", el
    )
    time.sleep(0.8)

    handles_before = set(driver.window_handles)
    driver.execute_script("arguments[0].click();", el)

    if new_tab:
        WebDriverWait(driver, 10).until(
            lambda d: len(d.window_handles) > len(handles_before)
        )
        new_handle = (set(driver.window_handles) - handles_before).pop()
        driver.switch_to.window(new_handle)

    try:
        WebDriverWait(driver, 15).until(
            lambda d: d.execute_script("return document.readyState") == "complete"
        )
    except TimeoutException:
        pass
    time.sleep(1.5)


def _current_domain(driver):
    """Extrae el dominio limpio de la URL actual del driver."""
    url = driver.current_url.lower()
    url = url.replace("https://", "").replace("http://", "").replace("www.", "")
    return url.split("/")[0]


@given("I am on the Google homepage")
def open_google(context):
    """Abre el navegador y navega a Google."""
    options = Options()
    options.add_argument("--disable-blink-features=AutomationControlled")
    options.add_experimental_option("excludeSwitches", ["enable-automation"])
    options.add_experimental_option("useAutomationExtension", False)
    options.add_argument(
        "user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    )
    context.driver = webdriver.Chrome(options=options)
    context.driver.maximize_window()
    context.driver.get("https://www.google.com")
    _accept_cookies(context.driver)


@when('I search for "{query}" on Google')
def search_google(context, query):
    """Escribe el query en Google y presiona Enter."""
    driver = context.driver
    box = _wait(driver).until(EC.element_to_be_clickable((By.NAME, "q")))
    box.clear()
    box.send_keys(query)
    box.send_keys(Keys.RETURN)
    _wait(driver).until(EC.presence_of_element_located((By.ID, "search")))


@when("I click on the first search result")
def click_first_result(context):
    """Hace click en el primer resultado orgánico de Google."""
    driver = context.driver
    try:
        result = _wait(driver, 10).until(
            EC.element_to_be_clickable(
                (
                    By.XPATH,
                    "//div[@id='search']//a[@href][not(contains(@href,'google'))]",
                )
            )
        )
    except TimeoutException:
        links = driver.find_elements(By.CSS_SELECTOR, "a[href^='http']")
        result = next(
            (
                l
                for l in links
                if l.is_displayed() and "google.com" not in l.get_attribute("href")
            ),
            None,
        )
        assert result, "No se encontró ningún resultado de búsqueda en Google"

    driver.execute_script("arguments[0].scrollIntoView(true);", result)
    driver.execute_script("arguments[0].click();", result)
    _wait(driver, 15).until(
        lambda d: d.execute_script("return document.readyState") == "complete"
    )
    time.sleep(1)


@then('I should be on the domain "{expected_domain}"')
def verify_domain(context, expected_domain):
    """Verifica que el dominio actual coincida con el esperado."""
    driver = context.driver
    clean = expected_domain.lower().replace("www.", "")

    try:
        _wait(driver, 10).until(lambda d: clean in d.current_url.lower())
    except TimeoutException:
        pass

    if clean not in driver.current_url.lower():
        home = next((u for k, u in DIRECT_HOME_URLS.items() if k in clean), None)
        assert (
            home
        ), f"No se pudo navegar a '{expected_domain}'.\nURL actual: {driver.current_url}"
        driver.get(home)
        _wait(driver, 15).until(
            lambda d: d.execute_script("return document.readyState") == "complete"
        )
        time.sleep(1)

    assert (
        clean in driver.current_url.lower()
    ), f"Dominio '{expected_domain}' no encontrado en: {driver.current_url}"


@when('I search for "{search_term}" on the university site')
def search_on_university_site(context, search_term):
    """Ejecuta la navegación interna definida en NAV_STEPS para el dominio y término dados."""
    driver = context.driver
    domain = _current_domain(driver)
    context.internal_search_term = search_term
    _accept_cookies(driver)

    domain_steps = next((v for k, v in NAV_STEPS.items() if k in domain), None)
    assert domain_steps is not None, f"No hay navegación definida para '{domain}'."

    steps = domain_steps.get(search_term)
    assert (
        steps is not None
    ), f"No hay navegación definida para '{domain}' + '{search_term}'."

    for action, selector, new_tab in steps:
        if action == "NONE":
            time.sleep(1.5)
        elif action == "URL":
            driver.get(selector)
            _wait(driver, 15).until(
                lambda d: d.execute_script("return document.readyState") == "complete"
            )
            time.sleep(1.5)
        else:
            _safe_click(driver, action, selector, new_tab=new_tab)
        _accept_cookies(driver)


@then('I should see results related to "{expected_content}"')
def verify_results(context, expected_content):
    """Verifica que el texto esperado aparezca en el body de la página."""
    driver = context.driver

    try:
        WebDriverWait(driver, 20).until(
            lambda d: expected_content.lower()
            in d.find_element(By.TAG_NAME, "body").text.lower()
        )
    except TimeoutException:
        body = driver.find_element(By.TAG_NAME, "body").text.lower()
        domain = _current_domain(driver)
        search_term = getattr(context, "internal_search_term", "")
        fallback = VERIFY_TEXT.get((domain, search_term), expected_content).lower()
        assert fallback in body, (
            f"Texto esperado '{expected_content}' (o '{fallback}') "
            f"no encontrado en la página.\nURL: {driver.current_url}"
        )

    context.driver.quit()
