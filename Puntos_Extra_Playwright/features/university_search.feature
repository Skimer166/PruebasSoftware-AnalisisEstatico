Feature: University Website Search via Internal Search Engine
  As a student
  I want to use each university's own search engine to find information
  So that I can explore academic programs and institutional content

  # Escenario 1: Buscar en Google y verificar dominio oficial
  @google_search @ddt
  Scenario Outline: Search for university on Google and verify official domain
    Given I am on the Google homepage
    When I search for "<search_term>" on Google
    And I click on the first search result
    Then I should be on the domain "<expected_domain>"

    Examples: Universities to search on Google
      | search_term                     | expected_domain |
      | ITESO universidad Guadalajara   | iteso.mx        |
      | UDG Universidad de Guadalajara  | udg.mx          |
      | Universidad Veracruzana oficial | uv.mx           |

  # Escenario 2: Buscar carreras con el buscador interno
  @site_search_programs @ddt
  Scenario Outline: Search for academic programs using university internal search
    Given I navigate directly to "<university_url>"
    When I click the search icon and type "<search_term>"
    Then I should see content related to "<expected_content>"

    Examples: Academic program searches
      | university_url          | search_term | expected_content |
      | https://www.iteso.mx/   | carreras    | carrera          |
      | https://www.udg.mx/     | carreras    | carrera          |
      | https://www.uv.mx/      | carreras    | carrera          |

  # Escenario 3: Buscar admisiones con el buscador interno
  @site_search_admissions @ddt
  Scenario Outline: Search for admissions info using university internal search
    Given I navigate directly to "<university_url>"
    When I click the search icon and type "<search_term>"
    Then I should see content related to "<expected_content>"

    Examples: Admissions searches
      | university_url          | search_term | expected_content |
      | https://www.iteso.mx/   | admision    | admisi           |
      | https://www.udg.mx/     | ingreso     | ingreso          |
      | https://www.uv.mx/      | admisiones  | admisi           |
