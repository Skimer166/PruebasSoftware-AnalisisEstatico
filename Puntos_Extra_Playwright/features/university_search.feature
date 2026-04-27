# language: en
Feature: University Website Search
  As a student
  I want to search for a university on Google, navigate to its official site,
  and then search for academic programs on that site
  So that I can explore the available careers

  Background:
    Given I am on the Google homepage

  @ddt
  Scenario Outline: Search for university and verify academic programs
    When  I search for "<search_term>" on Google
    And   I click on the first search result
    Then  I should be on the domain "<expected_domain>"
    When  I search for "<internal_search_term>" on the university site
    Then  I should see results related to "<expected_content>"

    Examples: Universities and search terms
      | search_term              | expected_domain | internal_search_term | expected_content |
      | iteso.mx                 | iteso.mx        | carreras             | humanidades      |
      | udg                      | udg.mx          | oferta academica     | arquitectura     |
      | universidad veracruzana  | uv.mx           | nuestros programas   | arquitectura     |
