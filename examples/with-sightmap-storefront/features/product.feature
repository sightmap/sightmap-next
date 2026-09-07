Feature: Buy from a product page
  As a shopper
  I want to pick a size and quantity before adding
  So that the cart holds exactly what I meant

  Scenario: Two kilos of Ethiopia Yirgacheffe
    When I open "Ethiopia Yirgacheffe"
    Then the product page shows it at "$18.00", in stock
    When I choose the "1 kg" bag
    Then the price becomes "$60.00"
    When I set the quantity to 2
    And I add it to the cart
    And I view the cart
    Then the cart has one line: "Ethiopia Yirgacheffe" in "1 kg", quantity 2, for "$120.00"
