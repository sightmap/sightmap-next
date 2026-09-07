Feature: Browse the catalog
  As a shopper
  I want to search, filter, and sort the shop
  So that I can find what I came for

  Scenario: Search, filter, and sort
    Given the shop shows 9 products, one of them sold out
    When I search for "kettle"
    Then only the "Pour-over kettle" is listed, at "$65.00"
    When I clear the search
    And I show only Tea
    Then 3 teas are listed and no coffee
    When I sort by price, low to high
    Then "Chamomile" is listed at "$8.00"
